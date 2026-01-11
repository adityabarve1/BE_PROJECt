# 🚀 Quick Start Guide

## Dropout Prediction System - Setup & Run

---

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Supabase account (free tier works)

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization and enter:
   - Project name: `dropout-prediction`
   - Database password: (save this!)
   - Region: Choose closest to you
4. Click "Create new project" and wait ~2 minutes

### 1.2 Run Database Schema
1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New query"
3. Copy entire content from `database/schema.sql`
4. Paste and click "Run"
5. Verify: Check "Table Editor" - you should see 6 tables

### 1.3 Get API Keys
1. Click "Settings" (gear icon)
2. Click "API" from left menu
3. Copy these values:
   - **URL**: `https://xxxxx.supabase.co`
   - **anon public**: Your API key

---

## Step 2: Backend Setup (2 minutes)

### 2.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2.2 Configure Environment
Create `backend/.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-public-key-here
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

Replace:
- `xxxxx` with your project ID from Supabase URL
- `[password]` with your database password

### 2.3 Start Backend
```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

---

## Step 3: Frontend Setup (2 minutes)

### 3.1 Install Dependencies
Open new terminal:
```bash
cd frontend
npm install
```

### 3.2 Start Frontend
```bash
npm start
```

Browser will open at `http://localhost:3000`

---

## Step 4: Test the System (5 minutes)

### 4.1 Register Teacher
1. Click "Register here"
2. Fill form:
   - Full Name: `Test Teacher`
   - Email: `test@school.com`
   - Phone: `9876543210`
   - Password: `Test@123`
3. Click "Register"
4. You'll be auto-logged in and redirected to Dashboard

### 4.2 Upload Admission Document
1. Click "Upload" in navbar
2. Select:
   - Document Type: "Admission Document"
   - Class: "8th"
   - Admission Year: "2026"
3. Click "Choose Excel File"
4. Select `sample_templates/admission_sample_8th_2026.xlsx`
5. Click "Upload Document"
6. Success message: "Successfully created 5 student profiles"

### 4.3 Upload Attendance
1. Select Document Type: "Attendance Sheet"
2. Same class and year
3. Choose `attendance_sample_8th.xlsx`
4. Upload → "Successfully updated attendance for 5 students"

### 4.4 Upload Results
1. Select Document Type: "Results Sheet"
2. Same class and year
3. Choose `results_sample_8th.xlsx`
4. Upload → "Successfully updated marks for 5 students"

### 4.5 View & Edit Students
1. Click "Class View" in navbar
2. Select Class: "8th", Year: "2026"
3. You'll see 5 students with data:
   - JP202608001 - Rahul Kumar - 85.5% attendance
   - JP202608002 - Priya Sharma - 72% attendance
   - JP202608003 - Amit Patel - 68.5% attendance
   - JP202608004 - Sneha Singh - 45% attendance (at risk!)
   - JP202608005 - Raj Gupta - 92% attendance
4. Click any row to edit
5. Change values and click "Save Changes"
6. Data updates in database!

### 4.6 Run Predictions
1. Click "Predict" in navbar
2. Fill form with student data or select existing student
3. Click "Predict Dropout Risk"
4. See result with risk level and recommendations

### 4.7 View Analytics
1. Click "Analytics" in navbar
2. See:
   - Total students
   - High-risk count
   - Risk distribution charts
   - Class-wise statistics

---

## Troubleshooting

### Backend won't start
**Error:** `ModuleNotFoundError: No module named 'flask'`
```bash
pip install flask flask-cors supabase psycopg2-binary
```

### Frontend won't start
**Error:** `Cannot find module`
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database connection fails
**Error:** `could not connect to server`
- Check SUPABASE_URL in `.env` is correct
- Verify DATABASE_URL password matches your Supabase password
- Ensure Supabase project is active (not paused)

### File upload fails
**Error:** `No such file or directory: '../uploads'`
```bash
cd backend
mkdir uploads
```

### Model predictions fail
**Error:** `No module named 'torch'`
```bash
pip install torch scikit-learn
```

**Error:** `Model file not found`
```bash
cd model/src
python train.py
```

---

## Testing Checklist

- [ ] Register new teacher account
- [ ] Login with credentials
- [ ] Upload admission document (creates 5 students)
- [ ] Upload attendance sheet (updates attendance)
- [ ] Upload results sheet (updates marks)
- [ ] View students in Class View
- [ ] Click and edit a student
- [ ] Save changes
- [ ] Run prediction for at-risk student
- [ ] View analytics dashboard
- [ ] Logout and login again

---

## Default Credentials

**Test Teacher:**
- Email: `test@school.com`
- Password: `Test@123`

**Test Students (after upload):**
- Student ID: `JP202608001` to `JP202608005`
- Password: `PASS@2026` (for future student portal)

---

## Sample Data Summary

**5 Students in sample files:**
1. **Rahul Kumar** (Roll 1)
   - Attendance: 85.5%
   - Avg Marks: 80
   - Risk: Low ✅

2. **Priya Sharma** (Roll 2)
   - Attendance: 72%
   - Avg Marks: 70
   - Risk: Low/Medium

3. **Amit Patel** (Roll 3)
   - Attendance: 68.5%
   - Avg Marks: 57
   - Risk: Medium ⚠️

4. **Sneha Singh** (Roll 4)
   - Attendance: 45%
   - Avg Marks: 40
   - Risk: High 🚨
   - **This student needs immediate intervention!**

5. **Raj Gupta** (Roll 5)
   - Attendance: 92%
   - Avg Marks: 92.8
   - Risk: Low ✅

---

## API Endpoints Reference

### Authentication
- POST `/api/auth/register` - Register teacher
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

### Documents
- POST `/api/documents/upload/admission` - Upload admission doc
- POST `/api/documents/upload/attendance` - Upload attendance
- POST `/api/documents/upload/results` - Upload results

### Students
- GET `/api/students/class/{class}?admission_year=2026` - Get by class
- GET `/api/students/{student_id}` - Get single student
- PUT `/api/students/{student_id}` - Update student
- DELETE `/api/students/{student_id}` - Delete student

### Predictions
- POST `/api/prediction/predict` - Single prediction
- POST `/api/prediction/predict-batch` - Batch predictions
- GET `/api/prediction/history/{student_id}` - Prediction history

### Analytics
- GET `/api/analytics/dashboard` - Dashboard stats
- GET `/api/analytics/risk-factors` - Risk factor analysis

---

## Next Features to Build

- [ ] PDF document parsing
- [ ] Student login portal
- [ ] Meeting scheduling (SDPS)
- [ ] Notification system
- [ ] Email alerts for high-risk students
- [ ] Export reports to PDF
- [ ] Mobile app
- [ ] Parent portal

---

## Support

For detailed API documentation, see:
- `API_TESTING_GUIDE.md` - Complete API reference with curl examples
- `IMPLEMENTATION_STATUS.md` - Full implementation details
- `COMPLETION_SUMMARY.md` - Project overview

---

**🎉 You're all set! Happy testing!**
