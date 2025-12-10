"""
Authentication API tests
"""
import pytest


def test_register(client):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'securepassword123',
        'first_name': 'New',
        'last_name': 'User'
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert data['user']['email'] == 'newuser@example.com'


def test_register_duplicate_email(client):
    """Test registration with existing email fails."""
    # First registration
    client.post('/api/auth/register', json={
        'email': 'duplicate@example.com',
        'password': 'password123'
    })
    
    # Second registration with same email
    response = client.post('/api/auth/register', json={
        'email': 'duplicate@example.com',
        'password': 'password456'
    })
    
    assert response.status_code == 409


def test_login(client):
    """Test user login."""
    # Register first
    client.post('/api/auth/register', json={
        'email': 'logintest@example.com',
        'password': 'password123'
    })
    
    # Login
    response = client.post('/api/auth/login', json={
        'email': 'logintest@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['email'] == 'logintest@example.com'


def test_login_invalid_credentials(client):
    """Test login with invalid credentials fails."""
    response = client.post('/api/auth/login', json={
        'email': 'nonexistent@example.com',
        'password': 'wrongpassword'
    })
    
    assert response.status_code == 401


def test_get_current_user(client, auth_headers):
    """Test getting current user profile."""
    response = client.get('/api/auth/me', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'email' in data


def test_update_profile(client, auth_headers):
    """Test updating user profile."""
    response = client.put('/api/auth/me', 
        headers=auth_headers,
        json={
            'first_name': 'Updated',
            'phone': '+79991234567'
        }
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['first_name'] == 'Updated'
    assert data['phone'] == '+79991234567'


