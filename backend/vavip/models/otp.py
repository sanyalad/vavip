"""
OTP (one-time code) model for phone authentication.
Dev-mode friendly: we store hash only; sending is handled elsewhere.
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class PhoneOTP(db.Model):
    __tablename__ = 'phone_otps'

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(20), nullable=False, index=True)
    code_hash = db.Column(db.String(256), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    used_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def set_code(self, code: str):
        self.code_hash = generate_password_hash(str(code))

    def check_code(self, code: str) -> bool:
        return check_password_hash(self.code_hash, str(code))

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() >= self.expires_at




