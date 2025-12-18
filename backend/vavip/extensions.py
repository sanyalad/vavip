"""
Flask Extensions
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin
import redis

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=None  # Will be set in init_app
)

# APISpec for OpenAPI documentation
spec = APISpec(
    title="Vavip API",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[FlaskPlugin(), MarshmallowPlugin()],
    info={
        "description": "Vavip e-commerce API documentation",
        "contact": {
            "name": "Vavip Support"
        }
    },
    servers=[
        {
            "url": "http://localhost:5000",
            "description": "Development server"
        }
    ]
)

# Redis client for caching and token blacklisting
redis_client = None


def init_redis(app):
    """Initialize Redis client."""
    global redis_client
    try:
        redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        # Test connection
        redis_client.ping()
        app.logger.info('Redis connection established')
    except Exception as e:
        app.logger.warning(f'Redis connection failed: {e}. Some features may be unavailable.')
        redis_client = None


def setup_jwt_blacklist(app):
    """Setup JWT token blacklisting using Redis."""
    from flask_jwt_extended import get_jwt
    
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """Check if token is in blacklist."""
        if redis_client is None:
            return False  # If Redis is not available, don't block tokens
        
        jti = jwt_payload.get('jti')
        if not jti:
            return False
        
        # Check if token is blacklisted
        blacklisted = redis_client.get(f'blacklist:{jti}')
        return blacklisted is not None
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Callback for revoked tokens."""
        from ..utils.response_utils import error_response
        return error_response('Token has been revoked', 'TOKEN_REVOKED', status_code=401)









