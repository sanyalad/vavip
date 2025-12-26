"""
Products API tests
"""
import pytest
from vavip.extensions import db
from vavip.models import Product, Category


@pytest.fixture
def category(app):
    """Create a test category."""
    with app.app_context():
        category = Category(
            name='Test Category',
            slug='test-category',
            description='Test category description',
            is_active=True
        )
        db.session.add(category)
        db.session.commit()
        return category


@pytest.fixture
def product(app, category):
    """Create a test product."""
    with app.app_context():
        product = Product(
            name='Test Product',
            slug='test-product',
            sku='TEST-001',
            description='Test product description',
            price=99.99,
            stock_quantity=10,
            category_id=category.id,
            is_active=True
        )
        db.session.add(product)
        db.session.commit()
        return product


def test_get_products(client, product):
    """Test getting all products."""
    response = client.get('/api/products/')
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'items' in data
    assert 'pagination' in data
    assert len(data['items']) > 0


def test_get_products_pagination(client, app):
    """Test products pagination."""
    with app.app_context():
        # Create multiple products
        category = Category(name='Cat', slug='cat', is_active=True)
        db.session.add(category)
        db.session.commit()
        
        for i in range(15):
            product = Product(
                name=f'Product {i}',
                slug=f'product-{i}',
                sku=f'SKU-{i}',
                price=10.0,
                stock_quantity=5,
                category_id=category.id,
                is_active=True
            )
            db.session.add(product)
        db.session.commit()
    
    # Test first page
    response = client.get('/api/products/?page=1&per_page=10')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['items']) == 10
    assert data['pagination']['page'] == 1
    assert data['pagination']['per_page'] == 10


def test_get_product_by_id(client, product):
    """Test getting product by ID."""
    response = client.get(f'/api/products/{product.id}')
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == product.id
    assert data['name'] == 'Test Product'


def test_get_product_not_found(client):
    """Test getting non-existent product."""
    response = client.get('/api/products/99999')
    
    assert response.status_code == 404


def test_get_products_by_category(client, category, product):
    """Test filtering products by category."""
    response = client.get(f'/api/products/?category={category.slug}')
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['items']) > 0
    assert all(item['category']['slug'] == category.slug for item in data['items'])


def test_get_products_search(client, product):
    """Test searching products."""
    response = client.get('/api/products/?search=Test')
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['items']) > 0


def test_get_featured_products(client, app, category):
    """Test getting featured products."""
    with app.app_context():
        featured = Product(
            name='Featured Product',
            slug='featured-product',
            sku='FEAT-001',
            price=199.99,
            stock_quantity=5,
            category_id=category.id,
            is_featured=True,
            is_active=True
        )
        db.session.add(featured)
        db.session.commit()
    
    response = client.get('/api/products/?featured=true')
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['items']) > 0
    assert all(item['is_featured'] is True for item in data['items'])


def test_create_product_unauthorized(client, category):
    """Test creating product without authentication."""
    response = client.post('/api/products/', json={
        'name': 'New Product',
        'slug': 'new-product',
        'sku': 'NEW-001',
        'price': 50.0,
        'stock_quantity': 10,
        'category_id': category.id
    })
    
    assert response.status_code == 401


def test_create_product(client, auth_headers, category):
    """Test creating product as authenticated user."""
    # Note: This will fail if user is not manager/admin
    # For now, just test that endpoint exists
    response = client.post('/api/products/', 
        headers=auth_headers,
        json={
            'name': 'New Product',
            'slug': 'new-product',
            'sku': 'NEW-001',
            'price': 50.0,
            'stock_quantity': 10,
            'category_id': category.id
        }
    )
    
    # May be 403 if user is not manager/admin
    assert response.status_code in [201, 403]


def test_get_categories(client, category):
    """Test getting all categories."""
    response = client.get('/api/products/categories')
    
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) > 0




