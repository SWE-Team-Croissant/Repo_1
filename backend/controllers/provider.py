from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, User, VitalRecord, SymptomRecord, Alert

provider_bp = Blueprint('provider', __name__)

@provider_bp.route('/patients', methods=['GET'])
@jwt_required()
def get_patients():
    provider_id = get_jwt_identity()
    provider = User.query.get(provider_id)
    
    # Verify user is a healthcare provider
    if provider.user_type != 'healthcare_provider':
        return jsonify({"error": "Unauthorized access"}), 403
    
    # Get all patients (in a real app, you'd have a relationship table)
    patients = User.query.filter_by(user_type='patient').all()
    
    result = []
    for patient in patients:
        # Get latest activity
        latest_vital = VitalRecord.query.filter_by(user_id=patient.id).order_by(VitalRecord.timestamp.desc()).first()
        latest_symptom = SymptomRecord.query.filter_by(user_id=patient.id).order_by(SymptomRecord.timestamp.desc()).first()
        
        # Get latest timestamp
        latest_activity = None
        if latest_vital and latest_symptom:
            latest_activity = max(latest_vital.timestamp, latest_symptom.timestamp)
        elif latest_vital:
            latest_activity = latest_vital.timestamp
        elif latest_symptom:
            latest_activity = latest_symptom.timestamp
        
        # Count unread alerts
        alerts_count = Alert.query.filter_by(user_id=patient.id, is_read=False).count()
        
        result.append({
            "id": patient.id,
            "username": patient.username,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "email": patient.email,
            "last_activity": latest_activity.isoformat() if latest_activity else None,
            "alerts_count": alerts_count
        })
    
    return jsonify(result), 200

@provider_bp.route('/notes', methods=['GET'])
@jwt_required()
def get_clinical_notes():
    provider_id = get_jwt_identity()
    provider = User.query.get(provider_id)
    
    # Verify user is a healthcare provider
    if provider.user_type != 'healthcare_provider':
        return jsonify({"error": "Unauthorized access"}), 403
    
    # Get patient ID from query parameter
    patient_id = request.args.get('patient_id')
    if not patient_id:
        return jsonify({"error": "Patient ID is required"}), 400
    
    # In a real implementation, you would query clinical notes from database
    # For now, return empty list since this model might not exist yet
    return jsonify([]), 200

@provider_bp.route('/notes', methods=['POST'])
@jwt_required()
def add_clinical_note():
    provider_id = get_jwt_identity()
    provider = User.query.get(provider_id)
    
    # Verify user is a healthcare provider
    if provider.user_type != 'healthcare_provider':
        return jsonify({"error": "Unauthorized access"}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('patient_id', 'content')):
        return jsonify({"error": "Missing required fields"}), 400
    
    # In a real implementation, you would create a clinical note in database
    # For now, return success
    return jsonify({
        "id": 1,
        "content": data['content'],
        "created_at": datetime.utcnow().isoformat(),
        "provider_id": provider_id,
        "patient_id": data['patient_id']
    }), 201
