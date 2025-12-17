"""
Authentication Service
"""
from flask_jwt_extended import create_access_token, create_refresh_token
from ..extensions import db
from ..models import User


class AuthService:
    """Authentication business logic."""
    
    @staticmethod
    def register_user(email, password, **kwargs):
        """Register a new user."""
        if User.query.filter_by(email=email).first():
            raise ValueError('Email already registered')
        
        user = User(
            email=email,
            first_name=kwargs.get('first_name'),
            last_name=kwargs.get('last_name'),
            phone=kwargs.get('phone')
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    @staticmethod
    def authenticate(email, password):
        """Authenticate user and return tokens."""
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return None, None, None
        
        if not user.is_active:
            raise ValueError('Account is disabled')
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return user, access_token, refresh_token
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID."""
        return User.query.get(user_id)
    
    @staticmethod
    def update_user(user_id, **kwargs):
        """Update user profile."""
        user = User.query.get(user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key) and key not in ['id', 'email', 'password_hash', 'role']:
                setattr(user, key, value)
        
        db.session.commit()
        return user
    
    @staticmethod
    def change_password(user_id, current_password, new_password):
        """Change user password."""
        user = User.query.get(user_id)
        if not user:
            raise ValueError('User not found')
        
        if not user.check_password(current_password):
            raise ValueError('Current password is incorrect')
        
        user.set_password(new_password)
        db.session.commit()
        return True








