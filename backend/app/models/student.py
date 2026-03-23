"""
Database models for student data
"""

from datetime import datetime
from supabase import create_client
import os
import re


class SupabaseClient:
    """Singleton Supabase client"""
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            url = os.environ.get('SUPABASE_URL')
            key = os.environ.get('SUPABASE_KEY')
            cls._instance = create_client(url, key)
        return cls._instance


class StudentModel:
    """Model for student data"""
    
    TABLE_NAME = 'students'

    @staticmethod
    def _extract_missing_column(error):
        """Extract missing column name from PostgREST schema cache errors."""
        message = str(error)
        match = re.search(r"Could not find the '([^']+)' column", message)
        return match.group(1) if match else None

    @staticmethod
    def _insert_with_schema_fallback(client, payload):
        """
        Insert payload into students table and retry if PostgREST reports
        missing columns in schema cache.
        """
        if isinstance(payload, dict):
            working_payload = payload.copy()
        else:
            working_payload = [row.copy() for row in payload]

        # Guard to avoid infinite retry loops on repeated failures.
        for _ in range(5):
            try:
                response = client.table(StudentModel.TABLE_NAME).insert(working_payload).execute()
                return response
            except Exception as e:
                missing_col = StudentModel._extract_missing_column(e)
                if not missing_col:
                    raise

                if isinstance(working_payload, dict):
                    if missing_col not in working_payload:
                        raise
                    working_payload.pop(missing_col, None)
                else:
                    removed = False
                    for row in working_payload:
                        if missing_col in row:
                            row.pop(missing_col, None)
                            removed = True
                    if not removed:
                        raise

        raise RuntimeError("Student insert failed after schema-fallback retries")
    
    @staticmethod
    def create_student(student_data):
        """Create a new student record"""
        client = SupabaseClient.get_instance()
        
        data = {
            'student_id': student_data['student_id'],
            'student_name': student_data['student_name'],
            'roll_no': student_data['roll_no'],
            'admission_year': student_data['admission_year'],
            'gender': student_data['gender'],
            'class': student_data['class'],
            'password_hash': student_data.get('password_hash', 'PASS@2026'),
            'date_of_birth': student_data.get('date_of_birth'),
            'attendance': student_data.get('attendance', 0),
            'marks': student_data.get('marks', 0),
            'income': student_data.get('income'),
            'parent_occupation': student_data.get('parent_occupation'),
            'location': student_data.get('location'),
            'student_phone': student_data.get('student_phone'),
            'parent_phone': student_data.get('parent_phone'),
            'parent_email': student_data.get('parent_email'),
            'dropout_risk': student_data.get('dropout_risk'),
            'risk_score': student_data.get('risk_score'),
            'created_by': student_data.get('created_by'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        response = StudentModel._insert_with_schema_fallback(client, data)
        return response.data[0] if response.data else None
    
    @staticmethod
    def bulk_create_students(students_data):
        """Bulk create student records"""
        client = SupabaseClient.get_instance()
        
        # Prepare data
        data_list = []
        for student_data in students_data:
            data = {
                'student_id': student_data['student_id'],
                'student_name': student_data['student_name'],
                'roll_no': student_data['roll_no'],
                'admission_year': student_data['admission_year'],
                'gender': student_data['gender'],
                'class': student_data['class'],
                'password_hash': student_data.get('password_hash', 'PASS@2026'),
                'date_of_birth': student_data.get('date_of_birth'),
                'attendance': student_data.get('attendance', 0),
                'marks': student_data.get('marks', 0),
                'income': student_data.get('income'),
                'parent_occupation': student_data.get('parent_occupation'),
                'location': student_data.get('location'),
                'student_phone': student_data.get('student_phone'),
                'parent_phone': student_data.get('parent_phone'),
                'parent_email': student_data.get('parent_email'),
                'created_by': student_data.get('created_by'),
                'created_at': datetime.utcnow().isoformat()
            }
            data_list.append(data)
        
        response = StudentModel._insert_with_schema_fallback(client, data_list)
        return response.data
    
    @staticmethod
    def get_student_by_student_id(student_id):
        """Get student by student ID"""
        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).select("*").eq('student_id', student_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_student_by_roll_and_class(roll_no, class_name, admission_year):
        """Get student by roll number, class, and admission year"""
        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).select("*").eq('roll_no', roll_no).eq('class', class_name).eq('admission_year', admission_year).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_students_by_ids(student_ids):
        """Get all students matching a list of student IDs"""
        if not student_ids:
            return []

        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).select("*").in_('student_id', student_ids).execute()
        return response.data or []
    
    @staticmethod
    def get_all_students(limit=100, offset=0):
        """Get all students with pagination"""
        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).select("*").range(offset, offset + limit - 1).execute()
        return response.data
    
    @staticmethod
    def update_student(student_id, update_data):
        """Update student record"""
        client = SupabaseClient.get_instance()
        update_data['updated_at'] = datetime.utcnow().isoformat()
        response = client.table(StudentModel.TABLE_NAME).update(update_data).eq('student_id', student_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update_student_attendance(student_id, attendance):
        """Update student attendance"""
        return StudentModel.update_student(student_id, {'attendance': attendance})
    
    @staticmethod
    def update_student_marks(student_id, marks):
        """Update student marks"""
        return StudentModel.update_student(student_id, {'marks': marks})
    
    @staticmethod
    def bulk_update_attendance(attendance_updates):
        """
        Bulk update attendance for multiple students
        attendance_updates: list of {'student_id': id, 'attendance': value}
        """
        client = SupabaseClient.get_instance()
        results = []
        
        for update in attendance_updates:
            try:
                result = StudentModel.update_student_attendance(
                    update['student_id'],
                    update['attendance']
                )
                results.append({'student_id': update['student_id'], 'success': True})
            except Exception as e:
                results.append({'student_id': update['student_id'], 'success': False, 'error': str(e)})
        
        return results
    
    @staticmethod
    def bulk_update_marks(marks_updates):
        """
        Bulk update marks for multiple students
        marks_updates: list of {'student_id': id, 'marks': value}
        """
        results = []
        
        for update in marks_updates:
            try:
                result = StudentModel.update_student_marks(
                    update['student_id'],
                    update['marks']
                )
                results.append({'student_id': update['student_id'], 'success': True})
            except Exception as e:
                results.append({'student_id': update['student_id'], 'success': False, 'error': str(e)})
        
        return results
    
    @staticmethod
    def delete_student(student_id):
        """Delete student record"""
        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).delete().eq('student_id', student_id).execute()
        return response.data
    
    @staticmethod
    def get_high_risk_students():
        """Get all high-risk students"""
        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).select("*").eq('dropout_risk', 'High').execute()
        return response.data
    
    @staticmethod
    def get_students_by_class(class_name):
        """Get students by class"""
        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).select("*").eq('class', class_name).order('roll_no').execute()
        return response.data
    
    @staticmethod
    def get_students_by_class_and_year(class_name, admission_year):
        """Get students by class and admission year"""
        client = SupabaseClient.get_instance()
        response = client.table(StudentModel.TABLE_NAME).select("*").eq('class', class_name).eq('admission_year', admission_year).order('roll_no').execute()
        return response.data


class DocumentUploadModel:
    """Model for document uploads"""
    
    TABLE_NAME = 'document_uploads'
    
    @staticmethod
    def create_upload(upload_data):
        """Create a new upload record"""
        client = SupabaseClient.get_instance()
        
        data = {
            'teacher_id': upload_data['teacher_id'],
            'file_name': upload_data['file_name'],
            'document_type': upload_data.get('document_type', upload_data.get('file_type', 'admission')),
            'class': upload_data.get('class'),
            'admission_year': upload_data.get('admission_year'),
            'status': upload_data.get('status', 'pending'),
            'records_processed': upload_data.get('records_processed', 0),
            'created_at': datetime.utcnow().isoformat()
        }
        
        response = client.table(DocumentUploadModel.TABLE_NAME).insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update_upload_status(upload_id, status, records_processed=None, error_message=None):
        """Update upload record status"""
        client = SupabaseClient.get_instance()
        
        update_data = {'status': status}
        if records_processed is not None:
            update_data['records_processed'] = records_processed
        if error_message:
            update_data['error_message'] = error_message
        
        response = client.table(DocumentUploadModel.TABLE_NAME).update(update_data).eq('id', upload_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_uploads_by_teacher(teacher_id, limit=50):
        """Get upload history for a teacher"""
        client = SupabaseClient.get_instance()
        response = client.table(DocumentUploadModel.TABLE_NAME).select("*").eq('teacher_id', teacher_id).order('created_at', desc=True).limit(limit).execute()
        return response.data


class PredictionHistoryModel:
    """Model for prediction history"""
    
    TABLE_NAME = 'prediction_history'
    
    @staticmethod
    def create_prediction_record(prediction_data):
        """Create a prediction history record"""
        client = SupabaseClient.get_instance()
        
        data = {
            'student_id': prediction_data['student_id'],
            'dropout_risk': prediction_data['dropout_risk'],
            'risk_score': prediction_data['risk_score'],
            'confidence': prediction_data['confidence'],
            'created_at': datetime.utcnow().isoformat()
        }
        
        response = client.table(PredictionHistoryModel.TABLE_NAME).insert(data).execute()
        return response.data
    
    @staticmethod
    def get_student_prediction_history(student_id):
        """Get prediction history for a student"""
        client = SupabaseClient.get_instance()
        response = client.table(PredictionHistoryModel.TABLE_NAME).select("*").eq('student_id', student_id).order('created_at', desc=True).execute()
        return response.data


class InterventionModel:
    """Model for intervention plans"""

    TABLE_NAME = 'interventions'

    @staticmethod
    def get_student_interventions(student_id, limit=20):
        """Get interventions for a student"""
        client = SupabaseClient.get_instance()
        response = (
            client.table(InterventionModel.TABLE_NAME)
            .select("*")
            .eq('student_id', student_id)
            .order('created_at', desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []


class MeetingScheduleModel:
    """Model for parent-student meeting schedules"""

    TABLE_NAME = 'meeting_schedules'

    @staticmethod
    def get_student_meetings(student_id, limit=20):
        """Get meetings for a student"""
        client = SupabaseClient.get_instance()
        response = (
            client.table(MeetingScheduleModel.TABLE_NAME)
            .select("*")
            .eq('student_id', student_id)
            .order('meeting_date', desc=False)
            .limit(limit)
            .execute()
        )
        return response.data or []

    @staticmethod
    def create_meeting(meeting_data):
        """Create a single meeting/notice record"""
        client = SupabaseClient.get_instance()

        data = {
            'student_id': meeting_data['student_id'],
            'teacher_id': meeting_data.get('teacher_id'),
            'meeting_date': meeting_data['meeting_date'],
            'meeting_type': meeting_data.get('meeting_type', 'Follow-up'),
            'description': meeting_data.get('description'),
            'status': meeting_data.get('status', 'Scheduled'),
            'outcome': meeting_data.get('outcome'),
            'created_at': datetime.utcnow().isoformat(),
        }

        response = client.table(MeetingScheduleModel.TABLE_NAME).insert(data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def bulk_create_meetings(meetings_data):
        """Bulk create meeting/notice records"""
        if not meetings_data:
            return []

        client = SupabaseClient.get_instance()
        now = datetime.utcnow().isoformat()
        payload = []

        for meeting_data in meetings_data:
            payload.append({
                'student_id': meeting_data['student_id'],
                'teacher_id': meeting_data.get('teacher_id'),
                'meeting_date': meeting_data['meeting_date'],
                'meeting_type': meeting_data.get('meeting_type', 'Follow-up'),
                'description': meeting_data.get('description'),
                'status': meeting_data.get('status', 'Scheduled'),
                'outcome': meeting_data.get('outcome'),
                'created_at': now,
            })

        response = client.table(MeetingScheduleModel.TABLE_NAME).insert(payload).execute()
        return response.data or []

    @staticmethod
    def get_teacher_meetings(teacher_id, limit=100):
        """Get meetings/notices published by a teacher"""
        client = SupabaseClient.get_instance()
        response = (
            client.table(MeetingScheduleModel.TABLE_NAME)
            .select("*")
            .eq('teacher_id', teacher_id)
            .order('created_at', desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    @staticmethod
    def get_meeting_by_id(meeting_id):
        """Get meeting by primary key id"""
        client = SupabaseClient.get_instance()
        response = (
            client.table(MeetingScheduleModel.TABLE_NAME)
            .select("*")
            .eq('id', meeting_id)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None

    @staticmethod
    def update_meeting(meeting_id, update_data):
        """Update meeting by id"""
        client = SupabaseClient.get_instance()
        update_data['updated_at'] = datetime.utcnow().isoformat()
        response = (
            client.table(MeetingScheduleModel.TABLE_NAME)
            .update(update_data)
            .eq('id', meeting_id)
            .execute()
        )
        return response.data[0] if response.data else None

    @staticmethod
    def delete_meetings_by_ids(meeting_ids):
        """Delete multiple meeting records by ids"""
        if not meeting_ids:
            return []

        client = SupabaseClient.get_instance()
        response = (
            client.table(MeetingScheduleModel.TABLE_NAME)
            .delete()
            .in_('id', meeting_ids)
            .execute()
        )
        return response.data or []
