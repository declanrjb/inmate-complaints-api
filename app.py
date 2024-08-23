from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
import os

from flask import Flask, jsonify, request
import math
import itertools

app = Flask(__name__)

# Database connection details
database_path = os.path.join(os.path.dirname(__file__), 'complaints.sqlite3')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

db = SQLAlchemy(app)

class Complaints(db.Model):
    __tablename__ = 'complaints'
    
    Case_Number = db.Column(db.Integer, primary_key=True)
    Case_Status = db.Column(db.String)
    Subject_Primary = db.Column(db.String)
    Subject_Secondary = db.Column(db.String)
    Org_Level = db.Column(db.String)
    Received_Office = db.Column(db.String)
    Facility_Occurred = db.Column(db.String)
    Facility_Received = db.Column(db.String)
    Received_Date = db.Column(db.Date)
    Due_Date = db.Column(db.Date)
    Latest_Status_Date = db.Column(db.Date)
    Status_Reasons = db.Column(db.String)
    Facility_Address = db.Column(db.String)
    Lat = db.Column(db.Float)
    Long = db.Column(db.Float)
    City = db.Column(db.String)
    State = db.Column(db.String)
    Fac_Coords_Method = db.Column(db.String)

    def return_fields(complaint):
        return ['Case_Number',
                'Case_Status',
                'Subject_Primary',
                'Subject_Secondary',
                'Org_Level',
                'Received_Office',
                'Facility_Occurred',
                'Facility_Received',
                'Received_Date',
                'Due_Date',
                'Latest_Status_Date',
                'Status_Reasons',
                'Facility_Address',
                'Lat',
                'Long',
                'City',
                'State',
                'Fac_Coords_Method']

def dict_listify(dictionary):
    return {k: dictionary[k].split(',') if ',' in dictionary[k] else dictionary[k] for k in dictionary}

def dict_concatenate(dictionaries):
    result = {}
    for dictionary in dictionaries:
        for k in dictionary:
            result[k] = dictionary[k]
    return result

def dict_permute(dictionary):
    multi_dict = {}
    single_dict = {}
    for k in dictionary:
        if type(dictionary[k]) is list:
            multi_dict[k] = dictionary[k]
        else:
            single_dict[k] = dictionary[k]

    multis_lists = list(multi_dict.values())
    multis_keys = list(multi_dict.keys())

    permutations = list(itertools.product(*multis_lists))
    permuted_dicts = []
    for permutation in permutations:
        new_dict = {}
        for i in range(0,len(permutation)):
            new_dict[multis_keys[i]] = permutation[i]
        new_dict = dict_concatenate([new_dict,single_dict])
        permuted_dicts.append(new_dict)
    
    return permuted_dicts

@app.route('/complaints')
def complaint():

    # read in request arguments, default to preset values if not present
    show = int(request.args['show']) if 'show' in request.args else 20
    page = int(request.args['page']) if 'page' in request.args else 0

    # clone all the other arguments into a dictionary by which to filter the data
    entry_filter = request.args.copy()
    entry_filter.pop('show',None)
    entry_filter.pop('page',None)

    # permute combined filters to match sqlite requirements
    entry_filter = dict_listify(entry_filter)
    permuted_filters = dict_permute(entry_filter)

    # pull out all the entries that match the filter and convert them to readable format
    all_cases = []
    for permuted_filter in permuted_filters:
        entries = Complaints.query.filter_by(**permuted_filter)
        cases = [{var:getattr(entry,var) for var in entry.return_fields()} for entry in entries]
        all_cases = all_cases + cases

    last_page = math.ceil(len(all_cases) / show) - 1

    # slice out the ones to return
    displayed_cases = all_cases[page*show:(page*show)+show]

    result = {
        'metadata':{
            'total_results':len(all_cases),
            'results_shown':len(displayed_cases),
            'last_page':last_page,
            'current_page':page
        },
        'cases':displayed_cases,
        'status':'ok' if page <= last_page else 'exceeded last page of data'
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)