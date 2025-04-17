from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, SymptomRecord, User
from datetime import datetime


symptoms_bp = Blueprint('symptoms', __name__)

@symptoms_bp.route('/', methods=['POST'])
@jwt_required()
def add_symptom():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('symptom_name', 'severity')):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate severity range (1-10)
    severity = int(data['severity'])
    if severity < 1 or severity > 10:
        return jsonify({"error": "Severity must be between 1 and 10"}), 400
    
    # Create symptom record
    symptom = SymptomRecord(
        user_id=user_id,
        symptom_name=data['symptom_name'],
        severity=severity,
        notes=data.get('notes', ''),
        timestamp=datetime.utcnow()
    )
    
    db.session.add(symptom)
    db.session.commit()
    
    return jsonify({
        "id": symptom.id,
        "symptom_name": symptom.symptom_name,
        "severity": symptom.severity,
        "notes": symptom.notes,
        "timestamp": symptom.timestamp.isoformat()
    }), 201

@symptoms_bp.route('/', methods=['GET'])
@jwt_required()
def get_symptoms():
    #user_id = get_jwt_identity()
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    # Get optional patient_id param if provider
    patient_id = request.args.get('patient_id')

    if current_user.user_type == 'healthcare_provider' and patient_id:
        user_id = patient_id
    else:
        user_id = current_user_id
    # Parse query parameters
    symptom_name = request.args.get('name')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = SymptomRecord.query.filter_by(user_id=user_id)
    
    # Apply filters if provided
    if symptom_name:
        query = query.filter_by(symptom_name=symptom_name)
    
    if start_date:
        query = query.filter(SymptomRecord.timestamp >= datetime.fromisoformat(start_date))
    
    if end_date:
        query = query.filter(SymptomRecord.timestamp <= datetime.fromisoformat(end_date))
    
    # Order by timestamp descending (newest first)
    symptoms = query.order_by(SymptomRecord.timestamp.desc()).all()
    
    # Format response
    result = []
    for symptom in symptoms:
        result.append({
            "id": symptom.id,
            "symptom_name": symptom.symptom_name,
            "severity": symptom.severity,
            "notes": symptom.notes,
            "timestamp": symptom.timestamp.isoformat()
        })
    
    return jsonify(result), 200
