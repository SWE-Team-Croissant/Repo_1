def test_get_patients_unauthorized(client, test_user, auth_headers):
    response = client.get('/api/health/patients', headers=auth_headers)
    assert response.status_code == 403

