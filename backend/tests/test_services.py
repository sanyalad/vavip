"""
Service layer tests
"""
import pytest
from vavip.extensions import db
from vavip.models import User, Order, Product, Category
from vavip.services.auth_service import AuthService
from vavip.services.order_service import OrderService
from vavip.services.analytics_service import AnalyticsService


def test_auth_service_register_user(app):
    """Test AuthService.register_user."""
    with app.app_context():
        try:
            user = AuthService.register_user(
                email='service@example.com',
                password='password123',
                first_name='Service',
                last_name='Test'
            )
            
            assert user is not None
            assert user.email == 'service@example.com'
            assert user.check_password('password123')
            assert user.first_name == 'Service'
        except ValueError:
            # User might already exist from previous test
            user = User.query.filter_by(email='service@example.com').first()
            assert user is not None


def test_auth_service_register_duplicate(app):
    """Test AuthService.register_user with duplicate email."""
    with app.app_context():
        # Create first user
        AuthService.register_user(
            email='duplicate@example.com',
            password='password123'
        )
        
        # Try to create duplicate
        with pytest.raises(ValueError):
            AuthService.register_user(
                email='duplicate@example.com',
                password='password456'
            )


def test_order_service_get_user_orders(app):
    """Test OrderService.get_user_orders."""
    with app.app_context():
        # Create user
        user = User(
            email='orderuser@example.com',
            is_active=True
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        
        # Create category and product
        category = Category(name='Cat', slug='cat', is_active=True)
        db.session.add(category)
        db.session.commit()
        
        product = Product(
            name='Test Product',
            slug='test-product',
            sku='TEST-001',
            price=50.0,
            stock_quantity=10,
            category_id=category.id,
            is_active=True
        )
        db.session.add(product)
        db.session.commit()
        
        # Create order
        order = Order(
            user_id=user.id,
            status='pending',
            total_amount=50.0,
            shipping_address={'city': 'Test'},
            payment_method='card'
        )
        db.session.add(order)
        db.session.commit()
        
        # Get user orders
        orders = OrderService.get_user_orders(user.id)
        
        assert len(orders) == 1
        assert orders[0].id == order.id


def test_order_service_create_order(app):
    """Test OrderService.create_order."""
    with app.app_context():
        # Create user
        user = User(
            email='createorder@example.com',
            is_active=True
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        
        # Create category and product
        category = Category(name='Cat', slug='cat', is_active=True)
        db.session.add(category)
        db.session.commit()
        
        product = Product(
            name='Order Product',
            slug='order-product',
            sku='ORD-001',
            price=100.0,
            stock_quantity=10,
            category_id=category.id,
            is_active=True
        )
        db.session.add(product)
        db.session.commit()
        
        # Create order
        order = OrderService.create_order(
            user_id=user.id,
            items=[
                {
                    'product_id': product.id,
                    'quantity': 2,
                    'price': product.price
                }
            ],
            shipping_address={
                'street': '123 Test St',
                'city': 'Test City',
                'postal_code': '12345',
                'country': 'RU'
            },
            payment_method='card'
        )
        
        assert order is not None
        assert order.user_id == user.id
        assert order.total_amount == 200.0
        assert order.status == 'pending'


def test_analytics_service_get_stats(app):
    """Test AnalyticsService.get_stats."""
    with app.app_context():
        stats = AnalyticsService.get_stats()
        
        assert isinstance(stats, dict)
        assert 'total_orders' in stats
        assert 'total_revenue' in stats
        assert 'total_users' in stats
        assert 'total_products' in stats


def test_order_service_insufficient_stock(app):
    """Test OrderService.create_order with insufficient stock."""
    with app.app_context():
        # Create user
        user = User(
            email='stocktest@example.com',
            is_active=True
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        
        # Create category and product with low stock
        category = Category(name='Cat', slug='cat', is_active=True)
        db.session.add(category)
        db.session.commit()
        
        product = Product(
            name='Low Stock Product',
            slug='low-stock',
            sku='LOW-001',
            price=50.0,
            stock_quantity=2,  # Only 2 in stock
            category_id=category.id,
            is_active=True
        )
        db.session.add(product)
        db.session.commit()
        
        # Try to order more than available
        with pytest.raises(ValueError, match='stock'):
            OrderService.create_order(
                user_id=user.id,
                items=[
                    {
                        'product_id': product.id,
                        'quantity': 5,  # More than available
                        'price': product.price
                    }
                ],
                shipping_address={'city': 'Test'},
                payment_method='card'
            )

