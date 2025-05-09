from flask_jwt_extended import create_access_token
from app import db
from models.models import Alert

def test_get_alerts(client, test_user):
    alert = Alert(user_id=test_user.id, message="Check your BP", is_read=False)
    db.session.add(alert)
    db.session.commit()

    token = create_access_token(identity=str(test_user.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get('/api/alerts/', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 1
    assert data[0]['message'] == "Check your BP"

def test_mark_alert_as_read(client, test_user):
    alert = Alert(user_id=test_user.id, message="Urgent: Pulse spike", is_read=False)
    db.session.add(alert)
    db.session.commit()

    token = create_access_token(identity=str(test_user.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put(f'/api/alerts/{alert.id}/read', headers=headers)
    assert response.status_code == 200
    assert response.get_json()['message'] == "Alert marked as read"
