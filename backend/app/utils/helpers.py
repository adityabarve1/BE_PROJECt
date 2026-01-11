"""
Utility functions for backend
"""

from functools import wraps
from flask import request, jsonify


def validate_json(*expected_args):
    """Decorator to validate JSON request data"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Content-Type must be application/json'
                }), 400
            
            json_data = request.get_json()
            
            missing_args = [arg for arg in expected_args if arg not in json_data]
            if missing_args:
                return jsonify({
                    'error': f'Missing required fields: {", ".join(missing_args)}'
                }), 400
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def format_response(success=True, data=None, message=None, status_code=200):
    """Format API response"""
    response = {
        'success': success
    }
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    return jsonify(response), status_code
