"""
Authentication routes for teachers
"""

from flask import Blueprint, request, jsonify
from supabase import create_client
import os
from app.models.teacher import TeacherModel

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize Supabase client for auth
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)


@bp.route('/register', methods=['POST'])
def register():
    """
    Register a new teacher
    
    Expected JSON body:
    {
        "email": "teacher@example.com",
        "password": "secure_password",
        "full_name": "Teacher Name",
        "phone": "1234567890"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'success': False
            }), 400
        
        # Register user with Supabase Auth
        # Note: email_confirm is set to False for development to skip email verification
        auth_response = supabase.auth.sign_up({
            "email": data['email'],
            "password": data['password'],
            "options": {
                "email_redirect_to": None,
                "data": {
                    "full_name": data['full_name']
                }
            }
        })
        
        if not auth_response.user:
            return jsonify({
                'error': 'Failed to create authentication account',
                'success': False
            }), 400
        
        # Create teacher record in database
        teacher_data = {
            'email': data['email'],
            'full_name': data['full_name'],
            'phone': data.get('phone'),
            'auth_uid': auth_response.user.id
        }
        
        teacher = TeacherModel.create_teacher(teacher_data)
        
        if not teacher:
            return jsonify({
                'error': 'Failed to create teacher profile',
                'success': False
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Teacher registered successfully',
            'data': {
                'teacher_id': teacher['id'],
                'email': teacher['email'],
                'full_name': teacher['full_name']
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/login', methods=['POST'])
def login():
    """
    Login for teachers
    
    Expected JSON body:
    {
        "email": "teacher@example.com",
        "password": "secure_password"
    }
    """
    try:
        data = request.get_json()
        
        if 'email' not in data or 'password' not in data:
            return jsonify({
                'error': 'Email and password are required',
                'success': False
            }), 400
        
        try:
            # Authenticate with Supabase
            auth_response = supabase.auth.sign_in_with_password({
                "email": data['email'],
                "password": data['password']
            })
            
            if not auth_response.user:
                return jsonify({
                    'error': 'Invalid credentials',
                    'success': False
                }), 401
                
        except Exception as auth_error:
            error_msg = str(auth_error)
            
            # Handle specific Supabase auth errors
            if 'Email not confirmed' in error_msg or 'email_not_confirmed' in error_msg.lower():
                return jsonify({
                    'error': 'Please check your email and confirm your account before logging in. If you cannot find the email, please contact support.',
                    'success': False,
                    'code': 'EMAIL_NOT_CONFIRMED'
                }), 401
            elif 'Invalid login credentials' in error_msg:
                return jsonify({
                    'error': 'Invalid email or password',
                    'success': False
                }), 401
            else:
                return jsonify({
                    'error': f'Authentication failed: {error_msg}',
                    'success': False
                }), 401
        
        # Get teacher profile
        teacher = TeacherModel.get_teacher_by_auth_uid(auth_response.user.id)
        
        if not teacher:
            # Create teacher profile if doesn't exist
            teacher_data = {
                'email': auth_response.user.email,
                'full_name': auth_response.user.email.split('@')[0],
                'auth_uid': auth_response.user.id
            }
            teacher = TeacherModel.create_teacher(teacher_data)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'access_token': auth_response.session.access_token,
                'refresh_token': auth_response.session.refresh_token,
                'teacher': {
                    'id': teacher['id'],
                    'email': teacher['email'],
                    'full_name': teacher['full_name']
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/logout', methods=['POST'])
def logout():
    """Logout teacher"""
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'error': 'Authorization header missing',
                'success': False
            }), 401
        
        # Supabase logout
        supabase.auth.sign_out()
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current authenticated teacher"""
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'error': 'Authorization header missing',
                'success': False
            }), 401
        
        token = auth_header.replace('Bearer ', '')
        
        # Get user from token
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({
                'error': 'Invalid or expired token',
                'success': False
            }), 401
        
        # Get teacher profile
        teacher = TeacherModel.get_teacher_by_auth_uid(user_response.user.id)
        
        if not teacher:
            return jsonify({
                'error': 'Teacher profile not found',
                'success': False
            }), 404
        
        return jsonify({
            'success': True,
            'data': teacher
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token"""
    try:
        data = request.get_json()
        
        if 'refresh_token' not in data:
            return jsonify({
                'error': 'Refresh token is required',
                'success': False
            }), 400
        
        # Refresh session
        session_response = supabase.auth.refresh_session(data['refresh_token'])
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': session_response.session.access_token,
                'refresh_token': session_response.session.refresh_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
