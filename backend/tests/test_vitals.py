def test_add_vital_normal(client, test_user, auth_headers):
    response = client.post('/api/vitals/', json={
        "vital_type": "heart_rate",
        "value": 80
    }, headers=auth_headers)

    assert response.status_code == 201
    data = response.get_json()
    assert data['vital_type'] == 'heart_rate'
    assert data['is_normal'] is True
