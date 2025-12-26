"""
User Service - Business logic for user management
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy.orm import joinedload
from ..extensions import db
from ..models import User, Order
from ..utils.errors import ValidationError, NotFoundError, ErrorCodes


class UserService:
    """User business logic layer."""
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User instance or None
        """
        return User.query.get(user_id)
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            email: User email
            
        Returns:
            User instance or None
        """
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def get_user_by_phone(phone: str) -> Optional[User]:
        """
        Get user by phone number.
        
        Args:
            phone: User phone number
            
        Returns:
            User instance or None
        """
        return User.query.filter_by(phone=phone).first()
    
    @staticmethod
    def create_user(
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None,
        role: str = 'customer'
    ) -> User:
        """
        Create a new user.
        
        Args:
            email: User email
            password: User password
            first_name: First name
            last_name: Last name
            phone: Phone number
            role: User role (default: 'customer')
            
        Returns:
            Created user instance
            
        Raises:
            ValidationError: If email already exists
        """
        # Check email uniqueness
        if User.query.filter_by(email=email).first():
            raise ValidationError(
                'Email already registered',
                error_code=ErrorCodes.EMAIL_EXISTS,
                field='email'
            )
        
        # Check phone uniqueness if provided
        if phone:
            if User.query.filter_by(phone=phone).first():
                raise ValidationError(
                    'Phone number already registered',
                    error_code=ErrorCodes.PHONE_EXISTS,
                    field='phone'
                )
        
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role,
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    @staticmethod
    def update_user(user_id: int, **kwargs) -> User:
        """
        Update user profile.
        
        Args:
            user_id: User ID
            **kwargs: Fields to update
            
        Returns:
            Updated user instance
            
        Raises:
            NotFoundError: If user not found
            ValidationError: If email/phone already taken
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(
                'User not found',
                error_code=ErrorCodes.USER_NOT_FOUND,
                resource_type='User',
                resource_id=user_id
            )
        
        # Handle email update with uniqueness check
        if 'email' in kwargs and kwargs['email']:
            email = kwargs.pop('email')
            if email != user.email:
                if User.query.filter_by(email=email).first():
                    raise ValidationError(
                        'Email already registered',
                        error_code=ErrorCodes.EMAIL_EXISTS,
                        field='email'
                    )
                user.email = email
        
        # Handle phone update with uniqueness check
        if 'phone' in kwargs and kwargs['phone']:
            phone = kwargs.pop('phone')
            if phone != user.phone:
                if User.query.filter_by(phone=phone).first():
                    raise ValidationError(
                        'Phone number already registered',
                        error_code=ErrorCodes.PHONE_EXISTS,
                        field='phone'
                    )
                user.phone = phone
        
        # Update other fields
        protected_fields = {'id', 'password_hash', 'role', 'created_at'}
        for key, value in kwargs.items():
            if value is not None and hasattr(user, key) and key not in protected_fields:
                setattr(user, key, value)
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return user
    
    @staticmethod
    def change_password(user_id: int, current_password: str, new_password: str) -> bool:
        """
        Change user password.
        
        Args:
            user_id: User ID
            current_password: Current password
            new_password: New password
            
        Returns:
            True if password changed successfully
            
        Raises:
            NotFoundError: If user not found
            ValidationError: If current password is incorrect
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(
                'User not found',
                error_code=ErrorCodes.USER_NOT_FOUND
            )
        
        if not user.check_password(current_password):
            raise ValidationError(
                'Current password is incorrect',
                error_code=ErrorCodes.INVALID_CREDENTIALS,
                field='current_password'
            )
        
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return True
    
    @staticmethod
    def reset_password(user_id: int, new_password: str) -> bool:
        """
        Reset user password (admin function).
        
        Args:
            user_id: User ID
            new_password: New password
            
        Returns:
            True if password reset successfully
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(
                'User not found',
                error_code=ErrorCodes.USER_NOT_FOUND
            )
        
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return True
    
    @staticmethod
    def get_user_orders(user_id: int, limit: int = 10) -> List[Dict]:
        """
        Get user's recent orders.
        
        Args:
            user_id: User ID
            limit: Maximum number of orders to return
            
        Returns:
            List of order dictionaries
        """
        orders = Order.query.filter_by(user_id=user_id)\
            .options(joinedload(Order.items))\
            .order_by(Order.created_at.desc())\
            .limit(limit).all()
        
        return [o.to_dict() for o in orders]
    
    @staticmethod
    def get_all_users(
        page: int = 1,
        per_page: int = 20,
        role: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple:
        """
        Get paginated list of users (admin function).
        
        Args:
            page: Page number
            per_page: Items per page
            role: Filter by role
            search: Search term for email/name/phone
            is_active: Filter by active status
            
        Returns:
            Tuple of (users list, pagination info)
        """
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    User.email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.phone.ilike(search_term)
                )
            )
        
        query = query.order_by(User.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return pagination.items, pagination
    
    @staticmethod
    def deactivate_user(user_id: int) -> User:
        """
        Deactivate a user account.
        
        Args:
            user_id: User ID
            
        Returns:
            Updated user instance
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(
                'User not found',
                error_code=ErrorCodes.USER_NOT_FOUND
            )
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return user
    
    @staticmethod
    def activate_user(user_id: int) -> User:
        """
        Activate a user account.
        
        Args:
            user_id: User ID
            
        Returns:
            Updated user instance
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(
                'User not found',
                error_code=ErrorCodes.USER_NOT_FOUND
            )
        
        user.is_active = True
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return user
    
    @staticmethod
    def get_user_stats(user_id: int) -> Dict[str, Any]:
        """
        Get statistics for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with user statistics
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(
                'User not found',
                error_code=ErrorCodes.USER_NOT_FOUND
            )
        
        # Get order statistics
        total_orders = Order.query.filter_by(user_id=user_id).count()
        completed_orders = Order.query.filter_by(
            user_id=user_id, 
            status='completed'
        ).count()
        
        # Get total spent
        from sqlalchemy import func
        total_spent = db.session.query(func.sum(Order.total_amount))\
            .filter_by(user_id=user_id, status='completed').scalar() or 0
        
        return {
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'total_spent': float(total_spent),
            'member_since': user.created_at.isoformat() if user.created_at else None,
        }


