"""
Custom exceptions and error handlers for the API.
Provides standardized error responses compatible with frontend expectations.
"""
from flask import jsonify, request
from typing import Optional, Dict, Any
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)


# ============================================================
# Error Codes - Centralized error code definitions
# ============================================================
class ErrorCodes:
    """Centralized error code definitions for consistency."""
    
    # Validation errors (400)
    VALIDATION_ERROR = 'VALIDATION_ERROR'
    INVALID_INPUT = 'INVALID_INPUT'
    MISSING_FIELD = 'MISSING_FIELD'
    INVALID_FORMAT = 'INVALID_FORMAT'
    SLUG_EXISTS = 'SLUG_EXISTS'
    
    # Authentication errors (401)
    UNAUTHORIZED = 'UNAUTHORIZED'
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
    TOKEN_EXPIRED = 'TOKEN_EXPIRED'
    TOKEN_INVALID = 'TOKEN_INVALID'
    
    # Authorization errors (403)
    FORBIDDEN = 'FORBIDDEN'
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
    ACCOUNT_DISABLED = 'ACCOUNT_DISABLED'
    
    # Not found errors (404)
    NOT_FOUND = 'NOT_FOUND'
    PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND'
    ORDER_NOT_FOUND = 'ORDER_NOT_FOUND'
    USER_NOT_FOUND = 'USER_NOT_FOUND'
    CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND'
    
    # Conflict errors (409)
    CONFLICT = 'CONFLICT'
    EMAIL_EXISTS = 'EMAIL_EXISTS'
    PHONE_EXISTS = 'PHONE_EXISTS'
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY'
    
    # Rate limit errors (429)
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
    
    # Server errors (500)
    INTERNAL_ERROR = 'INTERNAL_ERROR'
    DATABASE_ERROR = 'DATABASE_ERROR'
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
    
    # Business logic errors
    INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK'
    ORDER_CREATION_FAILED = 'ORDER_CREATION_FAILED'
    PAYMENT_FAILED = 'PAYMENT_FAILED'
    INVALID_PROMO_CODE = 'INVALID_PROMO_CODE'


class APIError(Exception):
    """Base exception for API errors with enhanced logging."""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 400, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        log_level: str = 'warning'
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        self.timestamp = datetime.utcnow().isoformat()
        
        # Log the error with context
        self._log_error(log_level)
        
        super().__init__(self.message)
    
    def _log_error(self, level: str):
        """Log the error with request context."""
        log_data = {
            'error_code': self.error_code,
            'message': self.message,
            'status_code': self.status_code,
            'timestamp': self.timestamp,
        }
        
        # Add request context if available
        try:
            log_data['path'] = request.path
            log_data['method'] = request.method
            log_data['ip'] = request.remote_addr
            log_data['user_agent'] = request.user_agent.string[:200] if request.user_agent else None
        except RuntimeError:
            # Outside request context
            pass
        
        if self.details:
            log_data['details'] = self.details
        
        log_func = getattr(logger, level, logger.warning)
        log_func(f"API Error: {self.error_code} - {self.message}", extra=log_data)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for JSON response."""
        result = {
            'error': self.message,
            'code': self.error_code,
            'timestamp': self.timestamp,
        }
        if self.details:
            result['details'] = self.details
        return result


class ValidationError(APIError):
    """Raised when validation fails."""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        _details = details or {}
        if field:
            _details['field'] = field
        super().__init__(
            message, 
            status_code=400, 
            error_code=error_code or ErrorCodes.VALIDATION_ERROR,
            details=_details,
            log_level='info'
        )


class NotFoundError(APIError):
    """Raised when a resource is not found."""
    
    def __init__(
        self, 
        message: str = 'Resource not found', 
        error_code: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[Any] = None
    ):
        details = {}
        if resource_type:
            details['resource_type'] = resource_type
        if resource_id is not None:
            details['resource_id'] = str(resource_id)
        super().__init__(
            message, 
            status_code=404, 
            error_code=error_code or ErrorCodes.NOT_FOUND,
            details=details if details else None,
            log_level='info'
        )


class UnauthorizedError(APIError):
    """Raised when authentication is required or fails."""
    
    def __init__(self, message: str = 'Unauthorized', error_code: Optional[str] = None):
        super().__init__(
            message, 
            status_code=401, 
            error_code=error_code or ErrorCodes.UNAUTHORIZED,
            log_level='warning'
        )


class ForbiddenError(APIError):
    """Raised when access is forbidden."""
    
    def __init__(self, message: str = 'Forbidden', error_code: Optional[str] = None):
        super().__init__(
            message, 
            status_code=403, 
            error_code=error_code or ErrorCodes.FORBIDDEN,
            log_level='warning'
        )


class ConflictError(APIError):
    """Raised when a resource conflict occurs."""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        conflicting_field: Optional[str] = None
    ):
        details = {}
        if conflicting_field:
            details['conflicting_field'] = conflicting_field
        super().__init__(
            message, 
            status_code=409, 
            error_code=error_code or ErrorCodes.CONFLICT,
            details=details if details else None,
            log_level='info'
        )


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""
    
    def __init__(
        self, 
        message: str = 'Too many requests', 
        error_code: Optional[str] = None,
        retry_after: Optional[int] = None
    ):
        details = {}
        if retry_after:
            details['retry_after'] = retry_after
        super().__init__(
            message, 
            status_code=429, 
            error_code=error_code or ErrorCodes.RATE_LIMIT_EXCEEDED,
            details=details if details else None,
            log_level='warning'
        )


class InternalError(APIError):
    """Raised for internal server errors."""
    
    def __init__(
        self, 
        message: str = 'An unexpected error occurred', 
        error_code: Optional[str] = None,
        original_error: Optional[Exception] = None
    ):
        details = {}
        if original_error:
            details['error_type'] = type(original_error).__name__
        super().__init__(
            message, 
            status_code=500, 
            error_code=error_code or ErrorCodes.INTERNAL_ERROR,
            details=details if details else None,
            log_level='error'
        )


def register_error_handlers(app):
    """Register global error handlers for the Flask app."""
    
    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        """Handle custom API errors with full error info."""
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors."""
        logger.info(f"404 Not Found: {request.path}", extra={
            'path': request.path,
            'method': request.method,
            'ip': request.remote_addr,
        })
        return jsonify({
            'error': 'Resource not found',
            'code': ErrorCodes.NOT_FOUND,
            'timestamp': datetime.utcnow().isoformat(),
        }), 404
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 errors."""
        logger.info(f"405 Method Not Allowed: {request.method} {request.path}", extra={
            'path': request.path,
            'method': request.method,
            'ip': request.remote_addr,
        })
        return jsonify({
            'error': 'Method not allowed',
            'code': 'METHOD_NOT_ALLOWED',
            'timestamp': datetime.utcnow().isoformat(),
        }), 405
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 errors with logging."""
        error_id = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')
        logger.exception(f'Internal server error (ID: {error_id})', extra={
            'error_id': error_id,
            'path': request.path if request else None,
            'method': request.method if request else None,
            'traceback': traceback.format_exc(),
        })
        return jsonify({
            'error': 'Internal server error',
            'code': ErrorCodes.INTERNAL_ERROR,
            'error_id': error_id,
            'timestamp': datetime.utcnow().isoformat(),
        }), 500
    
    @app.errorhandler(ValueError)
    def handle_value_error(error):
        """Handle ValueError exceptions."""
        logger.info(f"ValueError: {str(error)}", extra={
            'path': request.path if request else None,
            'error_message': str(error),
        })
        return jsonify({
            'error': str(error),
            'code': ErrorCodes.VALIDATION_ERROR,
            'timestamp': datetime.utcnow().isoformat(),
        }), 400
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle all other exceptions with detailed logging."""
        error_id = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')
        logger.exception(f'Unhandled exception (ID: {error_id}): {type(error).__name__}', extra={
            'error_id': error_id,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'path': request.path if request else None,
            'method': request.method if request else None,
            'traceback': traceback.format_exc(),
        })
        return jsonify({
            'error': 'An unexpected error occurred',
            'code': ErrorCodes.INTERNAL_ERROR,
            'error_id': error_id,
            'timestamp': datetime.utcnow().isoformat(),
        }), 500



