
def test_add_symptom_success(client, auth_headers):
    response = client.post('/api/symptoms/', json={
        "symptom_name": "fatigue",
        "severity": 5
    }, headers=auth_headers)
    assert response.status_code == 201
    assert response.get_json()["symptom_name"] == "fatigue"

def test_add_symptom_invalid_severity(client, auth_headers):
    response = client.post('/api/symptoms/', json={
        "symptom_name": "headache",
        "severity": 15
    }, headers=auth_headers)
    assert response.status_code == 400

def test_get_symptoms(client, auth_headers):
    client.post('/api/symptoms/', json={
        "symptom_name": "nausea",
        "severity": 4
    }, headers=auth_headers)
    response = client.get('/api/symptoms/', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)
