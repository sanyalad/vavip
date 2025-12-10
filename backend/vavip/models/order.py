"""
Order Model
"""
from datetime import datetime
from ..extensions import db


class Order(db.Model):
    """Order model."""
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(30), default='pending')  # pending, confirmed, processing, shipped, delivered, cancelled
    payment_status = db.Column(db.String(30), default='pending')  # pending, paid, failed, refunded
    payment_method = db.Column(db.String(30))  # card, cash, yookassa, stripe
    
    # Delivery info
    delivery_method = db.Column(db.String(30))  # pickup, courier, post
    delivery_address = db.Column(db.Text)
    delivery_cost = db.Column(db.Numeric(10, 2), default=0)
    
    # Totals
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    discount = db.Column(db.Numeric(10, 2), default=0)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='RUB')
    
    # Promo code
    promo_code = db.Column(db.String(50))
    
    # Customer info (for guests or override)
    customer_name = db.Column(db.String(100))
    customer_email = db.Column(db.String(120))
    customer_phone = db.Column(db.String(20))
    
    # Notes
    customer_note = db.Column(db.Text)
    admin_note = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    shipped_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)

    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'user_id': self.user_id,
            'status': self.status,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'delivery_method': self.delivery_method,
            'delivery_address': self.delivery_address,
            'delivery_cost': float(self.delivery_cost) if self.delivery_cost else 0,
            'subtotal': float(self.subtotal) if self.subtotal else 0,
            'discount': float(self.discount) if self.discount else 0,
            'total': float(self.total) if self.total else 0,
            'currency': self.currency,
            'promo_code': self.promo_code,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'customer_note': self.customer_note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items.all()]
        return data


class OrderItem(db.Model):
    """Order item (line item)."""
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)  # Snapshot at order time
    product_sku = db.Column(db.String(50))
    product_image = db.Column(db.String(500))
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price = db.Column(db.Numeric(10, 2), nullable=False)  # Price at order time
    total = db.Column(db.Numeric(10, 2), nullable=False)

    # Relationship to actual product (might be deleted later)
    product = db.relationship('Product', backref='order_items')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
            'product_image': self.product_image,
            'quantity': self.quantity,
            'price': float(self.price) if self.price else 0,
            'total': float(self.total) if self.total else 0
        }


