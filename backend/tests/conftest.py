"""
Pytest fixtures and configuration
"""
import pytest
from vavip import create_app
from vavip.extensions import db
from vavip.config import TestingConfig


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    app = create_app(TestingConfig)
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def auth_headers(client):
    """Create authenticated user and return auth headers."""
    # Register user
    client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'testpassword123',
        'first_name': 'Test',
        'last_name': 'User'
    })
    
    # Login
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'testpassword123'
    })
    
    data = response.get_json()
    return {'Authorization': f'Bearer {data["access_token"]}'}









