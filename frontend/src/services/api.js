import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Student APIs
export const getAllStudents = (limit = 100, offset = 0) => {
  return api.get(`/students?limit=${limit}&offset=${offset}`);
};

export const getStudentById = (studentId) => {
  return api.get(`/students/${studentId}`);
};

// Backward-compatible alias
export const getStudentByRollNo = (studentId) => getStudentById(studentId);

export const createStudent = (studentData) => {
  return api.post('/students', studentData);
};

export const updateStudent = (studentId, studentData) => {
  return api.put(`/students/${studentId}`, studentData);
};

export const deleteStudent = (studentId) => {
  return api.delete(`/students/${studentId}`);
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

export const getPredictionHistory = (studentId) => {
  return api.get(`/prediction/history/${studentId}`);
};

// Portal APIs
export const studentPortalAccess = (credentials) => {
  return api.post('/portal/student/access', credentials);
};

export const parentPortalAccess = (credentials) => {
  return api.post('/portal/parent/access', credentials);
};

export const getStudentPortalOverview = (studentId) => {
  return api.get(`/portal/student/${studentId}/overview`);
};

export const getParentPortalOverview = (studentId) => {
  return api.get(`/portal/parent/${studentId}/overview`);
};

// Meeting/Follow-up APIs
export const publishMeetingNotice = (payload) => {
  return api.post('/meetings/publish', payload);
};

export const getTeacherPublications = (teacherId, limit = 50) => {
  return api.get(`/meetings/teacher/${teacherId}?limit=${limit}`);
};

export const getTeacherPublicationSummary = (teacherId, limit = 2000) => {
  return api.get(`/meetings/teacher/${teacherId}/summary?limit=${limit}`);
};

export const deleteTeacherPublication = (teacherId, publicationId) => {
  return api.delete(`/meetings/teacher/${teacherId}/publication/${publicationId}`);
};

export const acknowledgeStudentMeeting = (studentId, payload) => {
  return api.post(`/meetings/student/${studentId}/acknowledge`, payload);
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

export const getStudentClusters = (k = 3, limit = 2000) => {
  return api.get(`/analytics/clusters?k=${k}&limit=${limit}`);
};

export default api;
