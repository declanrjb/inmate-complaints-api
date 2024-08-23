from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
import os

from flask import Flask, jsonify, request

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

@app.route('/complaints')
def complaint():
    entries = Complaints.query.filter_by(**request.args)

    result = {
        getattr(entry,'Case_Number'):{
            var:getattr(entry,var) for var in entry.return_fields()
        }
        for entry in entries
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)