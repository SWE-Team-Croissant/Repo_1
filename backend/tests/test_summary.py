from flask_jwt_extended import create_access_token
from app import db
from models.models import VitalRecord, SymptomRecord, Alert
from datetime import datetime, timedelta

def test_get_health_summary(client, test_user):
    db.session.add(VitalRecord(
        user_id=test_user.id, vital_type='heart_rate', value=85,
        unit='bpm', is_normal=True, timestamp=datetime.utcnow()
    ))
    db.session.add(SymptomRecord(
        user_id=test_user.id, symptom_name='nausea',
        severity=6, timestamp=datetime.utcnow()
    ))
    db.session.add(Alert(
        user_id=test_user.id, message='High HR', created_at=datetime.utcnow()
    ))
    db.session.commit()

    token = create_access_token(identity=str(test_user.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get('/api/health/summary', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "vitals" in data
    assert "symptoms" in data
    assert "alerts" in data

def test_get_health_trends(client, test_user):
    now = datetime.utcnow()
    db.session.add(VitalRecord(
        user_id=test_user.id, vital_type='heart_rate', value=88,
        unit='bpm', is_normal=True, timestamp=now - timedelta(days=1)
    ))
    db.session.commit()

    token = create_access_token(identity=str(test_user.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get('/api/health/trends?vital_type=heart_rate&days=7', headers=headers)
    assert response.status_code == 200
    assert "vitals" in response.get_json()
