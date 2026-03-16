# Student Dropout Prediction System

A comprehensive AI-powered system for predicting student dropout risk in Jilha Parishad (government) schools in rural India.

## 🎯 Project Overview

This system uses a custom TabNet deep learning model to predict dropout risk for students in government schools. It provides early intervention capabilities through risk assessment and personalized recommendations.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Flask (Python)
- **Database**: PostgreSQL (Supabase)
- **ML Model**: Custom TabNet implementation (PyTorch)

### Project Structure

```
BE_PROJECT_FINAL/
├── model/                      # Machine Learning Model
│   ├── src/
│   │   ├── tabnet_model.py    # Custom TabNet implementation
│   │   ├── data_preprocessing.py
│   │   ├── train.py           # Training script
│   │   └── predict.py         # Prediction module
│   ├── data/
│   │   ├── raw/               # Raw dataset
│   │   └── processed/         # Processed data
│   ├── saved_models/          # Trained models
│   └── notebooks/             # Jupyter notebooks
│
├── backend/                    # Flask Backend
│   ├── app/
│   │   ├── routes/            # API endpoints
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── config.py              # Configuration
│   └── run.py                 # Application entry
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── App.js
│   └── public/
│
└── database/                   # Database Schema
    ├── schema.sql             # PostgreSQL schema
    └── migrations/            # Database migrations
```

## 📊 Features

### Student Data Features

- Student Name & Roll Number
- Attendance Percentage
- Academic Marks
- Family Income (Low/Medium/High)
- Gender
- Class (5th-10th)
- Parent Occupation
- Location (Rural/Urban/City)

### System Features

- **Risk Prediction**: ML-based dropout risk assessment
- **Dashboard**: Overview of student statistics and trends
- **Student Management**: CRUD operations for student records
- **Analytics**: Risk factor analysis and insights
- **Prediction History**: Track risk assessment over time
- **Intervention Tracking**: Record support measures for at-risk students

## 🚀 Setup Instructions

### 1. Model Setup

```bash
cd model
pip install -r requirements.txt

# Generate sample dataset
cd src
python data_preprocessing.py

# Train the model
python train.py
```

### 2. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database/schema.sql` in Supabase SQL Editor
3. Note your Supabase URL and API keys

### 3. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your credentials:
# SUPABASE_URL=your-supabase-url
# SUPABASE_KEY=your-supabase-key
# DATABASE_URL=your-postgresql-connection-string

# Run the server
python run.py
```

Backend will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Update .env with backend URL:
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:rollNo` - Get student by roll number
- `POST /api/students` - Create new student
- `PUT /api/students/:rollNo` - Update student
- `DELETE /api/students/:rollNo` - Delete student

### Predictions
- `POST /api/prediction/predict` - Predict dropout risk
- `POST /api/prediction/predict-batch` - Batch predictions
- `POST /api/prediction/explain` - Get feature importance
- `GET /api/prediction/history/:rollNo` - Get prediction history

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/risk-factors` - Risk factor analysis
- `GET /api/analytics/trends` - Trend analysis

## 🧠 Model Details

### TabNet Architecture

- **Attention Mechanism**: Selects important features at each decision step
- **Sequential Decision Making**: 3 decision steps
- **Ghost Batch Normalization**: Improved training stability
- **Sparsity Regularization**: Feature selection

### Training

- Binary Classification (High Risk / Low Risk)
- 80-20 Train-Test Split
- Early Stopping with patience of 10 epochs
- Adam Optimizer
- Cross Entropy Loss with Sparsity Penalty

### Performance Metrics

- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix

## 📈 Usage

### Training the Model

```bash
cd model/src
python train.py
```

### Making Predictions

```python
from predict import DropoutPredictor

predictor = DropoutPredictor(
    model_path='../saved_models/best_model.pth',
    preprocessor_path='../saved_models/preprocessor.pkl'
)

student_data = {
    'attendance': 65.5,
    'marks': 45.0,
    'income': 'Low',
    'gender': 'Male',
    'class': '8th',
    'parent_occupation': 'Farmer',
    'location': 'Rural'
}

result = predictor.predict_single(student_data)
print(result)
```

## 🤝 Contributing

This is a BE (Bachelor of Engineering) final year project. Contributions and suggestions are welcome!

## 📝 License

This project is for educational purposes.

## 👥 Team

BE Project Team - [Your Institution Name]

## 📧 Contact

For questions or support, please contact [your-email@example.com]

## 🙏 Acknowledgments

- Jilha Parishad schools for inspiration
- PyTorch and scikit-learn communities
- Material-UI for React components
- Supabase for database infrastructure
