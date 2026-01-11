"""
Student management routes
"""

from flask import Blueprint, request, jsonify
from app.models.student import StudentModel

bp = Blueprint('students', __name__, url_prefix='/api/students')


@bp.route('/', methods=['GET'])
def get_all_students():
    """Get all students with pagination"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        students = StudentModel.get_all_students(limit=limit, offset=offset)
        
        return jsonify({
            'success': True,
            'data': students,
            'count': len(students)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/<student_id>', methods=['GET'])
def get_student(student_id):
    """Get student by student ID"""
    try:
        student = StudentModel.get_student_by_student_id(student_id)
        
        if not student:
            return jsonify({
                'error': 'Student not found',
                'success': False
            }), 404
        
        return jsonify({
            'success': True,
            'data': student
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/', methods=['POST'])
def create_student():
    """Create a new student"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['student_name', 'roll_no', 'admission_year', 'gender', 'class']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Generate student_id
        from app.utils.document_parser import generate_student_id
        student_id = generate_student_id(data['admission_year'], data['class'], data['roll_no'])
        data['student_id'] = student_id
        
        # Check if student already exists
        existing_student = StudentModel.get_student_by_student_id(student_id)
        if existing_student:
            return jsonify({
                'error': 'Student with this ID already exists',
                'success': False
            }), 409
        
        student = StudentModel.create_student(data)
        
        return jsonify({
            'success': True,
            'data': student,
            'message': 'Student created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 400


@bp.route('/<student_id>', methods=['PUT'])
def update_student(student_id):
    """Update student information"""
    try:
        data = request.get_json()
        
        # Check if student exists
        existing_student = StudentModel.get_student_by_student_id(student_id)
        if not existing_student:
            return jsonify({
                'error': 'Student not found',
                'success': False
            }), 404
        
        updated_student = StudentModel.update_student(student_id, data)
        
        return jsonify({
            'success': True,
            'data': updated_student,
            'message': 'Student updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Delete a student"""
    try:
        # Check if student exists
        existing_student = StudentModel.get_student_by_student_id(student_id)
        if not existing_student:
            return jsonify({
                'error': 'Student not found',
                'success': False
            }), 404
        
        StudentModel.delete_student(student_id)
        
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/class/<class_name>', methods=['GET'])
def get_students_by_class(class_name):
    """Get all students in a specific class"""
    try:
        admission_year = request.args.get('admission_year')
        
        if admission_year:
            students = StudentModel.get_students_by_class_and_year(class_name, int(admission_year))
        else:
            students = StudentModel.get_students_by_class(class_name)
        
        return jsonify({
            'success': True,
            'data': students,
            'count': len(students)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/high-risk', methods=['GET'])
def get_high_risk_students():
    """Get all high-risk students"""
    try:
        students = StudentModel.get_high_risk_students()
        
        return jsonify({
            'success': True,
            'data': students,
            'count': len(students)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
