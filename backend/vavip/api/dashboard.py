"""
Dashboard API - Analytics and Admin
"""
from datetime import datetime, timedelta
from flask import Blueprint, request
from sqlalchemy import func
from ..extensions import db
from ..models import User, Product, Order, OrderItem, Feedback
from ..utils.decorators import manager_required, validate_pagination
from ..utils.response_utils import success_response, paginated_response
from ..services.analytics_service import AnalyticsService

bp = Blueprint('dashboard', __name__)


@bp.route('/stats', methods=['GET'])
@manager_required
def get_stats():
    """Get dashboard statistics."""
    from ..utils.cache import cache_result
    
    days = request.args.get('days', 30, type=int)
    
    @cache_result(ttl=300, prefix=f'dashboard_stats_{days}')
    def _get_stats():
        return AnalyticsService.get_dashboard_stats(days)
    
    stats = _get_stats()
    return success_response(stats)


@bp.route('/sales-chart', methods=['GET'])
@manager_required
def get_sales_chart():
    """Get sales data for chart."""
    days = request.args.get('days', 30, type=int)
    sales_data = AnalyticsService.get_sales_by_day(days)
    return success_response(sales_data)


@bp.route('/top-products', methods=['GET'])
@manager_required
def get_top_products():
    """Get top selling products."""
    limit = request.args.get('limit', 10, type=int)
    days = request.args.get('days', 30, type=int)
    top_products = AnalyticsService.get_top_products(limit, days)
    return success_response(top_products)


@bp.route('/recent-orders', methods=['GET'])
@manager_required
def get_recent_orders():
    """Get recent orders."""
    limit = request.args.get('limit', 10, type=int)
    if limit > 100:
        limit = 100
    
    orders = Order.query.order_by(Order.created_at.desc()).limit(limit).all()
    
    return success_response([o.to_dict(include_items=False) for o in orders])


@bp.route('/order-status-breakdown', methods=['GET'])
@manager_required
def get_order_status_breakdown():
    """Get order count by status."""
    breakdown = AnalyticsService.get_order_status_breakdown()
    return success_response(breakdown)


@bp.route('/users', methods=['GET'])
@manager_required
@validate_pagination(max_per_page=100)
def get_users(page, per_page):
    """Get all users (admin/manager only)."""
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
    return paginated_response([u.to_dict() for u in pagination.items], pagination, data_key='users')


@bp.route('/users/<int:user_id>', methods=['PUT'])
@manager_required
def update_user(user_id):
    """Update user (admin/manager only)."""
    from ..utils.errors import NotFoundError
    
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError('User not found', 'USER_NOT_FOUND')
    
    data = request.get_json() or {}
    
    if 'role' in data:
        user.role = data['role']
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    db.session.commit()
    
    return success_response(user.to_dict())









