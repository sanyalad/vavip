"""
Orders API tests
"""
import pytest
from vavip.extensions import db
from vavip.models import Order, OrderItem, Product, Category, User


@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        user = User(
            email='orderuser@example.com',
            first_name='Order',
            last_name='User',
            is_active=True
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def test_product(app):
    """Create a test product."""
    with app.app_context():
        category = Category(name='Test Cat', slug='test-cat', is_active=True)
        db.session.add(category)
        db.session.commit()
        
        product = Product(
            name='Order Product',
            slug='order-product',
            sku='ORD-001',
            price=100.0,
            stock_quantity=20,
            category_id=category.id,
            is_active=True
        )
        db.session.add(product)
        db.session.commit()
        return product


@pytest.fixture
def order_headers(client, test_user):
    """Create auth headers for test user."""
    # Login as test user
    response = client.post('/api/auth/login', json={
        'email': 'orderuser@example.com',
        'password': 'password123'
    })
    
    if response.status_code != 200:
        # Register if doesn't exist
        client.post('/api/auth/register', json={
            'email': 'orderuser@example.com',
            'password': 'password123',
            'first_name': 'Order',
            'last_name': 'User'
        })
        response = client.post('/api/auth/login', json={
            'email': 'orderuser@example.com',
            'password': 'password123'
        })
    
    data = response.get_json()
    return {'Authorization': f'Bearer {data["access_token"]}'}


def test_get_orders_unauthorized(client):
    """Test getting orders without authentication."""
    response = client.get('/api/orders/')
    
    assert response.status_code == 401


def test_get_orders_empty(client, order_headers):
    """Test getting orders for user with no orders."""
    response = client.get('/api/orders/', headers=order_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_create_order(client, order_headers, test_product):
    """Test creating an order."""
    response = client.post('/api/orders/',
        headers=order_headers,
        json={
            'items': [
                {
                    'product_id': test_product.id,
                    'quantity': 2,
                    'price': test_product.price
                }
            ],
            'shipping_address': {
                'street': '123 Test St',
                'city': 'Test City',
                'postal_code': '12345',
                'country': 'RU'
            },
            'payment_method': 'card'
        }
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert data['status'] == 'pending'
    assert len(data['items']) == 1


def test_create_order_invalid_product(client, order_headers):
    """Test creating order with invalid product."""
    response = client.post('/api/orders/',
        headers=order_headers,
        json={
            'items': [
                {
                    'product_id': 99999,
                    'quantity': 1,
                    'price': 10.0
                }
            ],
            'shipping_address': {
                'street': '123 Test St',
                'city': 'Test City',
                'postal_code': '12345',
                'country': 'RU'
            }
        }
    )
    
    assert response.status_code in [400, 404]


def test_get_order_by_id(client, order_headers, test_product):
    """Test getting order by ID."""
    # Create order first
    create_response = client.post('/api/orders/',
        headers=order_headers,
        json={
            'items': [
                {
                    'product_id': test_product.id,
                    'quantity': 1,
                    'price': test_product.price
                }
            ],
            'shipping_address': {
                'street': '123 Test St',
                'city': 'Test City',
                'postal_code': '12345',
                'country': 'RU'
            }
        }
    )
    
    order_id = create_response.get_json()['id']
    
    # Get order
    response = client.get(f'/api/orders/{order_id}', headers=order_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == order_id


def test_get_order_not_found(client, order_headers):
    """Test getting non-existent order."""
    response = client.get('/api/orders/99999', headers=order_headers)
    
    assert response.status_code == 404


def test_get_order_unauthorized(client, order_headers, test_product):
    """Test getting order from different user."""
    # Create order
    create_response = client.post('/api/orders/',
        headers=order_headers,
        json={
            'items': [
                {
                    'product_id': test_product.id,
                    'quantity': 1,
                    'price': test_product.price
                }
            ],
            'shipping_address': {
                'street': '123 Test St',
                'city': 'Test City',
                'postal_code': '12345',
                'country': 'RU'
            }
        }
    )
    
    order_id = create_response.get_json()['id']
    
    # Try to get with different user
    other_headers = client.post('/api/auth/register', json={
        'email': 'other@example.com',
        'password': 'password123'
    })
    other_token = other_headers.get_json()['access_token']
    other_auth = {'Authorization': f'Bearer {other_token}'}
    
    response = client.get(f'/api/orders/{order_id}', headers=other_auth)
    
    # Should be 403 or 404
    assert response.status_code in [403, 404]

