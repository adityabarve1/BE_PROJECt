"""
Teacher Model for database operations
"""

from datetime import datetime
from supabase import create_client
import os


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


class TeacherModel:
    """Model for teacher data"""
    
    TABLE_NAME = 'teachers'
    
    @staticmethod
    def create_teacher(teacher_data):
        """Create a new teacher record"""
        client = SupabaseClient.get_instance()
        
        data = {
            'email': teacher_data['email'],
            'full_name': teacher_data['full_name'],
            'phone': teacher_data.get('phone'),
            'auth_uid': teacher_data.get('auth_uid'),
            'is_active': True,
            'created_at': datetime.utcnow().isoformat()
        }
        
        response = client.table(TeacherModel.TABLE_NAME).insert(data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_teacher_by_email(email):
        """Get teacher by email"""
        client = SupabaseClient.get_instance()
        response = client.table(TeacherModel.TABLE_NAME).select("*").eq('email', email).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_teacher_by_auth_uid(auth_uid):
        """Get teacher by Supabase auth UID"""
        client = SupabaseClient.get_instance()
        response = client.table(TeacherModel.TABLE_NAME).select("*").eq('auth_uid', auth_uid).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_teacher_by_id(teacher_id):
        """Get teacher by ID"""
        client = SupabaseClient.get_instance()
        response = client.table(TeacherModel.TABLE_NAME).select("*").eq('id', teacher_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update_teacher(teacher_id, update_data):
        """Update teacher record"""
        client = SupabaseClient.get_instance()
        update_data['updated_at'] = datetime.utcnow().isoformat()
        response = client.table(TeacherModel.TABLE_NAME).update(update_data).eq('id', teacher_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_all_teachers():
        """Get all teachers"""
        client = SupabaseClient.get_instance()
        response = client.table(TeacherModel.TABLE_NAME).select("*").execute()
        return response.data
