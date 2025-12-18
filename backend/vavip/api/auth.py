"""
Authentication API
"""
import uuid
import random
from datetime import datetime, timedelta
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from ..extensions import db, limiter
from ..models import User, PhoneOTP
from ..utils.validators import normalize_phone, validate_phone, validate_email, validate_password
from ..utils.errors import ValidationError, NotFoundError, UnauthorizedError, ConflictError, RateLimitError
from ..utils.response_utils import success_response, error_response
from ..utils.schema_validator import validate_request
from ..schemas.auth_schemas import (
    RegisterSchema, LoginSchema, OTPSendSchema, OTPVerifySchema,
    UpdateProfileSchema, ChangePasswordSchema
)
from ..services.auth_service import AuthService

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
@limiter.limit("3 per hour")
def register():
    """Register a new user."""
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(RegisterSchema, data)
    
    # Additional password strength validation
    is_valid, error_msg = validate_password(validated_data['password'])
    if not is_valid:
        raise ValidationError(error_msg, 'PASSWORD_WEAK')
    
    # Check if user exists
    if User.query.filter_by(email=validated_data['email']).first():
        raise ConflictError('Email already registered', 'EMAIL_EXISTS')
    
    # Create user using service
    try:
        user = AuthService.register_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            phone=validated_data.get('phone')
        )
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return success_response({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }, status_code=201, message='User registered successfully')
    except ValueError as e:
        raise ConflictError(str(e), 'REGISTRATION_FAILED')


@bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Login user and return JWT tokens."""
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(LoginSchema, data)
    
    email = validated_data.get('email')
    phone = validated_data.get('phone')
    password = validated_data['password']
    
    user = None
    if phone:
        normalized = normalize_phone(phone)
        user = User.query.filter_by(phone=normalized).first()
    elif email:
        user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        raise UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS')
    
    if not user.is_active:
        raise UnauthorizedError('Account is disabled', 'ACCOUNT_DISABLED')
    
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return success_response({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    })


@bp.route('/otp/send', methods=['POST'])
@limiter.limit("3 per 10 minutes", key_func=lambda: request.get_json().get('phone') if request.get_json() else None)
def otp_send():
    """
    Generate OTP code for phone auth.
    Dev-mode: returns the code in response for testing (no SMS sending).
    """
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(OTPSendSchema, data)
    phone_raw = validated_data['phone']
    
    if not validate_phone(str(phone_raw)):
        raise ValidationError('Invalid phone format', 'PHONE_INVALID')

    phone = normalize_phone(phone_raw)
    if len(phone) < 10:
        raise ValidationError('Invalid phone number', 'PHONE_INVALID')

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
        'expires_in': 300,
    }
    # Return code in dev (no SMS)
    resp['dev_code'] = code
    return success_response(resp, message='OTP generated')


@bp.route('/otp/verify', methods=['POST'])
def otp_verify():
    """
    Verify OTP code and return JWT tokens.
    If user doesn't exist, auto-create by phone (email is generated).
    """
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(OTPVerifySchema, data)
    phone_raw = validated_data['phone']
    code = validated_data['code']

    phone = normalize_phone(phone_raw)
    otp = PhoneOTP.query.filter_by(phone=phone, used_at=None)\
        .order_by(PhoneOTP.created_at.desc()).first()

    if not otp or otp.is_expired:
        raise ValidationError('Code expired', 'OTP_EXPIRED')

    # Basic brute-force protection
    if otp.attempts >= 5:
        raise RateLimitError('Too many attempts', 'OTP_TOO_MANY_ATTEMPTS')

    otp.attempts += 1
    if not otp.check_code(str(code)):
        db.session.commit()
        raise UnauthorizedError('Invalid code', 'OTP_INVALID')

    otp.used_at = datetime.utcnow()

    user = User.query.filter_by(phone=phone).first()
    auto_created = False
    dev_password = None

    if not user:
        auto_created = True
        email = f"auto_{phone}_{uuid.uuid4().hex[:6]}@auto.vavip"
        dev_password = uuid.uuid4().hex[:10]
        user = User(email=email, phone=phone, first_name=validated_data.get('first_name'))
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

    return success_response(resp)


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    from flask_jwt_extended import get_jwt
    from ..extensions import redis_client
    from datetime import datetime
    
    # Blacklist the old refresh token
    jti = get_jwt().get('jti')
    exp = get_jwt().get('exp')
    
    if jti and redis_client:
        if exp:
            ttl = exp - int(datetime.utcnow().timestamp())
            if ttl > 0:
                redis_client.setex(f'blacklist:{jti}', ttl, 'true')
        else:
            # Default TTL for refresh token (30 days)
            redis_client.setex(f'blacklist:{jti}', 2592000, 'true')
    
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return success_response({'access_token': access_token})


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError('User not found', 'USER_NOT_FOUND')
    return success_response(user.to_dict())


@bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError('User not found', 'USER_NOT_FOUND')
    
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(UpdateProfileSchema, data)
    
    # Update using service
    try:
        updated_user = AuthService.update_user(
            user_id,
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            phone=validated_data.get('phone'),
            email=validated_data.get('email')
        )
        
        if not updated_user:
            raise NotFoundError('User not found', 'USER_NOT_FOUND')
        
        return success_response(updated_user.to_dict())
    except ValueError as e:
        raise ConflictError(str(e), 'UPDATE_FAILED')


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(ChangePasswordSchema, data)
    
    # Additional password strength validation
    is_valid, error_msg = validate_password(validated_data['new_password'])
    if not is_valid:
        raise ValidationError(error_msg, 'PASSWORD_WEAK')
    
    try:
        AuthService.change_password(user_id, validated_data['current_password'], validated_data['new_password'])
        return success_response(message='Password changed successfully')
    except ValueError as e:
        raise UnauthorizedError(str(e), 'PASSWORD_INCORRECT')


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)."""
    from flask_jwt_extended import get_jwt
    from ..extensions import redis_client
    from datetime import datetime, timedelta
    
    # Get token JTI
    jti = get_jwt().get('jti')
    exp = get_jwt().get('exp')
    
    if jti and redis_client:
        # Calculate TTL (time until token expires)
        if exp:
            ttl = exp - int(datetime.utcnow().timestamp())
            if ttl > 0:
                redis_client.setex(f'blacklist:{jti}', ttl, 'true')
        else:
            # Default TTL of 1 hour if exp is not available
            redis_client.setex(f'blacklist:{jti}', 3600, 'true')
    
    return success_response(message='Logged out successfully')






