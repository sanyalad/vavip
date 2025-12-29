"""
Vavip Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, migrate, jwt, socketio, limiter, init_redis


def create_app(config_class=None):
    """Application factory pattern."""
    import os
    from .config import config
    
    # Auto-detect config from FLASK_ENV
    if config_class is None:
        env = os.environ.get('FLASK_ENV', 'development')
        config_class = config.get(env, config['default'])
    
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    # SQLAlchemy will use SQLALCHEMY_ENGINE_OPTIONS from config automatically
    db.init_app(app)
    
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Setup JWT blacklist
    from .extensions import setup_jwt_blacklist
    setup_jwt_blacklist(app)
    CORS(app, origins=app.config.get('CORS_ORIGINS', '*').split(','))
    # Align Socket.IO CORS with regular CORS configuration (safer for production)
    socketio.init_app(app, cors_allowed_origins=app.config.get('CORS_ORIGINS', '*').split(','))
    
    # Initialize Redis
    init_redis(app)
    
    # Initialize rate limiter
    if app.config.get('RATELIMIT_ENABLED', True):
        limiter.storage_uri = app.config.get('RATELIMIT_STORAGE_URL', app.config.get('REDIS_URL'))
        limiter.init_app(app)

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

    # Register error handlers
    from .utils.errors import register_error_handlers
    register_error_handlers(app)
    
    # Setup logging
    from .utils.logger import setup_logging, log_request
    setup_logging(app)
    log_request(app)

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint with database and Redis connectivity checks."""
        from .utils.response_utils import success_response
        health_status = {
            'status': 'ok',
            'message': 'Vavip API is running',
            'checks': {}
        }
        
        # Check database connection
        try:
            db.session.execute(db.text('SELECT 1'))
            health_status['checks']['database'] = 'ok'
        except Exception as e:
            health_status['checks']['database'] = f'error: {str(e)}'
            health_status['status'] = 'degraded'
        
        # Check Redis connection
        try:
            from .extensions import redis_client
            if redis_client:
                redis_client.ping()
                health_status['checks']['redis'] = 'ok'
            else:
                health_status['checks']['redis'] = 'not configured'
        except Exception as e:
            health_status['checks']['redis'] = f'error: {str(e)}'
            if health_status['status'] == 'ok':
                health_status['status'] = 'degraded'
        
# Для Docker healthcheck всегда отдаём 200, 
        # статус зависимостей смотрим в JSON
        status_code = 200
        return success_response(health_status, status_code=status_code)
    # OpenAPI/Swagger documentation
    from .extensions import spec
    from flask import jsonify
    
    @app.route('/api/docs')
    def swagger_ui():
        """Swagger UI for API documentation."""
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Vavip API Documentation</title>
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
            <script>
                window.onload = function() {
                    SwaggerUIBundle({
                        url: "/api/spec",
                        dom_id: '#swagger-ui',
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIBundle.presets.standalone
                        ]
                    });
                };
            </script>
        </body>
        </html>
        '''
    
    @app.route('/api/spec')
    def get_spec():
        """OpenAPI specification."""
        # Basic spec - can be extended with actual endpoint documentation
        return jsonify(spec.to_dict())

    return app






