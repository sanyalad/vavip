"""
Authentication API
"""
import uuid
import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from ..extensions import db
from ..models import User, PhoneOTP
from ..utils.validators import normalize_phone, validate_phone

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate required fields
    required = ['email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create user
    user = User(
        email=data['email'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        phone=data.get('phone')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT tokens."""
    data = request.get_json()
    
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    
    if (not email and not phone) or not password:
        return jsonify({'error': 'Email/phone and password are required'}), 400
    
    user = None
    if phone:
        normalized = normalize_phone(phone)
        user = User.query.filter_by(phone=normalized).first()
    elif email:
        user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403
    
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    })


@bp.route('/otp/send', methods=['POST'])
def otp_send():
    """
    Generate OTP code for phone auth.
    Dev-mode: returns the code in response for testing (no SMS sending).
    """
    data = request.get_json() or {}
    phone_raw = data.get('phone')
    if not phone_raw:
        return jsonify({'error': 'phone is required', 'code': 'PHONE_REQUIRED'}), 400

    if not validate_phone(str(phone_raw)):
        return jsonify({'error': 'Invalid phone', 'code': 'PHONE_INVALID'}), 400

    phone = normalize_phone(phone_raw)
    if len(phone) < 10:
        return jsonify({'error': 'Invalid phone', 'code': 'PHONE_INVALID'}), 400

    # Invalidate previous unused OTPs for this phone (keep table clean)
    PhoneOTP.query.filter_by(phone=phone, used_at=None).delete(synchronize_session=False)

    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    otp = PhoneOTP(
        phone=phone,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        attempts=0,
    )
    otp.set_code(code)
    db.session.add(otp)
    db.session.commit()

    resp = {
        'message': 'OTP generated',
        'expires_in': 300,
    }
    # Return code in dev (no SMS)
    resp['dev_code'] = code
    return jsonify(resp), 200


@bp.route('/otp/verify', methods=['POST'])
def otp_verify():
    """
    Verify OTP code and return JWT tokens.
    If user doesn't exist, auto-create by phone (email is generated).
    """
    data = request.get_json() or {}
    phone_raw = data.get('phone')
    code = data.get('code')
    if not phone_raw or not code:
        return jsonify({'error': 'phone and code are required', 'code': 'OTP_REQUIRED'}), 400

    phone = normalize_phone(phone_raw)
    otp = PhoneOTP.query.filter_by(phone=phone, used_at=None)\
        .order_by(PhoneOTP.created_at.desc()).first()

    if not otp or otp.is_expired:
        return jsonify({'error': 'Code expired', 'code': 'OTP_EXPIRED'}), 410

    # Basic brute-force protection
    if otp.attempts >= 5:
        return jsonify({'error': 'Too many attempts', 'code': 'OTP_TOO_MANY_ATTEMPTS'}), 429

    otp.attempts += 1
    if not otp.check_code(str(code)):
        db.session.commit()
        return jsonify({'error': 'Invalid code', 'code': 'OTP_INVALID'}), 401

    otp.used_at = datetime.utcnow()

    user = User.query.filter_by(phone=phone).first()
    auto_created = False
    dev_password = None

    if not user:
        auto_created = True
        email = f"auto_{phone}_{uuid.uuid4().hex[:6]}@auto.vavip"
        dev_password = uuid.uuid4().hex[:10]
        user = User(email=email, phone=phone, first_name=data.get('first_name'))
        user.set_password(dev_password)
        db.session.add(user)

    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    resp = {
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
        'auto_created': auto_created,
    }
    # Dev-only helper: if we created a password, return it for testing.
    if dev_password:
        resp['dev_password'] = dev_password

    return jsonify(resp), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({'access_token': access_token})


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user profile."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    data = request.get_json()
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    
    db.session.commit()
    
    return jsonify(user.to_dict())


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password are required'}), 400
    
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)."""
    # In a production app, you might want to blacklist the token
    return jsonify({'message': 'Logged out successfully'})






