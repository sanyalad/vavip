"""
Contact Model
"""
from datetime import datetime
from ..extensions import db


class Contact(db.Model):
    """Office/branch contacts."""
    __tablename__ = 'contacts'

    id = db.Column(db.Integer, primary_key=True)
    country = db.Column(db.String(50), nullable=False, index=True)
    country_code = db.Column(db.String(5))  # RU, BY, KZ, GE, AE
    city = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(300), nullable=False)
    phone = db.Column(db.String(50))
    email = db.Column(db.String(120))
    working_hours = db.Column(db.String(200))
    map_lat = db.Column(db.Float)
    map_lng = db.Column(db.Float)
    photo_url = db.Column(db.String(500))
    map_image_url = db.Column(db.String(500))
    is_headquarters = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'country': self.country,
            'country_code': self.country_code,
            'city': self.city,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'working_hours': self.working_hours,
            'map_lat': self.map_lat,
            'map_lng': self.map_lng,
            'photo_url': self.photo_url,
            'map_image_url': self.map_image_url,
            'is_headquarters': self.is_headquarters,
            'is_active': self.is_active,
            'sort_order': self.sort_order
        }











