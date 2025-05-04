from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    user_type = db.Column(db.String(20), default='patient')  # 'patient' or 'healthcare_provider'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    vitals = db.relationship('VitalRecord', backref='user', lazy=True)
    symptoms = db.relationship('SymptomRecord', backref='user', lazy=True)

class VitalRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vital_type = db.Column(db.String(50), nullable=False)  # e.g., 'heart_rate', 'blood_pressure', etc.
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_normal = db.Column(db.Boolean, default=True)
    
class SymptomRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symptom_name = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.Integer, nullable=False)  # 1-10 scale
    notes = db.Column(db.Text, nullable=True) # changed from .Text
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vital_record_id = db.Column(db.Integer, db.ForeignKey('vital_record.id'), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ClinicalNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    #provider_last_name = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)