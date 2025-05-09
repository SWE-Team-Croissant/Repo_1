def test_get_patients_unauthorized(client, test_user, auth_headers):
    response = client.get('/api/health/patients', headers=auth_headers)
    assert response.status_code == 403

from flask_jwt_extended import create_access_token
from app import db

def test_get_patients_authorized(client, test_user):
    # Promote to healthcare provider
    test_user.user_type = 'healthcare_provider'
    db.session.commit()

    # Generate updated token
    token = create_access_token(identity=str(test_user.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get('/api/health/patients', headers=headers)
    assert response.status_code == 200

def test_add_clinical_note_missing_field(client, test_user):
    # Promote to healthcare provider
    test_user.user_type = 'healthcare_provider'
    db.session.commit()

    # Generate updated token
    token = create_access_token(identity=str(test_user.id))
    headers = {"Authorization": f"Bearer {token}"}

    # Missing 'patient_id'
    response = client.post('/api/health/notes', json={
        "content": "Follow-up needed"
    }, headers=headers)

    assert response.status_code == 400
from flask_jwt_extended import create_access_token
from app import db
from models.models import User, VitalRecord, SymptomRecord, ClinicalNote
from datetime import datetime, timedelta

def create_token_headers(user):
    token = create_access_token(identity=str(user.id))
    return {"Authorization": f"Bearer {token}"}

def test_get_patients_activity_alerts(client, test_user):
    test_user.user_type = 'healthcare_provider'
    db.session.commit()
    headers = create_token_headers(test_user)

    # Create 1 patient with vitals and symptoms
    patient = User(username="patient1", email="p1@example.com", password="pass", user_type="patient")
    db.session.add(patient)
    db.session.commit()

    db.session.add(VitalRecord(user_id=patient.id, vital_type="heart_rate", value=120,
                                unit="bpm", is_normal=False, timestamp=datetime.utcnow()))
    db.session.add(SymptomRecord(user_id=patient.id, symptom_name="dizziness", severity=6,
                                  timestamp=datetime.utcnow()))
    db.session.commit()

    res = client.get('/api/health/patients', headers=headers)
    assert res.status_code == 200
    assert "alerts_count" in res.get_json()[0]

def test_get_notes_missing_patient_id(client, test_user):
    test_user.user_type = 'healthcare_provider'
    db.session.commit()
    headers = create_token_headers(test_user)

    res = client.get('/api/health/notes', headers=headers)
    assert res.status_code == 400
    assert res.get_json()["error"] == "Patient ID is required"

def test_get_notes_patient_not_found(client, test_user):
    test_user.user_type = 'healthcare_provider'
    db.session.commit()
    headers = create_token_headers(test_user)

    res = client.get('/api/health/notes?patient_id=9999', headers=headers)
    assert res.status_code == 200  # Empty, not an error — app just returns []

def test_get_notes_valid(client, test_user):
    test_user.user_type = 'healthcare_provider'
    patient = User(username="p2", email="p2@e.com", password="x", user_type="patient")
    db.session.add(patient)
    db.session.commit()

    note = ClinicalNote(content="Stable", provider_id=test_user.id,
                        patient_id=patient.id, created_at=datetime.utcnow())
    db.session.add(note)
    db.session.commit()

    headers = create_token_headers(test_user)
    res = client.get(f'/api/health/notes?patient_id={patient.id}', headers=headers)
    assert res.status_code == 200
    assert res.get_json()[0]["content"] == "Stable"

def test_add_clinical_note_unauthorized(client, auth_headers):
    res = client.post('/api/health/notes', json={
        "patient_id": 1, "content": "Should fail"
    }, headers=auth_headers)
    assert res.status_code == 403

def test_add_clinical_note_valid(client, test_user):
    test_user.user_type = 'healthcare_provider'
    patient = User(username="p3", email="p3@e.com", password="y", user_type="patient")
    db.session.add(patient)
    db.session.commit()

    headers = create_token_headers(test_user)
    res = client.post('/api/health/notes', json={
        "patient_id": patient.id, "content": "Note from test"
    }, headers=headers)
    assert res.status_code == 201
    assert res.get_json()["message"] == "Clinical note added successfully"

def test_add_clinical_note_invalid_patient(client, test_user):
    test_user.user_type = 'healthcare_provider'
    db.session.commit()
    headers = create_token_headers(test_user)

    res = client.post('/api/health/notes', json={
        "patient_id": 9999, "content": "Invalid patient"
    }, headers=headers)
    assert res.status_code == 404
