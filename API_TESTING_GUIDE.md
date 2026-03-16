# API Testing Guide

Complete guide for testing all API endpoints of the Dropout Prediction System.

## Prerequisites

1. ✅ Supabase project created and schema applied
2. ✅ Backend running on `http://localhost:5000`
3. ✅ Environment variables configured

---

## 1. Authentication APIs

### Register New Teacher
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "password": "Teacher@123",
    "full_name": "Rajesh Patil",
    "phone": "9876543210"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Teacher registered successfully",
  "data": {
    "teacher_id": "uuid-here",
    "email": "teacher1@school.com",
    "full_name": "Rajesh Patil"
  }
}
```

---

### Teacher Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "password": "Teacher@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "teacher": {
      "id": "uuid",
      "email": "teacher1@school.com",
      "full_name": "Rajesh Patil"
    }
  }
}
```

**Save the `access_token` and `teacher_id` for subsequent requests!**

---

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 2. Document Upload APIs

### Upload Admission Document
```bash
curl -X POST http://localhost:5000/api/documents/upload/admission \
  -F "file=@sample_templates/admission_sample_8th_2026.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=YOUR_TEACHER_UUID"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully created 5 student profiles",
  "data": {
    "students_created": 5,
    "errors": [],
    "upload_id": "upload-uuid"
  }
}
```

**Generated Student IDs:**
- JP202608001 (Roll 1)
- JP202608002 (Roll 2)
- JP202608003 (Roll 3)
- JP202608004 (Roll 4)
- JP202608005 (Roll 5)

---

### Upload Attendance Document
```bash
curl -X POST http://localhost:5000/api/documents/upload/attendance \
  -F "file=@sample_templates/attendance_sample_8th.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=YOUR_TEACHER_UUID"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully updated attendance for 5 students",
  "data": {
    "students_updated": 5,
    "errors": [],
    "upload_id": "upload-uuid"
  }
}
```

---

### Upload Results Document
```bash
curl -X POST http://localhost:5000/api/documents/upload/results \
  -F "file=@sample_templates/results_sample_8th.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=YOUR_TEACHER_UUID"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully updated marks for 5 students",
  "data": {
    "students_updated": 5,
    "errors": [],
    "upload_id": "upload-uuid"
  }
}
```

---

### Get Upload History
```bash
curl -X GET "http://localhost:5000/api/documents/uploads/history?teacher_id=YOUR_TEACHER_UUID"
```

---

## 3. Student Management APIs

### Get All Students
```bash
curl -X GET "http://localhost:5000/api/students?limit=100&offset=0"
```

---

### Get Students by Class
```bash
curl -X GET "http://localhost:5000/api/students/class/8th?admission_year=2026"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "student_id": "JP202608001",
      "student_name": "Rahul Kumar",
      "roll_no": 1,
      "class": "8th",
      "admission_year": 2026,
      "attendance": 85.5,
      "marks": 80.0,
      "gender": "Male",
      "income": "Low",
      "parent_occupation": "Farmer",
      "location": "Rural",
      "dropout_risk": null
    },
    ...
  ],
  "count": 5
}
```

---

### Get Single Student
```bash
curl -X GET http://localhost:5000/api/students/JP202608001
```

---

### Update Student
```bash
curl -X PUT http://localhost:5000/api/students/JP202608001 \
  -H "Content-Type: application/json" \
  -d '{
    "income": "Medium",
    "attendance": 90.0
  }'
```

---

### Create Student Manually
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "New Student",
    "roll_no": 6,
    "admission_year": 2026,
    "gender": "Female",
    "class": "8th",
    "income": "Low",
    "parent_occupation": "Labor",
    "location": "Rural"
  }'
```

---

### Delete Student
```bash
curl -X DELETE http://localhost:5000/api/students/JP202608001
```

---

## 4. Prediction APIs

### Predict Dropout Risk (Single Student)
```bash
curl -X POST http://localhost:5000/api/prediction/predict \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "JP202608001",
    "attendance": 85.5,
    "marks": 80.0,
    "income": "Low",
    "gender": "Male",
    "class": "8th",
    "parent_occupation": "Farmer",
    "location": "Rural"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "dropout_risk": "Low",
    "risk_score": 0.2345,
    "confidence": 0.89,
    "recommendation": "Student is performing well. Continue monitoring progress."
  }
}
```

---

### Batch Prediction
```bash
curl -X POST http://localhost:5000/api/prediction/predict-batch \
  -H "Content-Type: application/json" \
  -d '{
    "students": [
      {
        "attendance": 45.0,
        "marks": 40.0,
        "income": "Low",
        "gender": "Female",
        "class": "8th",
        "parent_occupation": "Farmer",
        "location": "Rural"
      },
      {
        "attendance": 92.0,
        "marks": 95.0,
        "income": "High",
        "gender": "Male",
        "class": "8th",
        "parent_occupation": "Government Job",
        "location": "City"
      }
    ]
  }'
```

---

### Get Feature Importance
```bash
curl -X POST http://localhost:5000/api/prediction/explain \
  -H "Content-Type: application/json" \
  -d '{
    "attendance": 45.0,
    "marks": 40.0,
    "income": "Low",
    "gender": "Female",
    "class": "8th",
    "parent_occupation": "Farmer",
    "location": "Rural"
  }'
```

---

### Get Prediction History
```bash
curl -X GET http://localhost:5000/api/prediction/history/JP202608001
```

---

## 5. Analytics APIs

### Dashboard Statistics
```bash
curl -X GET http://localhost:5000/api/analytics/dashboard
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total_students": 5,
    "high_risk_count": 1,
    "low_risk_count": 4,
    "risk_percentage": 20.0,
    "class_distribution": {
      "8th": 5
    },
    "location_stats": {
      "Rural": {"total": 4, "high_risk": 1},
      "City": {"total": 1, "high_risk": 0}
    }
  }
}
```

---

### Risk Factors Analysis
```bash
curl -X GET http://localhost:5000/api/analytics/risk-factors
```

---

### Trends Analysis
```bash
curl -X GET http://localhost:5000/api/analytics/trends
```

---

## 6. Health Check
```bash
curl -X GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "Dropout Prediction API is running"
}
```

---

## Testing Workflow

### Complete Test Flow:

```bash
# 1. Register teacher
TEACHER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@school.com",
    "password": "Test@123",
    "full_name": "Test Teacher"
  }')

# 2. Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@school.com",
    "password": "Test@123"
  }')

# Extract teacher_id and token (manual for now)
# TEACHER_ID="uuid-from-response"
# TOKEN="token-from-response"

# 3. Upload admission document
curl -X POST http://localhost:5000/api/documents/upload/admission \
  -F "file=@sample_templates/admission_sample_8th_2026.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=$TEACHER_ID"

# 4. Upload attendance
curl -X POST http://localhost:5000/api/documents/upload/attendance \
  -F "file=@sample_templates/attendance_sample_8th.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=$TEACHER_ID"

# 5. Upload results
curl -X POST http://localhost:5000/api/documents/upload/results \
  -F "file=@sample_templates/results_sample_8th.xlsx" \
  -F "class=8th" \
  -F "admission_year=2026" \
  -F "teacher_id=$TEACHER_ID"

# 6. Get students
curl -X GET "http://localhost:5000/api/students/class/8th?admission_year=2026"

# 7. Run predictions (after model is trained)
curl -X POST http://localhost:5000/api/prediction/predict \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "JP202608004",
    "attendance": 45.0,
    "marks": 40.0,
    "income": "Low",
    "gender": "Female",
    "class": "8th",
    "parent_occupation": "Farmer",
    "location": "Rural"
  }'

# 8. Check dashboard
curl -X GET http://localhost:5000/api/analytics/dashboard
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: email, password",
  "success": false
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials",
  "success": false
}
```

### 404 Not Found
```json
{
  "error": "Student not found",
  "success": false
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message details",
  "success": false
}
```

---

## Postman Collection

You can import these endpoints into Postman for easier testing. Create a collection with:

**Variables:**
- `base_url`: http://localhost:5000
- `teacher_id`: (set after registration)
- `access_token`: (set after login)

---

## Next Steps

1. ✅ Test authentication flow
2. ✅ Upload sample documents
3. ✅ Verify students created in database
4. ⏳ Train the model with uploaded data
5. ⏳ Test prediction endpoints
6. ⏳ Build frontend UI

---

**Happy Testing! 🚀**
