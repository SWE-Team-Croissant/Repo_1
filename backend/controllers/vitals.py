from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, VitalRecord, Alert, User
from datetime import datetime

vitals_bp = Blueprint('vitals', __name__)

# Define normal ranges for vitals
VITAL_RANGES = {
    'heart_rate': {'min': 60, 'max': 100, 'unit': 'bpm'},
    'blood_pressure_systolic': {'min': 90, 'max': 140, 'unit': 'mmHg'},
    'blood_pressure_diastolic': {'min': 60, 'max': 90, 'unit': 'mmHg'},
    'temperature': {'min': 36.1, 'max': 37.2, 'unit': '°C'},
    'oxygen_saturation': {'min': 95, 'max': 100, 'unit': '%'}
}

@vitals_bp.route('/', methods=['POST'])
@jwt_required()
def add_vital():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('vital_type', 'value')):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if vital type is supported
    vital_type = data['vital_type']
    if vital_type not in VITAL_RANGES:
        return jsonify({"error": f"Unsupported vital type. Supported types: {list(VITAL_RANGES.keys())}"}), 400
    
    # Check if value is within normal range
    value = float(data['value'])
    vital_range = VITAL_RANGES[vital_type]
    is_normal = vital_range['min'] <= value <= vital_range['max']
    
    # Create vital record
    vital_record = VitalRecord(
        user_id=user_id,
        vital_type=vital_type,
        value=value,
        unit=vital_range['unit'],
        is_normal=is_normal,
        timestamp=datetime.utcnow()
    )
    
    db.session.add(vital_record)
    
    # Create alert if vital is not normal
    if not is_normal:
        alert_message = f"Abnormal {vital_type.replace('_', ' ')}: {value} {vital_range['unit']}. " \
                       f"Normal range is {vital_range['min']}-{vital_range['max']} {vital_range['unit']}."
        
        alert = Alert(
            user_id=user_id,
            vital_record_id=vital_record.id,
            message=alert_message
        )
        db.session.add(alert)
    
    db.session.commit()
    
    response = {
        "id": vital_record.id,
        "vital_type": vital_record.vital_type,
        "value": vital_record.value,
        "unit": vital_record.unit,
        "is_normal": vital_record.is_normal,
        "timestamp": vital_record.timestamp.isoformat()
    }
    
    if not is_normal:
        response["alert"] = {
            "id": alert.id,
            "message": alert.message
        }
    
    return jsonify(response), 201

@vitals_bp.route('/', methods=['GET'])
@jwt_required()
def get_vitals():
    user_id = get_jwt_identity()
    
    # Parse query parameters
    vital_type = request.args.get('type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = VitalRecord.query.filter_by(user_id=user_id)
    
    # Apply filters if provided
    if vital_type:
        query = query.filter_by(vital_type=vital_type)
    
    if start_date:
        query = query.filter(VitalRecord.timestamp >= datetime.fromisoformat(start_date))
    
    if end_date:
        query = query.filter(VitalRecord.timestamp <= datetime.fromisoformat(end_date))
    
    # Order by timestamp descending (newest first)
    vitals = query.order_by(VitalRecord.timestamp.desc()).all()
    
    # Format response
    result = []
    for vital in vitals:
        result.append({
            "id": vital.id,
            "vital_type": vital.vital_type,
            "value": vital.value,
            "unit": vital.unit,
            "is_normal": vital.is_normal,
            "timestamp": vital.timestamp.isoformat()
        })
    
    return jsonify(result), 200
