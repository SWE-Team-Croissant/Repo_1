# def test_register_user(client):
#     response = client.post('/api/auth/register', json={
#         "username": "newuser",
#         "email": "new@example.com",
#         "password": "securepassword"
#     })
#     assert response.status_code == 201
#     assert response.get_json()['message'] == "User registered successfully"

def test_register_user(client):
    response = client.post('/api/auth/register', json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "securepassword"
    })
    assert response.status_code == 201
    assert response.get_json()['message'] == "User registered successfully"

def test_login_user_success(client):
    client.post('/api/auth/register', json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "testpass"
    })
    response = client.post('/api/auth/login', json={
        "username": "loginuser",
        "password": "testpass"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert data["username"] == "loginuser"

def test_login_user_failure(client):
    response = client.post('/api/auth/login', json={
        "username": "nonexistent",
        "password": "wrongpass"
    })
    assert response.status_code == 401

def test_profile_access(client, auth_headers):
    response = client.get('/api/auth/profile', headers=auth_headers)
    assert response.status_code == 200
    assert "username" in response.get_json()
