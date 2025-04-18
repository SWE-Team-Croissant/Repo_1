from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, User, VitalRecord, SymptomRecord, Alert
from sqlalchemy import func
from datetime import datetime, timedelta

summary_bp = Blueprint('health_summary', __name__)

@summary_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_health_summary():

    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)


    # Handle optional patient_id for providers
    patient_id = request.args.get('patient_id', type=int)
    if current_user.user_type == 'healthcare_provider' and patient_id:
        target_user = User.query.get(patient_id)
        if not target_user or target_user.user_type != 'patient':
            return jsonify({"error": "Patient not found"}), 404
        user_id = target_user.id
        user_info = target_user
    else:
        user_id = current_user.id
        user_info = current_user

    # Timeframe defaults to last 30 days
    timeframe_days = request.args.get('timeframe', default=30, type=int)
    start_date = datetime.utcnow() - timedelta(days=timeframe_days)

    # Vitals
    vitals_data = {}
    for vital_type in ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'temperature', 'oxygen_saturation']:
        vital_records = VitalRecord.query.filter_by(user_id=user_id, vital_type=vital_type)\
                                         .filter(VitalRecord.timestamp >= start_date).all()
        if vital_records:
            values = [v.value for v in vital_records]
            vitals_data[vital_type] = {
                "count": len(values),
                "average": sum(values) / len(values),
                "min": min(values),
                "max": max(values),
                "unit": vital_records[0].unit,
                "abnormal_count": sum(1 for v in vital_records if not v.is_normal)
            }

    # Symptoms
    symptoms = SymptomRecord.query.filter_by(user_id=user_id)\
                                  .filter(SymptomRecord.timestamp >= start_date).all()

    symptom_frequency = {}
    for s in symptoms:
        entry = symptom_frequency.setdefault(s.symptom_name, {
            'count': 0,
            'total_severity': 0
        })
        entry['count'] += 1
        entry['total_severity'] += s.severity

    for data in symptom_frequency.values():
        data['average_severity'] = data['total_severity'] / data['count']

    # Alerts
    alert_count = Alert.query.filter_by(user_id=user_id)\
                             .filter(Alert.created_at >= start_date).count()

    # Build response
    summary = {
        "user": {
            "id": user_info.id,
            "username": user_info.username,
            "name": f"{user_info.first_name} {user_info.last_name}".strip()
        },
        "timeframe": {
            "days": timeframe_days,
            "start_date": start_date.isoformat(),
            "end_date": datetime.utcnow().isoformat()
        },
        "vitals": vitals_data,
        "symptoms": {
            "total_count": len(symptoms),
            "frequency": symptom_frequency
        },
        "alerts": {
            "count": alert_count
        }
    }

    return jsonify(summary), 200

@summary_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_health_trends():
    user_id = get_jwt_identity()
    
    # Parse parameters
    vital_type = request.args.get('vital_type')
    symptom_name = request.args.get('symptom_name')
    days = request.args.get('days', default=30, type=int)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    trends = {}
    
    # Get vital trends if specified
    if vital_type:
        vital_records = VitalRecord.query.filter_by(
            user_id=user_id,
            vital_type=vital_type
        ).filter(
            VitalRecord.timestamp >= start_date
        ).order_by(VitalRecord.timestamp).all()
        
        trends['vitals'] = [{
            "timestamp": record.timestamp.isoformat(),
            "value": record.value,
            "is_normal": record.is_normal
        } for record in vital_records]
    
    # Get symptom trends if specified
    if symptom_name:
        symptom_records = SymptomRecord.query.filter_by(
            user_id=user_id,
            symptom_name=symptom_name
        ).filter(
            SymptomRecord.timestamp >= start_date
        ).order_by(SymptomRecord.timestamp).all()
        
        trends['symptoms'] = [{
            "timestamp": record.timestamp.isoformat(),
            "severity": record.severity
        } for record in symptom_records]
    
    return jsonify(trends), 200
