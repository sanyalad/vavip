"""
Utility functions for standardizing API responses.
Ensures compatibility with frontend expectations.
"""
from flask import jsonify
from typing import Any, Optional, Dict, List
from sqlalchemy.pagination import Pagination


def success_response(data: Any = None, status_code: int = 200, message: Optional[str] = None) -> tuple:
    """
    Create a standardized success response.
    
    Args:
        data: Response data (dict, list, or model)
        status_code: HTTP status code
        message: Optional success message
    
    Returns:
        Tuple of (jsonify response, status_code)
    """
    response = {}
    if message:
        response['message'] = message
    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response['data'] = data
    return jsonify(response), status_code


def error_response(message: str, error_code: Optional[str] = None, status_code: int = 400) -> tuple:
    """
    Create a standardized error response compatible with frontend.
    
    Args:
        message: Error message
        error_code: Optional error code (e.g., 'PHONE_REQUIRED', 'OTP_EXPIRED')
        status_code: HTTP status code
    
    Returns:
        Tuple of (jsonify response, status_code)
    """
    response = {'error': message}
    if error_code:
        response['code'] = error_code
    return jsonify(response), status_code


def paginated_response(items: List[Any], pagination: Pagination, 
                      data_key: str = 'items') -> tuple:
    """
    Create a standardized paginated response.
    
    Args:
        items: List of items to return
        pagination: SQLAlchemy Pagination object
        data_key: Key name for items in response
    
    Returns:
        Tuple of (jsonify response, status_code)
    """
    return jsonify({
        data_key: items,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page,
        'per_page': pagination.per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }), 200

