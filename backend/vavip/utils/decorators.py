"""
Decorators for authorization and common functionality.
"""
from functools import wraps
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from .errors import ForbiddenError, UnauthorizedError
from typing import List, Optional


def admin_required(f):
    """Decorator to require admin role."""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            raise ForbiddenError('Admin access required', 'ADMIN_REQUIRED')
        return f(*args, **kwargs)
    return decorated


def manager_required(f):
    """Decorator to require manager or admin role."""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role not in ['admin', 'manager']:
            raise ForbiddenError('Manager access required', 'MANAGER_REQUIRED')
        return f(*args, **kwargs)
    return decorated


def role_required(roles: List[str]):
    """
    Decorator factory to require specific roles.
    
    Args:
        roles: List of allowed roles (e.g., ['admin', 'manager'])
    
    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role not in roles:
                raise ForbiddenError(
                    f'Access denied. Required roles: {", ".join(roles)}',
                    'ROLE_REQUIRED'
                )
            return f(*args, **kwargs)
        return decorated
    return decorator


def validate_pagination(max_per_page: int = 100):
    """
    Decorator to validate and limit pagination parameters.
    
    Args:
        max_per_page: Maximum items per page
    
    Returns:
        Decorator function that adds validated page and per_page to kwargs
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            
            # Validate and limit per_page
            if per_page > max_per_page:
                per_page = max_per_page
            if per_page < 1:
                per_page = 20
            if page < 1:
                page = 1
            
            kwargs['page'] = page
            kwargs['per_page'] = per_page
            return f(*args, **kwargs)
        return decorated
    return decorator




