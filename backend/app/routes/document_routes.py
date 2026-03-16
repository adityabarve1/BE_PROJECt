"""
Document upload and processing routes
"""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from app.models.student import StudentModel, DocumentUploadModel
from app.models.teacher import TeacherModel
from app.utils.document_parser import (
    parse_admission_document,
    parse_attendance_document,
    parse_results_document,
    validate_excel_file,
    generate_student_id
)

bp = Blueprint('documents', __name__, url_prefix='/api/documents')

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', '..', 'uploads')
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'pdf'}

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_teacher_id_from_token(request):
    """Extract teacher ID from authorization token"""
    # This is a placeholder - implement proper JWT verification
    # For now, return a test teacher ID or extract from request
    auth_header = request.headers.get('Authorization')
    if auth_header:
        # In production, decode JWT and get teacher_id
        # For now, we'll accept teacher_id in the request
        return request.json.get('teacher_id') if request.json else None
    return None


@bp.route('/upload/admission', methods=['POST'])
def upload_admission_document():
    """
    Upload admission document to create student profiles
    
    Form data:
    - file: Excel file
    - class: Class name (e.g., '8th', '10th')
    - admission_year: Year of admission (e.g., 2026)
    - teacher_id: ID of the teacher uploading
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'success': False
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'success': False
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type. Only Excel files are supported.',
                'success': False
            }), 400
        
        # Get form data
        class_name = request.form.get('class')
        admission_year = request.form.get('admission_year')
        teacher_id = request.form.get('teacher_id')
        
        if not class_name or not admission_year:
            return jsonify({
                'error': 'Class and admission year are required',
                'success': False
            }), 400
        
        # Save file
        filename = secure_filename(f"admission_{class_name}_{admission_year}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Create upload record
        upload_data = {
            'teacher_id': teacher_id,
            'document_type': 'admission',
            'file_name': filename,
            'class': class_name,
            'admission_year': int(admission_year),
            'status': 'processing'
        }
        upload_record = DocumentUploadModel.create_upload(upload_data)
        
        # Parse document
        students_data, errors = parse_admission_document(filepath, class_name, int(admission_year))
        
        if errors:
            DocumentUploadModel.update_upload_status(
                upload_record['id'],
                'completed' if students_data else 'failed',
                len(students_data),
                '; '.join(errors)
            )
        
        if not students_data:
            return jsonify({
                'error': 'No valid student records found',
                'details': errors,
                'success': False
            }), 400
        
        # Add teacher_id to each student record
        for student in students_data:
            student['created_by'] = teacher_id
        
        # Bulk create students
        created_students = StudentModel.bulk_create_students(students_data)
        
        # Update upload record
        DocumentUploadModel.update_upload_status(
            upload_record['id'],
            'completed',
            len(created_students)
        )
        
        return jsonify({
            'success': True,
            'message': f'Successfully created {len(created_students)} student profiles',
            'data': {
                'students_created': len(created_students),
                'errors': errors,
                'upload_id': upload_record['id']
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/upload/attendance', methods=['POST'])
def upload_attendance_document():
    """
    Upload attendance document to update student attendance
    
    Form data:
    - file: Excel file
    - class: Class name
    - admission_year: Year of admission
    - teacher_id: ID of the teacher uploading
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'success': False
            }), 400
        
        file = request.files['file']
        
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file',
                'success': False
            }), 400
        
        # Get form data
        class_name = request.form.get('class')
        admission_year = request.form.get('admission_year')
        teacher_id = request.form.get('teacher_id')
        
        if not class_name or not admission_year:
            return jsonify({
                'error': 'Class and admission year are required',
                'success': False
            }), 400
        
        # Save file
        filename = secure_filename(f"attendance_{class_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Create upload record
        upload_data = {
            'teacher_id': teacher_id,
            'document_type': 'attendance',
            'file_name': filename,
            'class': class_name,
            'admission_year': int(admission_year),
            'status': 'processing'
        }
        upload_record = DocumentUploadModel.create_upload(upload_data)
        
        # Parse document
        attendance_data, errors = parse_attendance_document(filepath)
        
        if not attendance_data:
            DocumentUploadModel.update_upload_status(
                upload_record['id'],
                'failed',
                0,
                '; '.join(errors) if errors else 'No data found'
            )
            return jsonify({
                'error': 'No valid attendance records found',
                'details': errors,
                'success': False
            }), 400
        
        # Update students
        updates = []
        update_errors = []
        
        for record in attendance_data:
            # Generate student_id from roll_no, class, and year
            student_id = generate_student_id(int(admission_year), class_name, record['roll_no'])
            
            # Check if student exists
            student = StudentModel.get_student_by_student_id(student_id)
            
            if student:
                updates.append({
                    'student_id': student_id,
                    'attendance': record['attendance']
                })
            else:
                update_errors.append(f"Student not found: Roll {record['roll_no']}")
        
        # Bulk update
        results = StudentModel.bulk_update_attendance(updates)
        
        successful_updates = sum(1 for r in results if r['success'])
        
        # Update upload record
        DocumentUploadModel.update_upload_status(
            upload_record['id'],
            'completed',
            successful_updates,
            '; '.join(update_errors) if update_errors else None
        )
        
        return jsonify({
            'success': True,
            'message': f'Successfully updated attendance for {successful_updates} students',
            'data': {
                'students_updated': successful_updates,
                'errors': update_errors + errors,
                'upload_id': upload_record['id']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/upload/results', methods=['POST'])
def upload_results_document():
    """
    Upload results document to update student marks
    
    Form data:
    - file: Excel file
    - class: Class name
    - admission_year: Year of admission
    - teacher_id: ID of the teacher uploading
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'success': False
            }), 400
        
        file = request.files['file']
        
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file',
                'success': False
            }), 400
        
        # Get form data
        class_name = request.form.get('class')
        admission_year = request.form.get('admission_year')
        teacher_id = request.form.get('teacher_id')
        
        if not class_name or not admission_year:
            return jsonify({
                'error': 'Class and admission year are required',
                'success': False
            }), 400
        
        # Save file
        filename = secure_filename(f"results_{class_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Create upload record
        upload_data = {
            'teacher_id': teacher_id,
            'document_type': 'results',
            'file_name': filename,
            'class': class_name,
            'admission_year': int(admission_year),
            'status': 'processing'
        }
        upload_record = DocumentUploadModel.create_upload(upload_data)
        
        # Parse document
        results_data, errors = parse_results_document(filepath)
        
        if not results_data:
            DocumentUploadModel.update_upload_status(
                upload_record['id'],
                'failed',
                0,
                '; '.join(errors) if errors else 'No data found'
            )
            return jsonify({
                'error': 'No valid results records found',
                'details': errors,
                'success': False
            }), 400
        
        # Update students
        updates = []
        update_errors = []
        
        for record in results_data:
            # Generate student_id
            student_id = generate_student_id(int(admission_year), class_name, record['roll_no'])
            
            # Check if student exists
            student = StudentModel.get_student_by_student_id(student_id)
            
            if student:
                updates.append({
                    'student_id': student_id,
                    'marks': record['marks']
                })
            else:
                update_errors.append(f"Student not found: Roll {record['roll_no']}")
        
        # Bulk update
        results = StudentModel.bulk_update_marks(updates)
        
        successful_updates = sum(1 for r in results if r['success'])
        
        # Update upload record
        DocumentUploadModel.update_upload_status(
            upload_record['id'],
            'completed',
            successful_updates,
            '; '.join(update_errors) if update_errors else None
        )
        
        return jsonify({
            'success': True,
            'message': f'Successfully updated marks for {successful_updates} students',
            'data': {
                'students_updated': successful_updates,
                'errors': update_errors + errors,
                'upload_id': upload_record['id']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/uploads/history', methods=['GET'])
def get_upload_history():
    """Get upload history for a teacher"""
    try:
        teacher_id = request.args.get('teacher_id')
        
        if not teacher_id:
            return jsonify({
                'error': 'Teacher ID is required',
                'success': False
            }), 400
        
        uploads = DocumentUploadModel.get_uploads_by_teacher(teacher_id)
        
        return jsonify({
            'success': True,
            'data': uploads,
            'count': len(uploads)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
