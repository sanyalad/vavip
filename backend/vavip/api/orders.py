"""
Orders API
"""
import uuid
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
    create_access_token,
    create_refresh_token,
)
from ..extensions import db, socketio
from ..models import Order, OrderItem, Product, User
from ..utils.validators import normalize_phone
from ..utils.errors import ValidationError, NotFoundError, ForbiddenError, ConflictError
from ..utils.response_utils import success_response
from ..utils.schema_validator import validate_request
from ..utils.decorators import manager_required
from ..schemas.order_schemas import CreateOrderSchema, UpdateOrderStatusSchema
from ..services.order_service import OrderService

bp = Blueprint('orders', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_orders():
    """Get user's orders."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Admin can see all orders
    if user and user.role in ['admin', 'manager']:
        if request.args.get('all') == 'true':
            orders = Order.query.order_by(Order.created_at.desc()).all()
            return success_response([o.to_dict() for o in orders])
    
    # Regular users see only their orders
    orders = OrderService.get_user_orders(user_id)
    return success_response([o.to_dict() for o in orders])


@bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get order by ID."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    order = Order.query.get(order_id)
    if not order:
        raise NotFoundError('Order not found', 'ORDER_NOT_FOUND')
    
    # Check ownership or admin
    if order.user_id != user_id and (not user or user.role not in ['admin', 'manager']):
        raise ForbiddenError('Unauthorized', 'UNAUTHORIZED')
    
    return success_response(order.to_dict())


@bp.route('/', methods=['POST'])
def create_order():
    """Create a new order."""
    # Optional auth: if JWT provided, create an order for current user.
    # If not authenticated, we auto-create an account by phone (as requested by frontend UX).
    verify_jwt_in_request(optional=True)
    user_id = get_jwt_identity()
    data = request.get_json()

    auth_payload = None
    auto_account_created = False

    if not user_id:
        raw_phone = (data or {}).get('customer_phone') if data else None
        if not raw_phone:
            raise ValidationError('customer_phone is required', 'PHONE_REQUIRED')

        phone = normalize_phone(raw_phone)
        if len(phone) < 10:
            raise ValidationError('Invalid phone', 'PHONE_INVALID')

        existing = User.query.filter_by(phone=phone).first()
        if existing:
            # Security: do not auto-login an existing account without verification.
            raise ConflictError('Phone already registered', 'PHONE_EXISTS')

        # Create a new user with a generated password.
        # We do not have SMS integration yet; frontend will display "password will be sent" and we return JWTs
        # so the user can continue seamlessly. SMS/OTP will be added next.
        email = f"auto_{phone}_{uuid.uuid4().hex[:6]}@auto.vavip"
        password = uuid.uuid4().hex[:10]

        user = User(
            email=email,
            first_name=(data or {}).get('customer_name'),
            phone=phone,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        user_id = user.id
        auto_account_created = True

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        auth_payload = {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
        }
    
    # Validate request data with schema
    validated_data = validate_request(CreateOrderSchema, data)
    
    # Create order using service
    try:
        order = OrderService.create_order(
            user_id=user_id,
            items=validated_data['items'],
            payment_method=validated_data.get('payment_method'),
            delivery_method=validated_data.get('delivery_method'),
            delivery_address=validated_data.get('delivery_address'),
            delivery_cost=float(validated_data.get('delivery_cost', 0)),
            discount=float(validated_data.get('discount', 0)),
            promo_code=validated_data.get('promo_code'),
            customer_name=validated_data.get('customer_name'),
            customer_email=validated_data.get('customer_email'),
            customer_phone=validated_data.get('customer_phone'),
            customer_note=validated_data.get('customer_note')
        )
        
        # Emit WebSocket event
        socketio.emit('order_created', order.to_dict(), room=f'user_{user_id}')
        socketio.emit('new_order', order.to_dict(), room='admins')
        
        payload = {
            'order': order.to_dict(),
            'auto_account_created': auto_account_created
        }
        if auth_payload:
            payload.update(auth_payload)
        
        return success_response(payload, status_code=201)
    except ValueError as e:
        raise ValidationError(str(e), 'ORDER_CREATION_FAILED')


@bp.route('/<int:order_id>/status', methods=['PUT'])
@manager_required
def update_order_status(order_id):
    """Update order status (admin/manager only)."""
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(UpdateOrderStatusSchema, data)
    
    order = Order.query.get(order_id)
    if not order:
        raise NotFoundError('Order not found', 'ORDER_NOT_FOUND')
    
    old_status = order.status
    new_status = validated_data.get('status')
    
    if new_status:
        try:
            OrderService.update_status(order_id, new_status)
            order = Order.query.get(order_id)  # Refresh
        except ValueError as e:
            raise ValidationError(str(e), 'STATUS_UPDATE_FAILED')
    
    if 'payment_status' in validated_data:
        try:
            OrderService.update_payment_status(order_id, validated_data['payment_status'])
            order = Order.query.get(order_id)  # Refresh
        except ValueError as e:
            raise ValidationError(str(e), 'PAYMENT_STATUS_UPDATE_FAILED')
    
    if 'admin_note' in validated_data:
        order.admin_note = validated_data['admin_note']
        db.session.commit()
    
    # Emit WebSocket event for status change
    socketio.emit('order_status_changed', {
        'order_id': order.id,
        'order_number': order.order_number,
        'old_status': old_status,
        'new_status': order.status,
        'payment_status': order.payment_status
    }, room=f'user_{order.user_id}')
    
    return success_response(order.to_dict())


@bp.route('/<int:order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    order = Order.query.get(order_id)
    if not order:
        raise NotFoundError('Order not found', 'ORDER_NOT_FOUND')
    
    # Check ownership or admin
    if order.user_id != user_id and (not user or user.role not in ['admin', 'manager']):
        raise ForbiddenError('Unauthorized', 'UNAUTHORIZED')
    
    try:
        OrderService.cancel_order(order_id, user_id)
        order = Order.query.get(order_id)  # Refresh
        
        # Emit WebSocket event
        socketio.emit('order_cancelled', {
            'order_id': order.id,
            'order_number': order.order_number
        }, room=f'user_{order.user_id}')
        
        return success_response(order.to_dict())
    except ValueError as e:
        raise ValidationError(str(e), 'CANCEL_FAILED')


@bp.route('/<int:order_id>/repeat', methods=['POST'])
@jwt_required()
def repeat_order(order_id):
    """Repeat a previous order."""
    user_id = get_jwt_identity()
    
    original_order = Order.query.get(order_id)
    if not original_order:
        raise NotFoundError('Order not found', 'ORDER_NOT_FOUND')
    
    if original_order.user_id != user_id:
        raise ForbiddenError('Unauthorized', 'UNAUTHORIZED')
    
    # Create items list from original order
    items = []
    for item in original_order.items.all():
        items.append({
            'product_id': item.product_id,
            'quantity': item.quantity
        })
    
    if not items:
        raise ValidationError('Original order has no items', 'NO_ITEMS')
    
    # Create new order using service
    try:
        new_order = OrderService.create_order(
            user_id=user_id,
            items=items,
            delivery_method=original_order.delivery_method,
            delivery_address=original_order.delivery_address,
            payment_method=original_order.payment_method,
            customer_name=original_order.customer_name,
            customer_email=original_order.customer_email,
            customer_phone=original_order.customer_phone
        )
        
        return success_response(new_order.to_dict(), status_code=201)
    except ValueError as e:
        raise ValidationError(str(e), 'ORDER_REPEAT_FAILED')






