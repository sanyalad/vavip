"""
Analytics Service
"""
from datetime import datetime, timedelta
from sqlalchemy import func
from ..extensions import db
from ..models import User, Product, Order, OrderItem, Feedback


class AnalyticsService:
    """Analytics and reporting business logic."""
    
    @staticmethod
    def get_dashboard_stats(days=30):
        """Get main dashboard statistics."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        return {
            'total_users': User.query.count(),
            'total_products': Product.query.filter_by(is_active=True).count(),
            'total_orders': Order.query.count(),
            'orders_in_period': Order.query.filter(Order.created_at >= start_date).count(),
            'revenue': float(db.session.query(func.sum(Order.total)).filter(
                Order.payment_status == 'paid',
                Order.created_at >= start_date
            ).scalar() or 0),
            'pending_orders': Order.query.filter_by(status='pending').count(),
            'unread_feedback': Feedback.query.filter_by(is_read=False).count(),
            'new_users': User.query.filter(User.created_at >= start_date).count(),
            'period_days': days
        }
    
    @staticmethod
    def get_sales_by_day(days=30):
        """Get daily sales data."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        sales_data = db.session.query(
            func.date(Order.created_at).label('date'),
            func.sum(Order.total).label('revenue'),
            func.count(Order.id).label('orders')
        ).filter(
            Order.created_at >= start_date,
            Order.payment_status == 'paid'
        ).group_by(func.date(Order.created_at)).all()
        
        return [{
            'date': str(row.date),
            'revenue': float(row.revenue) if row.revenue else 0,
            'orders': row.orders
        } for row in sales_data]
    
    @staticmethod
    def get_top_products(limit=10, days=30):
        """Get top selling products."""
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
        
        return [{
            'product_id': row.product_id,
            'product_name': row.product_name,
            'total_quantity': row.total_quantity,
            'total_revenue': float(row.total_revenue) if row.total_revenue else 0
        } for row in top_products]
    
    @staticmethod
    def get_order_status_breakdown():
        """Get order count by status."""
        status_counts = db.session.query(
            Order.status,
            func.count(Order.id).label('count')
        ).group_by(Order.status).all()
        
        return {row.status: row.count for row in status_counts}
    
    @staticmethod
    def get_revenue_by_category(days=30):
        """Get revenue breakdown by category."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        from ..models import Category
        
        revenue_data = db.session.query(
            Category.name,
            func.sum(OrderItem.total).label('revenue')
        ).join(Product, Product.category_id == Category.id)\
         .join(OrderItem, OrderItem.product_id == Product.id)\
         .join(Order, Order.id == OrderItem.order_id)\
         .filter(
            Order.created_at >= start_date,
            Order.payment_status == 'paid'
        ).group_by(Category.name).all()
        
        return [{
            'category': row.name,
            'revenue': float(row.revenue) if row.revenue else 0
        } for row in revenue_data]


