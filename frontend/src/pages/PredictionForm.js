import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { predictDropout, predictBatch } from '../services/api';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PredictionForm = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  
  // Student-wise prediction state
  const [selectedClass, setSelectedClass] = useState('');
  const [admissionYear, setAdmissionYear] = useState('2026');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Class-wise prediction state
  const [classForBatch, setClassForBatch] = useState('');
  const [yearForBatch, setYearForBatch] = useState('2026');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setResult(null);
    setBatchResults(null);
  };

  // Fetch students when class and year are selected
  useEffect(() => {
    if (selectedClass && admissionYear) {
      fetchStudents();
    }
  }, [selectedClass, admissionYear]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await axios.get(
        `${API_URL}/students/class/${selectedClass}?admission_year=${admissionYear}`
      );
      setStudents(response.data.data || []);
      setSelectedStudent('');
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentPrediction = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const student = students.find(s => s.student_id === selectedStudent);
      
      const response = await predictDropout({
        attendance: parseFloat(student.attendance) || 0,
        marks: parseFloat(student.marks) || 0,
        gender: student.gender,
        class: student.class,
        income: student.income || 'Medium',
        location: student.location || 'Urban',
        parent_occupation: student.parent_occupation || 'Small Business',
      });

      const predictionData = response.data.data || response.data;

      setResult({
        ...predictionData,
        student_name: student.student_name,
        roll_no: student.roll_no,
      });

      // Update student profile with prediction
      await axios.put(`${API_URL}/students/${student.student_id}`, {
        dropout_risk: predictionData.dropout_risk,
        risk_score: predictionData.risk_score,
      });

      toast.success('Prediction completed and profile updated!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Failed to make prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleClassPrediction = async () => {
    if (!classForBatch || !yearForBatch) {
      toast.error('Please select class and admission year');
      return;
    }

    setLoading(true);
    setBatchResults(null);

    try {
      // Fetch all students in the class
      const studentsResponse = await axios.get(
        `${API_URL}/students/class/${classForBatch}?admission_year=${yearForBatch}`
      );
      const classStudents = studentsResponse.data.data || [];

      if (classStudents.length === 0) {
        toast.error('No students found in this class');
        setLoading(false);
        return;
      }

      // Prepare batch prediction data
      const studentsForPrediction = classStudents.map(student => ({
        student_id: student.student_id,
        roll_no: student.roll_no,
        attendance: parseFloat(student.attendance) || 0,
        marks: parseFloat(student.marks) || 0,
        gender: student.gender,
        class: student.class,
        income: student.income || 'Medium',
        location: student.location || 'Urban',
        parent_occupation: student.parent_occupation || 'Small Business',
      }));

      // Make batch prediction
      const response = await predictBatch(studentsForPrediction);
      const predictions = response.data.data || response.data || [];

      // Map predictions back to students with their IDs
      const predictionsWithStudentInfo = predictions.map((pred, index) => ({
        ...pred,
        student_id: classStudents[index].student_id,
        roll_no: classStudents[index].roll_no,
        student_name: classStudents[index].student_name,
      }));

      setBatchResults(predictionsWithStudentInfo);

      // Update all student profiles with predictions
      for (const pred of predictionsWithStudentInfo) {
        try {
          await axios.put(`${API_URL}/students/${pred.student_id}`, {
            dropout_risk: pred.dropout_risk,
            risk_score: pred.risk_score,
          });
        } catch (err) {
          console.error(`Failed to update student ${pred.student_id}:`, err);
        }
      }

      toast.success(`Predictions completed for ${predictionsWithStudentInfo.length} students!`);
    } catch (error) {
      console.error('Batch prediction error:', error);
      toast.error('Failed to make batch prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Predict Dropout Risk
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Student-wise Prediction" />
          <Tab label="Class-wise Prediction" />
        </Tabs>

        {/* Student-wise Prediction */}
        {tabValue === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Select Student for Individual Prediction
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {['5th', '6th', '7th', '8th', '9th', '10th'].map((cls) => (
                    <MenuItem key={cls} value={cls}>
                      {cls}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admission Year"
                  type="number"
                  value={admissionYear}
                  onChange={(e) => setAdmissionYear(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select Student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!students.length || loadingStudents}
                  helperText={loadingStudents ? 'Loading students...' : `${students.length} students found`}
                >
                  {students.map((student) => (
                    <MenuItem key={student.student_id} value={student.student_id}>
                      Roll {student.roll_no} - {student.student_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleStudentPrediction}
                  disabled={loading || !selectedStudent}
                >
                  {loading ? <CircularProgress size={24} /> : 'Run Prediction'}
                </Button>
              </Grid>
            </Grid>

            {result && (
              <Box sx={{ mt: 4 }}>
                <Alert
                  severity={result.dropout_risk === 'High' ? 'error' : 'success'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">
                    Student: {result.student_name} (Roll {result.roll_no})
                  </Typography>
                  <Typography variant="h6">
                    Dropout Risk: {result.dropout_risk}
                  </Typography>
                  <Typography>
                    Risk Score: {(result.risk_score * 100).toFixed(2)}%
                  </Typography>
                  <Typography>
                    Confidence: {(result.confidence * 100).toFixed(2)}%
                  </Typography>
                </Alert>

                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Recommendation:
                  </Typography>
                  <Typography>{result.recommendation}</Typography>
                </Paper>
              </Box>
            )}
          </Box>
        )}

        {/* Class-wise Prediction */}
        {tabValue === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Predict for All Students in a Class
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Class"
                  value={classForBatch}
                  onChange={(e) => setClassForBatch(e.target.value)}
                >
                  {['5th', '6th', '7th', '8th', '9th', '10th'].map((cls) => (
                    <MenuItem key={cls} value={cls}>
                      {cls}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admission Year"
                  type="number"
                  value={yearForBatch}
                  onChange={(e) => setYearForBatch(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleClassPrediction}
                  disabled={loading || !classForBatch || !yearForBatch}
                >
                  {loading ? <CircularProgress size={24} /> : 'Run Predictions for All Students'}
                </Button>
              </Grid>
            </Grid>

            {batchResults && batchResults.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Prediction Results ({batchResults.length} students)
                </Typography>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Roll No</TableCell>
                        <TableCell>Dropout Risk</TableCell>
                        <TableCell>Risk Score</TableCell>
                        <TableCell>Confidence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchResults.map((pred) => (
                        <TableRow key={pred.roll_no}>
                          <TableCell>{pred.roll_no}</TableCell>
                          <TableCell>
                            <Chip
                              label={pred.dropout_risk}
                              color={pred.dropout_risk === 'High' ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{(pred.risk_score * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(pred.confidence * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Alert severity="success" sx={{ mt: 2 }}>
                  All student profiles have been updated with their prediction results!
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PredictionForm;
