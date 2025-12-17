"""
Feedback Model
"""
from datetime import datetime
from ..extensions import db


class Feedback(db.Model):
    """Contact form submissions."""
    __tablename__ = 'feedback'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    source_page = db.Column(db.String(100))  # Which page the form was submitted from
    status = db.Column(db.String(20), default='new')  # new, read, replied, closed
    admin_note = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'subject': self.subject,
            'message': self.message,
            'source_page': self.source_page,
            'status': self.status,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }








