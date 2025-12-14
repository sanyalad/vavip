"""
Orders API
"""
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
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

bp = Blueprint('orders', __name__)


def generate_order_number():
    """Generate unique order number."""
    return f"VAV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


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
            return jsonify([o.to_dict() for o in orders])
    
    # Regular users see only their orders
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get order by ID."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    order = Order.query.get_or_404(order_id)
    
    # Check ownership or admin
    if order.user_id != user_id and (not user or user.role not in ['admin', 'manager']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(order.to_dict())


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
            return jsonify({'error': 'customer_phone is required', 'code': 'PHONE_REQUIRED'}), 400

        phone = normalize_phone(raw_phone)
        if len(phone) < 10:
            return jsonify({'error': 'Invalid phone', 'code': 'PHONE_INVALID'}), 400

        existing = User.query.filter_by(phone=phone).first()
        if existing:
            # Security: do not auto-login an existing account without verification.
            return jsonify({'error': 'Phone already registered', 'code': 'PHONE_EXISTS'}), 409

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
    
    # Validate items
    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'Order must have at least one item'}), 400
    
    # Calculate totals
    subtotal = 0
    order_items = []
    
    for item in items:
        product = Product.query.get(item.get('product_id'))
        if not product:
            return jsonify({'error': f"Product {item.get('product_id')} not found"}), 404
        
        quantity = item.get('quantity', 1)
        item_total = float(product.price) * quantity
        subtotal += item_total
        
        order_items.append({
            'product': product,
            'quantity': quantity,
            'price': float(product.price),
            'total': item_total
        })
    
    # Apply discount
    discount = data.get('discount', 0)
    delivery_cost = data.get('delivery_cost', 0)
    total = subtotal - discount + delivery_cost
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        user_id=user_id,
        status='pending',
        payment_status='pending',
        payment_method=data.get('payment_method'),
        delivery_method=data.get('delivery_method'),
        delivery_address=data.get('delivery_address'),
        delivery_cost=delivery_cost,
        subtotal=subtotal,
        discount=discount,
        total=total,
        promo_code=data.get('promo_code'),
        customer_name=data.get('customer_name'),
        customer_email=data.get('customer_email'),
        customer_phone=data.get('customer_phone'),
        customer_note=data.get('customer_note')
    )
    
    db.session.add(order)
    db.session.flush()  # Get order ID
    
    # Create order items
    for item_data in order_items:
        product = item_data['product']
        main_image = product.images.filter_by(is_main=True).first()
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            product_image=main_image.url if main_image else None,
            quantity=item_data['quantity'],
            price=item_data['price'],
            total=item_data['total']
        )
        db.session.add(order_item)
    
    db.session.commit()
    
    # Emit WebSocket event
    socketio.emit('order_created', order.to_dict(), room=f'user_{user_id}')
    socketio.emit('new_order', order.to_dict(), room='admins')
    
    payload = {
        'order': order.to_dict(),
        'auto_account_created': auto_account_created
    }
    if auth_payload:
        payload.update(auth_payload)

    return jsonify(payload), 201


@bp.route('/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """Update order status (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    
    old_status = order.status
    new_status = data.get('status')
    
    if new_status:
        order.status = new_status
        
        # Update timestamps based on status
        if new_status == 'shipped':
            order.shipped_at = datetime.utcnow()
        elif new_status == 'delivered':
            order.delivered_at = datetime.utcnow()
    
    if 'payment_status' in data:
        order.payment_status = data['payment_status']
        if data['payment_status'] == 'paid':
            order.paid_at = datetime.utcnow()
    
    if 'admin_note' in data:
        order.admin_note = data['admin_note']
    
    db.session.commit()
    
    # Emit WebSocket event for status change
    socketio.emit('order_status_changed', {
        'order_id': order.id,
        'order_number': order.order_number,
        'old_status': old_status,
        'new_status': order.status,
        'payment_status': order.payment_status
    }, room=f'user_{order.user_id}')
    
    return jsonify(order.to_dict())


@bp.route('/<int:order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    order = Order.query.get_or_404(order_id)
    
    # Check ownership or admin
    if order.user_id != user_id and (not user or user.role not in ['admin', 'manager']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Can only cancel pending orders
    if order.status not in ['pending', 'confirmed']:
        return jsonify({'error': 'Cannot cancel order in current status'}), 400
    
    order.status = 'cancelled'
    db.session.commit()
    
    # Emit WebSocket event
    socketio.emit('order_cancelled', {
        'order_id': order.id,
        'order_number': order.order_number
    }, room=f'user_{order.user_id}')
    
    return jsonify(order.to_dict())


@bp.route('/<int:order_id>/repeat', methods=['POST'])
@jwt_required()
def repeat_order(order_id):
    """Repeat a previous order."""
    user_id = get_jwt_identity()
    
    original_order = Order.query.get_or_404(order_id)
    
    if original_order.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Create items list from original order
    items = []
    for item in original_order.items.all():
        items.append({
            'product_id': item.product_id,
            'quantity': item.quantity
        })
    
    # Create new order using the create_order logic
    request_data = {
        'items': items,
        'delivery_method': original_order.delivery_method,
        'delivery_address': original_order.delivery_address,
        'payment_method': original_order.payment_method,
        'customer_name': original_order.customer_name,
        'customer_email': original_order.customer_email,
        'customer_phone': original_order.customer_phone
    }
    
    # We'll process this manually since we can't modify request
    # Similar logic to create_order
    subtotal = 0
    order_items = []
    
    for item in items:
        product = Product.query.get(item.get('product_id'))
        if not product or not product.is_active:
            continue
        
        quantity = item.get('quantity', 1)
        item_total = float(product.price) * quantity
        subtotal += item_total
        
        order_items.append({
            'product': product,
            'quantity': quantity,
            'price': float(product.price),
            'total': item_total
        })
    
    if not order_items:
        return jsonify({'error': 'No available products from original order'}), 400
    
    new_order = Order(
        order_number=generate_order_number(),
        user_id=user_id,
        status='pending',
        payment_status='pending',
        payment_method=original_order.payment_method,
        delivery_method=original_order.delivery_method,
        delivery_address=original_order.delivery_address,
        subtotal=subtotal,
        total=subtotal,
        customer_name=original_order.customer_name,
        customer_email=original_order.customer_email,
        customer_phone=original_order.customer_phone
    )
    
    db.session.add(new_order)
    db.session.flush()
    
    for item_data in order_items:
        product = item_data['product']
        main_image = product.images.filter_by(is_main=True).first()
        
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            product_image=main_image.url if main_image else None,
            quantity=item_data['quantity'],
            price=item_data['price'],
            total=item_data['total']
        )
        db.session.add(order_item)
    
    db.session.commit()
    
    return jsonify(new_order.to_dict()), 201






