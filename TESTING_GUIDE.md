# Testing Guide - Dropout Prediction System

## Prerequisites
- Backend running on: http://localhost:5001
- Frontend running on: http://localhost:3000
- Email confirmation disabled in Supabase (for testing)

## Step-by-Step Testing Instructions

### 1. Registration & Login
1. Open http://localhost:3000
2. Click **Register** 
3. Fill in the form:
   - Full Name: `Test Teacher`
   - Email: `teacher@test.com`
   - Phone: `9876543210`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click **Register** → You'll see success message and redirect to login
5. **Login** with the same credentials
6. You should see the Dashboard

### 2. Upload Student Data (Admission)
1. Click **Document Upload** in the navbar
2. Select **Admission Document** from dropdown
3. Fill in:
   - Class: `8th`
   - Admission Year: `2026`
4. Upload file: `sample_templates/admission_sample_8th_2026.xlsx`
5. Click **Upload**
6. ✅ Success: You should see "Successfully created X student profiles"

### 3. Upload Attendance Data
1. Go back to **Document Upload**
2. Select **Attendance Document**
3. Fill in:
   - Class: `8th`
   - Admission Year: `2026`
4. Upload file: `sample_templates/attendance_sample_8th_2026.xlsx`
5. Click **Upload**
6. ✅ Success: Attendance updated for students

### 4. Upload Results Data
1. Go back to **Document Upload**
2. Select **Results Document**
3. Fill in:
   - Class: `8th`
   - Admission Year: `2026`
4. Upload file: `sample_templates/results_sample_8th_2026.xlsx`
5. Click **Upload**
6. ✅ Success: Marks updated for students

### 5. View Students (ClassView)
1. Click **ClassView** in the navbar
2. Select:
   - Class: `8th`
   - Admission Year: `2026`
3. Click **Load Students**
4. ✅ You should see a data grid with all students, their attendance, marks, etc.

### 6. Edit Student Data
1. In the ClassView data grid, click **Edit** icon on any student row
2. Modify any field (attendance, marks, income, location, etc.)
3. Click **Save**
4. ✅ Changes should be saved and grid refreshed

### 7. Test Prediction (Method 1: Individual Prediction Form)

**Navigate to Prediction Page:**
1. Click **Predict** in the navbar
2. Fill in the prediction form with sample data:
   ```
   Attendance: 75.5
   Marks: 65.0
   Gender: Male
   Class: 8th
   Family Income: Low
   Location: Rural
   Parent Occupation: Farmer
   ```
3. Click **Predict**
4. ✅ You should see:
   - Dropout Risk: High/Low
   - Risk Score: X.XX%
   - Confidence: X.XX%
   - Recommendation: Detailed suggestion

**Test Different Scenarios:**

**High Risk Student:**
```
Attendance: 45
Marks: 40
Gender: Male
Class: 8th
Family Income: Low
Location: Rural
Parent Occupation: Daily Wage
```
Expected: High risk with recommendation for intervention

**Low Risk Student:**
```
Attendance: 95
Marks: 85
Gender: Female
Class: 8th
Family Income: Medium
Location: City
Parent Occupation: Government Job
```
Expected: Low risk with positive feedback

### 8. Test Prediction (Method 2: Via API - For Batch Predictions)

You can also test predictions using the backend API directly:

**Single Prediction:**
```bash
curl -X POST http://localhost:5001/api/prediction/predict \
  -H "Content-Type: application/json" \
  -d '{
    "attendance": 75.5,
    "marks": 65.0,
    "gender": "Male",
    "class": "8th",
    "income": "Low",
    "location": "Rural",
    "parent_occupation": "Farmer"
  }'
```

**Batch Prediction (Multiple Students):**
```bash
curl -X POST http://localhost:5001/api/prediction/predict-batch \
  -H "Content-Type: application/json" \
  -d '{
    "students": [
      {
        "roll_no": 1,
        "attendance": 75.5,
        "marks": 65.0,
        "gender": "Male",
        "class": "8th",
        "income": "Low",
        "location": "Rural",
        "parent_occupation": "Farmer"
      },
      {
        "roll_no": 2,
        "attendance": 92.0,
        "marks": 88.0,
        "gender": "Female",
        "class": "8th",
        "income": "Medium",
        "location": "City",
        "parent_occupation": "Government Job"
      }
    ]
  }'
```

### 9. Check Dashboard Updates
1. Click **Dashboard** in navbar
2. ✅ Verify the dashboard shows:
   - Total Students count
   - High Risk count
   - Low Risk count
   - Risk Percentage
   - Class Distribution chart
   - Location Statistics

**If Dashboard doesn't update:**
- Make sure you've uploaded all three documents (admission, attendance, results)
- Refresh the page (F5 or Cmd+R)
- Check browser console for errors

### 10. View Student Profile
1. In ClassView, click **View** icon on any student
2. ✅ You should see:
   - Student details
   - Attendance history
   - Marks history
   - Prediction history (if predictions were run)

### 11. View All Students List
1. Click **Students** in navbar
2. ✅ View complete list of all students across all classes
3. You can click **View** to see individual profiles

## Common Issues & Solutions

### Dashboard Not Updating
- **Cause:** Data not loaded or browser cache
- **Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Prediction Returns Error
- **Cause:** Missing required fields or model not loaded
- **Solution:** 
  - Check all fields are filled
  - Verify backend logs show "Model loaded successfully"
  - Restart backend if needed

### Upload Fails
- **Cause:** Column names don't match expected format
- **Solution:** Use the provided sample Excel files as templates

### Students Not Showing in ClassView
- **Cause:** Wrong class or admission year selected
- **Solution:** Make sure you select `8th` class and `2026` admission year

## Testing Checklist

- [ ] Registration works
- [ ] Login works
- [ ] Admission upload succeeds
- [ ] Attendance upload succeeds
- [ ] Results upload succeeds
- [ ] Dashboard shows correct stats
- [ ] ClassView displays students
- [ ] Can edit student data
- [ ] Individual prediction works
- [ ] Batch prediction works (via API)
- [ ] Student profile page loads
- [ ] All students list shows data

## Sample Data Location
All sample Excel files are in: `/sample_templates/`
- `admission_sample_8th_2026.xlsx`
- `attendance_sample_8th_2026.xlsx`
- `results_sample_8th_2026.xlsx`

## Backend Endpoints for Testing

### Authentication
- `POST /api/auth/register` - Register teacher
- `POST /api/auth/login` - Login teacher
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student

### Documents
- `POST /api/documents/upload/admission` - Upload admission doc
- `POST /api/documents/upload/attendance` - Upload attendance doc
- `POST /api/documents/upload/results` - Upload results doc

### Predictions
- `POST /api/prediction/predict` - Single prediction
- `POST /api/prediction/predict-batch` - Batch prediction
- `POST /api/prediction/explain` - Get prediction explanation

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/risk-factors` - Risk factors analysis
- `GET /api/analytics/trends` - Risk trends over time
