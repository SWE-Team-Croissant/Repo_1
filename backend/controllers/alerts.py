from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, Alert, User
from sqlalchemy import desc

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/', methods=['GET'])
@jwt_required()
def get_alerts():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    # Get optional patient_id param if provider
    patient_id = request.args.get('patient_id')

    if current_user.user_type == 'healthcare_provider' and patient_id:
        user_id = patient_id
    else:
        user_id = current_user_id
    # Parse query parameters
    is_read = request.args.get('is_read')
    limit = request.args.get('limit', default=10, type=int)
    
    # Base query
    query = Alert.query.filter_by(user_id=user_id)
    
    # Apply filters if provided
    if is_read is not None:
        is_read_bool = is_read.lower() in ('true', '1', 't', 'y', 'yes')
        query = query.filter_by(is_read=is_read_bool)
    
    # Order by creation time descending (newest first) and limit results
    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    
    # Format response
    result = []
    for alert in alerts:
        result.append({
            "id": alert.id,
            "message": alert.message,
            "is_read": alert.is_read,
            "created_at": alert.created_at.isoformat()
        })
    
    return jsonify(result), 200

@alerts_bp.route('/<int:alert_id>/read', methods=['PUT'])
@jwt_required()
def mark_alert_read(alert_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    # Get optional patient_id param if provider
    patient_id = request.args.get('patient_id')

    if current_user.user_type == 'healthcare_provider' and patient_id:
        user_id = patient_id
    else:
        user_id = current_user_id
    
    # Find alert
    alert = Alert.query.filter_by(id=alert_id, user_id=user_id).first()
    
    if not alert:
        return jsonify({"error": "Alert not found"}), 404
    
    # Mark as read
    alert.is_read = True
    db.session.commit()
    
    return jsonify({"message": "Alert marked as read"}), 200
