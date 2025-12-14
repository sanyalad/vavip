"""
User Model
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class User(db.Model):
    """User model for authentication and profile."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20), unique=True, index=True)
    role = db.Column(db.String(20), default='customer')  # customer, admin, manager
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    orders = db.relationship('Order', backref='user', lazy='dynamic')
    addresses = db.relationship('Address', backref='user', lazy='dynamic')
    favorites = db.relationship('Favorite', backref='user', lazy='dynamic')

    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password against hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Serialize user to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Address(db.Model):
    """User delivery addresses."""
    __tablename__ = 'addresses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(50))  # Home, Office, etc.
    country = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    street = db.Column(db.String(200), nullable=False)
    building = db.Column(db.String(20))
    apartment = db.Column(db.String(20))
    postal_code = db.Column(db.String(20))
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'country': self.country,
            'city': self.city,
            'street': self.street,
            'building': self.building,
            'apartment': self.apartment,
            'postal_code': self.postal_code,
            'is_default': self.is_default
        }


class Favorite(db.Model):
    """User favorite products."""
    __tablename__ = 'favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'product_id'),)






