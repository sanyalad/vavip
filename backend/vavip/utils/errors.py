"""
Custom exceptions and error handlers for the API.
Provides standardized error responses compatible with frontend expectations.
"""
from flask import jsonify
from typing import Optional, Dict, Any


class APIError(Exception):
    """Base exception for API errors."""
    
    def __init__(self, message: str, status_code: int = 400, error_code: Optional[str] = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class ValidationError(APIError):
    """Raised when validation fails."""
    
    def __init__(self, message: str, error_code: Optional[str] = None):
        super().__init__(message, status_code=400, error_code=error_code or 'VALIDATION_ERROR')


class NotFoundError(APIError):
    """Raised when a resource is not found."""
    
    def __init__(self, message: str = 'Resource not found', error_code: Optional[str] = None):
        super().__init__(message, status_code=404, error_code=error_code or 'NOT_FOUND')


class UnauthorizedError(APIError):
    """Raised when authentication is required or fails."""
    
    def __init__(self, message: str = 'Unauthorized', error_code: Optional[str] = None):
        super().__init__(message, status_code=401, error_code=error_code or 'UNAUTHORIZED')


class ForbiddenError(APIError):
    """Raised when access is forbidden."""
    
    def __init__(self, message: str = 'Forbidden', error_code: Optional[str] = None):
        super().__init__(message, status_code=403, error_code=error_code or 'FORBIDDEN')


class ConflictError(APIError):
    """Raised when a resource conflict occurs."""
    
    def __init__(self, message: str, error_code: Optional[str] = None):
        super().__init__(message, status_code=409, error_code=error_code or 'CONFLICT')


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = 'Too many requests', error_code: Optional[str] = None):
        super().__init__(message, status_code=429, error_code=error_code or 'RATE_LIMIT_EXCEEDED')


def register_error_handlers(app):
    """Register global error handlers for the Flask app."""
    
    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        """Handle custom API errors."""
        response = {
            'error': error.message
        }
        if error.error_code:
            response['code'] = error.error_code
        return jsonify(response), error.status_code
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors."""
        return jsonify({
            'error': 'Resource not found',
            'code': 'NOT_FOUND'
        }), 404
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 errors."""
        return jsonify({
            'error': 'Method not allowed',
            'code': 'METHOD_NOT_ALLOWED'
        }), 405
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 errors."""
        import logging
        logger = logging.getLogger(__name__)
        logger.exception('Internal server error')
        return jsonify({
            'error': 'Internal server error',
            'code': 'INTERNAL_ERROR'
        }), 500
    
    @app.errorhandler(ValueError)
    def handle_value_error(error):
        """Handle ValueError exceptions."""
        return jsonify({
            'error': str(error),
            'code': 'VALIDATION_ERROR'
        }), 400
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle all other exceptions."""
        import logging
        logger = logging.getLogger(__name__)
        logger.exception('Unhandled exception')
        return jsonify({
            'error': 'An unexpected error occurred',
            'code': 'INTERNAL_ERROR'
        }), 500

