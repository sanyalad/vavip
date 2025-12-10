"""
API Blueprints
"""
from .auth import bp as auth_bp
from .products import bp as products_bp
from .orders import bp as orders_bp
from .contacts import bp as contacts_bp
from .feedback import bp as feedback_bp
from .dashboard import bp as dashboard_bp
from . import websocket

__all__ = ['auth_bp', 'products_bp', 'orders_bp', 'contacts_bp', 'feedback_bp', 'dashboard_bp', 'websocket']


