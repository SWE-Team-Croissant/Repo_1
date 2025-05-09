
def test_add_vital_normal(client, test_user, auth_headers):
    response = client.post('/api/vitals/', json={
        "vital_type": "heart_rate",
        "value": 80
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['vital_type'] == 'heart_rate'
    assert data['is_normal'] is True

def test_add_vital_abnormal(client, auth_headers):
    response = client.post('/api/vitals/', json={
        "vital_type": "temperature",
        "value": 39.0
    }, headers=auth_headers)
    assert response.status_code == 201
    assert "alert" in response.get_json()

def test_add_vital_missing_fields(client, auth_headers):
    response = client.post('/api/vitals/', json={
        "vital_type": "heart_rate"
    }, headers=auth_headers)
    assert response.status_code == 400

def test_get_vitals(client, auth_headers):
    client.post('/api/vitals/', json={
        "vital_type": "heart_rate",
        "value": 90
    }, headers=auth_headers)
    response = client.get('/api/vitals/', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)
