from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, User, VitalRecord, SymptomRecord, Alert
from sqlalchemy import func
from datetime import datetime, timedelta

summary_bp = Blueprint('health_summary', __name__)

@summary_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_health_summary():
    user_id = get_jwt_identity()
    
    # Parse timeframe parameter (default to last 30 days)
    timeframe_days = request.args.get('timeframe', default=30, type=int)
    start_date = datetime.utcnow() - timedelta(days=timeframe_days)
    
    # Get user
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Collect vital statistics
    vitals_data = {}
    for vital_type in ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'temperature', 'oxygen_saturation']:
        vital_records = VitalRecord.query.filter_by(
            user_id=user_id, 
            vital_type=vital_type
        ).filter(
            VitalRecord.timestamp >= start_date
        ).all()
        
        if vital_records:
            values = [record.value for record in vital_records]
            vitals_data[vital_type] = {
                "count": len(values),
                "average": sum(values) / len(values),
                "min": min(values),
                "max": max(values),
                "unit": vital_records[0].unit,
                "abnormal_count": sum(1 for record in vital_records if not record.is_normal)
            }
    
    # Collect symptom statistics
    symptoms = SymptomRecord.query.filter_by(
        user_id=user_id
    ).filter(
        SymptomRecord.timestamp >= start_date
    ).all()
    
    symptom_frequency = {}
    for symptom in symptoms:
        if symptom.symptom_name in symptom_frequency:
            symptom_frequency[symptom.symptom_name]['count'] += 1
            symptom_frequency[symptom.symptom_name]['total_severity'] += symptom.severity
        else:
            symptom_frequency[symptom.symptom_name] = {
                'count': 1,
                'total_severity': symptom.severity
            }
    
    for symptom_name, data in symptom_frequency.items():
        data['average_severity'] = data['total_severity'] / data['count']
    
    # Count alerts
    alert_count = Alert.query.filter_by(
        user_id=user_id
    ).filter(
        Alert.created_at >= start_date
    ).count()
    
    # Compile summary
    summary = {
        "user": {
            "id": user.id,
            "username": user.username,
            "name": f"{user.first_name} {user.last_name}".strip()
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
