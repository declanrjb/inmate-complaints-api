from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
import os

from flask import Flask, jsonify, request
import math
import itertools
import flask_csv

# data processing functions
def dict_listify(dictionary):
    return {k: dictionary[k].split(',') if ',' in dictionary[k] else dictionary[k] for k in dictionary}

def dict_flatten(dictionary):
    return '_'.join([f'{k}-{dictionary[k]}' for k in dictionary])

def unique(ls):
    output = []
    for x in ls:
        if x not in output:
            output.append(x)
    return output

# begin app definition
app = Flask(__name__)

# Database connection details
database_path = os.path.join(os.path.dirname(__file__), 'database.sqlite3')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

db = SQLAlchemy(app)

# definition of the custom properties of this database
class Complaints(db.Model):
    __tablename__ = 'data'
    
    Case_Number = db.Column(db.Integer, primary_key=True)
    Case_Status = db.Column(db.String)
    Subject_Primary = db.Column(db.String)
    Subject_Secondary = db.Column(db.String)
    Facility_Occurred = db.Column(db.String)
    Facility_Received = db.Column(db.String)
    Received_Date = db.Column(db.String)
    Due_Date = db.Column(db.String)
    Latest_Status_Date = db.Column(db.String)
    Status_Reasons = db.Column(db.String)
    City = db.Column(db.String)
    State = db.Column(db.String)

    def return_fields(complaint):
        return ['Case_Number',
                'Case_Status',
                'Subject_Primary',
                'Subject_Secondary',
                'Facility_Occurred',
                'Facility_Received',
                'Received_Date',
                'Due_Date',
                'Latest_Status_Date',
                'Status_Reasons',
                'City',
                'State']

# no modification required beyond function name
@app.route('/complaints')
def complaint():
    # read in request arguments, default to preset values if not present
    show = int(request.args['show']) if 'show' in request.args else 20
    page = int(request.args['page']) if 'page' in request.args else 0
    data_format = request.args['format'] if 'format' in request.args else 'json'

    segment_start = page*show
    segment_end = segment_start+show

    # clone all the other arguments into a dictionary by which to filter the data
    entry_filter = request.args.copy()
    entry_filter.pop('show',None)
    entry_filter.pop('page',None)
    entry_filter.pop('cols',None)
    entry_filter.pop('format',None)

    if bool(entry_filter):
        displayed_entries = Complaints.query.filter_by(**entry_filter)[segment_start:segment_end]
    else:
        displayed_entries = Complaints.query.limit(segment_end*2).all()[segment_start:segment_end]

    if 'cols' in request.args:
        displayed_cases = [{var:getattr(entry,var) for var in request.args['cols'].split(',')} for entry in displayed_entries]
    else:
        displayed_cases = [{var:getattr(entry,var) for var in entry.return_fields()} for entry in displayed_entries]

    result = {
        'metadata':{
            'results_shown':len(displayed_cases),
            'current_page':page
        },
        'cases':displayed_cases,
    }

    if data_format == 'csv':
        response = flask_csv.send_csv(displayed_cases,f'inmate-complaints_{dict_flatten(request.args)}.csv',displayed_cases[0].keys())
    else:
        response = jsonify(result)
    
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

if __name__ == '__main__':
    app.run(debug=True)