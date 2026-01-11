import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Student APIs
export const getAllStudents = (limit = 100, offset = 0) => {
  return api.get(`/students?limit=${limit}&offset=${offset}`);
};

export const getStudentByRollNo = (rollNo) => {
  return api.get(`/students/${rollNo}`);
};

export const createStudent = (studentData) => {
  return api.post('/students', studentData);
};

export const updateStudent = (rollNo, studentData) => {
  return api.put(`/students/${rollNo}`, studentData);
};

export const deleteStudent = (rollNo) => {
  return api.delete(`/students/${rollNo}`);
};

export const getStudentsByClass = (className) => {
  return api.get(`/students/class/${className}`);
};

export const getHighRiskStudents = () => {
  return api.get('/students/high-risk');
};

// Prediction APIs
export const predictDropout = (studentData) => {
  return api.post('/prediction/predict', studentData);
};

export const predictBatch = (studentsData) => {
  return api.post('/prediction/predict-batch', { students: studentsData });
};

export const explainPrediction = (studentData) => {
  return api.post('/prediction/explain', studentData);
};

export const getPredictionHistory = (rollNo) => {
  return api.get(`/prediction/history/${rollNo}`);
};

// Analytics APIs
export const getDashboardStats = () => {
  return api.get('/analytics/dashboard');
};

export const getRiskFactors = () => {
  return api.get('/analytics/risk-factors');
};

export const getTrends = () => {
  return api.get('/analytics/trends');
};

export default api;
