"""
Dashboard API - Analytics and Admin
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from ..extensions import db
from ..models import User, Product, Order, OrderItem, Feedback

bp = Blueprint('dashboard', __name__)


def admin_required(f):
    """Decorator for admin-only endpoints."""
    from functools import wraps
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        return f(*args, **kwargs)
    return decorated


@bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """Get dashboard statistics."""
    # Time range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total counts
    total_users = User.query.count()
    total_products = Product.query.filter_by(is_active=True).count()
    total_orders = Order.query.count()
    
    # Orders in period
    orders_in_period = Order.query.filter(Order.created_at >= start_date).count()
    
    # Revenue
    revenue = db.session.query(func.sum(Order.total)).filter(
        Order.payment_status == 'paid',
        Order.created_at >= start_date
    ).scalar() or 0
    
    # Pending orders
    pending_orders = Order.query.filter_by(status='pending').count()
    
    # Unread feedback
    unread_feedback = Feedback.query.filter_by(is_read=False).count()
    
    # New users
    new_users = User.query.filter(User.created_at >= start_date).count()
    
    return jsonify({
        'total_users': total_users,
        'total_products': total_products,
        'total_orders': total_orders,
        'orders_in_period': orders_in_period,
        'revenue': float(revenue),
        'pending_orders': pending_orders,
        'unread_feedback': unread_feedback,
        'new_users': new_users,
        'period_days': days
    })


@bp.route('/sales-chart', methods=['GET'])
@admin_required
def get_sales_chart():
    """Get sales data for chart."""
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily sales
    sales_data = db.session.query(
        func.date(Order.created_at).label('date'),
        func.sum(Order.total).label('revenue'),
        func.count(Order.id).label('orders')
    ).filter(
        Order.created_at >= start_date,
        Order.payment_status == 'paid'
    ).group_by(func.date(Order.created_at)).all()
    
    return jsonify([{
        'date': str(row.date),
        'revenue': float(row.revenue) if row.revenue else 0,
        'orders': row.orders
    } for row in sales_data])


@bp.route('/top-products', methods=['GET'])
@admin_required
def get_top_products():
    """Get top selling products."""
    limit = request.args.get('limit', 10, type=int)
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    top_products = db.session.query(
        OrderItem.product_id,
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label('total_quantity'),
        func.sum(OrderItem.total).label('total_revenue')
    ).join(Order).filter(
        Order.created_at >= start_date,
        Order.payment_status == 'paid'
    ).group_by(
        OrderItem.product_id, OrderItem.product_name
    ).order_by(func.sum(OrderItem.quantity).desc()).limit(limit).all()
    
    return jsonify([{
        'product_id': row.product_id,
        'product_name': row.product_name,
        'total_quantity': row.total_quantity,
        'total_revenue': float(row.total_revenue) if row.total_revenue else 0
    } for row in top_products])


@bp.route('/recent-orders', methods=['GET'])
@admin_required
def get_recent_orders():
    """Get recent orders."""
    limit = request.args.get('limit', 10, type=int)
    
    orders = Order.query.order_by(Order.created_at.desc()).limit(limit).all()
    
    return jsonify([o.to_dict(include_items=False) for o in orders])


@bp.route('/order-status-breakdown', methods=['GET'])
@admin_required
def get_order_status_breakdown():
    """Get order count by status."""
    status_counts = db.session.query(
        Order.status,
        func.count(Order.id).label('count')
    ).group_by(Order.status).all()
    
    return jsonify({row.status: row.count for row in status_counts})


@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users (admin only)."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    search = request.args.get('search')
    role = request.args.get('role')
    
    query = User.query.order_by(User.created_at.desc())
    
    if search:
        query = query.filter(
            db.or_(
                User.email.ilike(f'%{search}%'),
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%')
            )
        )
    
    if role:
        query = query.filter_by(role=role)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user (admin only)."""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'role' in data:
        user.role = data['role']
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify(user.to_dict())


