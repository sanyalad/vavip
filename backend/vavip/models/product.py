"""
Product and Category Models
"""
from datetime import datetime
from ..extensions import db


class Category(db.Model):
    """Product category."""
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Self-referential relationship for subcategories
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]))
    products = db.relationship('Product', backref='category', lazy='dynamic')

    def to_dict(self, include_children=False):
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'image_url': self.image_url,
            'parent_id': self.parent_id,
            'is_active': self.is_active,
            'sort_order': self.sort_order
        }
        if include_children:
            data['children'] = [c.to_dict() for c in self.children]
        return data


class Product(db.Model):
    """Product model."""
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    sku = db.Column(db.String(50), unique=True, index=True)
    description = db.Column(db.Text)
    short_description = db.Column(db.String(500))
    price = db.Column(db.Numeric(10, 2), nullable=False)
    old_price = db.Column(db.Numeric(10, 2))  # For discounts
    currency = db.Column(db.String(3), default='RUB')
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    stock_quantity = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    images = db.relationship('ProductImage', backref='product', lazy='dynamic', cascade='all, delete-orphan')
    attributes = db.relationship('ProductAttribute', backref='product', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'sku': self.sku,
            'price': float(self.price) if self.price else 0,
            'old_price': float(self.old_price) if self.old_price else None,
            'currency': self.currency,
            'category_id': self.category_id,
            'stock_quantity': self.stock_quantity,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'short_description': self.short_description,
            'main_image': self.images.filter_by(is_main=True).first().url if self.images.filter_by(is_main=True).first() else None
        }
        if include_details:
            data['description'] = self.description
            data['images'] = [img.to_dict() for img in self.images.all()]
            data['attributes'] = [attr.to_dict() for attr in self.attributes.all()]
            if self.category:
                data['category'] = self.category.to_dict()
        return data


class ProductImage(db.Model):
    """Product images."""
    __tablename__ = 'product_images'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    alt_text = db.Column(db.String(200))
    is_main = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'alt_text': self.alt_text,
            'is_main': self.is_main,
            'sort_order': self.sort_order
        }


class ProductAttribute(db.Model):
    """Product attributes (specifications)."""
    __tablename__ = 'product_attributes'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(500), nullable=False)
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'value': self.value
        }












