"""
Vavip Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, migrate, jwt, socketio


def create_app(config_class=Config):
    """Application factory pattern."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config.get('CORS_ORIGINS', '*').split(','))
    socketio.init_app(app, cors_allowed_origins="*")

    # Register blueprints
    from .api import auth_bp, products_bp, orders_bp, contacts_bp, feedback_bp, dashboard_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(contacts_bp, url_prefix='/api/contacts')
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    # Register WebSocket handlers
    from .api import websocket
    websocket.register_handlers(socketio)

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': 'Vavip API is running'}

    return app


