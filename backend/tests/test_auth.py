def test_register_user(client):
    response = client.post('/api/auth/register', json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "securepassword"
    })
    assert response.status_code == 201
    assert response.get_json()['message'] == "User registered successfully"
