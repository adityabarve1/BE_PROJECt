"""
Document Parser Utilities for Excel and PDF files
Handles admission documents, attendance sheets, and result lists
"""

import pandas as pd
import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional


def generate_student_id(admission_year: int, class_num: str, roll_no: int) -> str:
    """
    Generate unique student ID in format: JP{YEAR}{CLASS:02d}{ROLL:03d}
    Example: JP202608001 (JP + 2026 + Class 08 + Roll 001)
    
    Args:
        admission_year: Year of admission (e.g., 2026)
        class_num: Class as string (e.g., '8th', '10th')
        roll_no: Roll number (e.g., 1, 15, 100)
    
    Returns:
        Unique student ID
    """
    # Extract numeric part from class (e.g., '8th' -> 8)
    class_numeric = int(re.search(r'\d+', str(class_num)).group())
    
    # Format: JP + YEAR + CLASS(2 digits) + ROLL(3 digits)
    student_id = f"JP{admission_year}{class_numeric:02d}{roll_no:03d}"
    
    return student_id


def parse_admission_document(file_path: str, class_name: str, admission_year: int) -> Tuple[List[Dict], List[str]]:
    """
    Parse admission document (Excel) to extract student registration data
    
    Expected columns:
    - Name / Student Name
    - Roll No / Roll Number
    - Gender
    - Income / Family Income
    - Parent Occupation
    - Location
    - Date of Birth / DOB
    
    Args:
        file_path: Path to the Excel file
        class_name: Class for which admission is being processed
        admission_year: Year of admission for this batch
    
    Returns:
        Tuple of (list of student data dicts, list of errors)
    """
    students_data = []
    errors = []
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Normalize column names (lowercase, remove spaces)
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Map possible column name variations
        column_mapping = {
            'name': ['name', 'student_name', 'student', 'full_name'],
            'roll_no': ['roll_no', 'roll_number', 'roll', 'rollno'],
            'gender': ['gender', 'sex'],
            'income': ['income', 'family_income', 'household_income'],
            'parent_occupation': ['parent_occupation', 'occupation', 'parents_occupation', 'guardian_occupation'],
            'location': ['location', 'area', 'residence', 'address_type'],
            'date_of_birth': ['date_of_birth', 'dob', 'birth_date', 'birthdate']
        }
        
        # Find actual column names
        actual_columns = {}
        for key, possible_names in column_mapping.items():
            for col in df.columns:
                if col in possible_names:
                    actual_columns[key] = col
                    break
        
        # Validate required columns
        required_fields = ['name', 'roll_no', 'gender']
        missing_fields = [field for field in required_fields if field not in actual_columns]
        
        if missing_fields:
            errors.append(f"Missing required columns: {', '.join(missing_fields)}")
            return students_data, errors
        
        # Process each row
        for idx, row in df.iterrows():
            try:
                # Extract data
                student_name = str(row[actual_columns['name']]).strip()
                roll_no = int(row[actual_columns['roll_no']])
                gender = str(row[actual_columns['gender']]).strip().capitalize()
                
                # Validate gender
                if gender not in ['Male', 'Female']:
                    errors.append(f"Row {idx+2}: Invalid gender '{gender}' for {student_name}")
                    continue
                
                # Generate student ID
                student_id = generate_student_id(admission_year, class_name, roll_no)
                
                # Build student data
                student_data = {
                    'student_id': student_id,
                    'student_name': student_name,
                    'roll_no': roll_no,
                    'admission_year': admission_year,
                    'gender': gender,
                    'class': class_name,
                    'password_hash': 'PASS@2026'  # Default password
                }
                
                # Add optional fields
                if 'income' in actual_columns and pd.notna(row[actual_columns['income']]):
                    income = str(row[actual_columns['income']]).strip().capitalize()
                    if income in ['Low', 'Medium', 'High']:
                        student_data['income'] = income
                
                if 'parent_occupation' in actual_columns and pd.notna(row[actual_columns['parent_occupation']]):
                    student_data['parent_occupation'] = str(row[actual_columns['parent_occupation']]).strip()
                
                if 'location' in actual_columns and pd.notna(row[actual_columns['location']]):
                    location = str(row[actual_columns['location']]).strip().capitalize()
                    if location in ['Rural', 'Urban', 'City']:
                        student_data['location'] = location
                
                if 'date_of_birth' in actual_columns and pd.notna(row[actual_columns['date_of_birth']]):
                    dob = row[actual_columns['date_of_birth']]
                    if isinstance(dob, str):
                        dob = pd.to_datetime(dob)
                    student_data['date_of_birth'] = dob.strftime('%Y-%m-%d') if hasattr(dob, 'strftime') else str(dob)
                
                students_data.append(student_data)
                
            except Exception as e:
                errors.append(f"Row {idx+2}: {str(e)}")
                continue
        
        return students_data, errors
        
    except Exception as e:
        errors.append(f"Error reading file: {str(e)}")
        return students_data, errors


def parse_attendance_document(file_path: str) -> Tuple[List[Dict], List[str]]:
    """
    Parse attendance document (Excel) to extract attendance data
    
    Expected columns:
    - Roll No
    - Student Name (optional, for validation)
    - Attendance (percentage)
    
    Args:
        file_path: Path to the Excel file
    
    Returns:
        Tuple of (list of attendance data dicts, list of errors)
    """
    attendance_data = []
    errors = []
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Map column names
        column_mapping = {
            'roll_no': ['roll_no', 'roll_number', 'roll', 'rollno'],
            'student_name': ['student_name', 'name', 'student'],
            'attendance': ['attendance', 'attendance_percentage', 'attendance_%', 'present']
        }
        
        # Find actual columns
        actual_columns = {}
        for key, possible_names in column_mapping.items():
            for col in df.columns:
                if col in possible_names:
                    actual_columns[key] = col
                    break
        
        # Validate required columns
        if 'roll_no' not in actual_columns or 'attendance' not in actual_columns:
            errors.append("Missing required columns: Roll No and/or Attendance")
            return attendance_data, errors
        
        # Process each row
        for idx, row in df.iterrows():
            try:
                roll_no = int(row[actual_columns['roll_no']])
                attendance = float(row[actual_columns['attendance']])
                
                # Validate attendance range
                if attendance < 0 or attendance > 100:
                    errors.append(f"Row {idx+2}: Invalid attendance {attendance}% for roll {roll_no}")
                    continue
                
                data = {
                    'roll_no': roll_no,
                    'attendance': attendance
                }
                
                if 'student_name' in actual_columns:
                    data['student_name'] = str(row[actual_columns['student_name']]).strip()
                
                attendance_data.append(data)
                
            except Exception as e:
                errors.append(f"Row {idx+2}: {str(e)}")
                continue
        
        return attendance_data, errors
        
    except Exception as e:
        errors.append(f"Error reading file: {str(e)}")
        return attendance_data, errors


def parse_results_document(file_path: str) -> Tuple[List[Dict], List[str]]:
    """
    Parse results document (Excel) to extract marks data
    
    Expected columns:
    - Roll No
    - Student Name (optional)
    - Subject-wise marks columns
    
    Args:
        file_path: Path to the Excel file
    
    Returns:
        Tuple of (list of results data dicts with average marks, list of errors)
    """
    results_data = []
    errors = []
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Identify roll_no and student_name columns
        roll_col = None
        name_col = None
        
        for col in df.columns:
            if 'roll' in col:
                roll_col = col
            if 'name' in col or 'student' in col:
                name_col = col
        
        if not roll_col:
            errors.append("Missing Roll No column")
            return results_data, errors
        
        # Identify marks columns (numeric columns excluding roll_no)
        marks_columns = []
        for col in df.columns:
            if col != roll_col and col != name_col:
                if pd.api.types.is_numeric_dtype(df[col]):
                    marks_columns.append(col)
        
        if not marks_columns:
            errors.append("No marks columns found")
            return results_data, errors
        
        # Process each row
        for idx, row in df.iterrows():
            try:
                roll_no = int(row[roll_col])
                
                # Calculate average marks
                marks_list = []
                for col in marks_columns:
                    if pd.notna(row[col]):
                        mark = float(row[col])
                        if 0 <= mark <= 100:
                            marks_list.append(mark)
                
                if not marks_list:
                    errors.append(f"Row {idx+2}: No valid marks for roll {roll_no}")
                    continue
                
                average_marks = sum(marks_list) / len(marks_list)
                
                data = {
                    'roll_no': roll_no,
                    'marks': round(average_marks, 2)
                }
                
                if name_col:
                    data['student_name'] = str(row[name_col]).strip()
                
                results_data.append(data)
                
            except Exception as e:
                errors.append(f"Row {idx+2}: {str(e)}")
                continue
        
        return results_data, errors
        
    except Exception as e:
        errors.append(f"Error reading file: {str(e)}")
        return results_data, errors


def validate_excel_file(file_path: str) -> bool:
    """Validate if file is a valid Excel file"""
    try:
        pd.read_excel(file_path, nrows=1)
        return True
    except Exception:
        return False


if __name__ == "__main__":
    # Test the parsers
    print("Document Parser Module - Ready")
