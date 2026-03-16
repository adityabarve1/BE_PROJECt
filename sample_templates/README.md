# Sample Excel Templates - Instructions

## Overview
This directory contains sample Excel template files for testing the document upload functionality.

## Files Needed

### 1. Admission Document Template
**Filename:** `admission_sample_8th_2026.xlsx`

**Columns:**
- Name
- Roll No
- Admission Year
- Gender (Male/Female)
- Income (Low/Medium/High)
- Parent Occupation
- Location (Rural/Urban/City)
- Date of Birth (YYYY-MM-DD)

**Sample Data:**
```
Name            | Roll No | Admission Year | Gender | Income | Parent Occupation | Location | Date of Birth
Rahul Kumar     | 1       | 2026          | Male   | Low    | Farmer           | Rural    | 2010-05-15
Priya Sharma    | 2       | 2026          | Female | Medium | Labor            | Rural    | 2010-08-22
Amit Patel      | 3       | 2026          | Male   | Low    | Small Business   | Urban    | 2010-12-10
Sneha Singh     | 4       | 2026          | Female | Low    | Farmer           | Rural    | 2010-03-05
Raj Gupta       | 5       | 2026          | Male   | High   | Government Job   | City     | 2010-11-30
```

---

### 2. Attendance Document Template
**Filename:** `attendance_sample_8th.xlsx`

**Columns:**
- Roll No
- Student Name (optional)
- Attendance (percentage 0-100)

**Sample Data:**
```
Roll No | Student Name   | Attendance
1       | Rahul Kumar    | 85.5
2       | Priya Sharma   | 72.0
3       | Amit Patel     | 68.5
4       | Sneha Singh    | 45.0
5       | Raj Gupta      | 92.0
```

---

### 3. Results Document Template
**Filename:** `results_sample_8th.xlsx`

**Columns:**
- Roll No
- Student Name (optional)
- Subject columns with marks (0-100)

**Sample Data:**
```
Roll No | Student Name   | Marathi | English | Mathematics | Science | Social Studies
1       | Rahul Kumar    | 75      | 80      | 85          | 78      | 82
2       | Priya Sharma   | 68      | 70      | 65          | 72      | 75
3       | Amit Patel     | 55      | 60      | 50          | 58      | 62
4       | Sneha Singh    | 42      | 38      | 40          | 35      | 45
5       | Raj Gupta      | 88      | 90      | 95          | 92      | 89
```

---

## How to Create Templates

### Option 1: Manual Creation
1. Open Excel or Google Sheets
2. Create new workbook
3. Add column headers as shown above
4. Add sample data
5. Save as `.xlsx` file

### Option 2: Using Python Script
Run the following Python script to auto-generate templates:

```python
import pandas as pd

# Admission Template
admission_data = {
    'Name': ['Rahul Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Singh', 'Raj Gupta'],
    'Roll No': [1, 2, 3, 4, 5],
    'Admission Year': [2026, 2026, 2026, 2026, 2026],
    'Gender': ['Male', 'Female', 'Male', 'Female', 'Male'],
    'Income': ['Low', 'Medium', 'Low', 'Low', 'High'],
    'Parent Occupation': ['Farmer', 'Labor', 'Small Business', 'Farmer', 'Government Job'],
    'Location': ['Rural', 'Rural', 'Urban', 'Rural', 'City'],
    'Date of Birth': ['2010-05-15', '2010-08-22', '2010-12-10', '2010-03-05', '2010-11-30']
}
pd.DataFrame(admission_data).to_excel('admission_sample_8th_2026.xlsx', index=False)

# Attendance Template
attendance_data = {
    'Roll No': [1, 2, 3, 4, 5],
    'Student Name': ['Rahul Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Singh', 'Raj Gupta'],
    'Attendance': [85.5, 72.0, 68.5, 45.0, 92.0]
}
pd.DataFrame(attendance_data).to_excel('attendance_sample_8th.xlsx', index=False)

# Results Template
results_data = {
    'Roll No': [1, 2, 3, 4, 5],
    'Student Name': ['Rahul Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Singh', 'Raj Gupta'],
    'Marathi': [75, 68, 55, 42, 88],
    'English': [80, 70, 60, 38, 90],
    'Mathematics': [85, 65, 50, 40, 95],
    'Science': [78, 72, 58, 35, 92],
    'Social Studies': [82, 75, 62, 45, 89]
}
pd.DataFrame(results_data).to_excel('results_sample_8th.xlsx', index=False)
```

---

## Testing Upload Flow

### 1. Upload Admission Document
```bash
curl -X POST http://localhost:5000/api/documents/upload/admission \
  -F "file=@admission_sample_8th_2026.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=your-teacher-uuid"
```

**Expected Result:**
- 5 student profiles created
- Student IDs generated: JP202608001, JP202608002, etc.
- Default password set: PASS@2026

### 2. Upload Attendance Document
```bash
curl -X POST http://localhost:5000/api/documents/upload/attendance \
  -F "file=@attendance_sample_8th.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=your-teacher-uuid"
```

**Expected Result:**
- Attendance updated for all 5 students

### 3. Upload Results Document
```bash
curl -X POST http://localhost:5000/api/documents/upload/results \
  -F "file=@results_sample_8th.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=your-teacher-uuid"
```

**Expected Result:**
- Marks updated with average calculated
- Example: Rahul's marks = (75+80+85+78+82)/5 = 80.0

---

## Column Name Flexibility

The parser supports various column name formats:

**For Names:**
- "Name", "Student Name", "Student", "Full Name"

**For Roll Number:**
- "Roll No", "Roll Number", "Roll", "RollNo"

**For Attendance:**
- "Attendance", "Attendance Percentage", "Attendance %", "Present"

**For Gender:**
- "Gender", "Sex"

**For Income:**
- "Income", "Family Income", "Household Income"

---

## Notes

- Ensure Excel files are in `.xlsx` or `.xls` format
- Roll numbers should be unique within a class/year combination
- Attendance should be between 0-100
- Marks should be between 0-100
- Gender must be "Male" or "Female"
- Income must be "Low", "Medium", or "High"
- Location must be "Rural", "Urban", or "City"
