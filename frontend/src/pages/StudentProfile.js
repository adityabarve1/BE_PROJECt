import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { getStudentByRollNo, getPredictionHistory } from '../services/api';
import { toast } from 'react-toastify';

const StudentProfile = () => {
  const { rollNo } = useParams();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [rollNo]);

  const fetchStudentData = async () => {
    try {
      const studentResponse = await getStudentByRollNo(rollNo);
      setStudent(studentResponse.data);

      const historyResponse = await getPredictionHistory(rollNo);
      setHistory(historyResponse.data);

      setLoading(false);
    } catch (error) {
      toast.error('Failed to load student data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!student) {
    return (
      <Container>
        <Typography variant="h6">Student not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Student Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography color="text.secondary">Name</Typography>
                <Typography variant="h6">{student.student_name}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary">Roll Number</Typography>
                <Typography variant="h6">{student.roll_no}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary">Class</Typography>
                <Typography variant="h6">{student.class}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary">Gender</Typography>
                <Typography variant="h6">{student.gender}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Academic Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Academic Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography color="text.secondary">Attendance</Typography>
                <Typography variant="h6">{student.attendance?.toFixed(1)}%</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary">Marks</Typography>
                <Typography variant="h6">{student.marks?.toFixed(1)}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary">Dropout Risk</Typography>
                {student.dropout_risk ? (
                  <Chip
                    label={student.dropout_risk}
                    color={student.dropout_risk === 'High' ? 'error' : 'success'}
                    sx={{ mt: 1 }}
                  />
                ) : (
                  <Typography>Not Assessed</Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Family Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Family Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography color="text.secondary">Parent Occupation</Typography>
                <Typography variant="h6">{student.parent_occupation}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary">Family Income</Typography>
                <Typography variant="h6">{student.income}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary">Location</Typography>
                <Typography variant="h6">{student.location}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Prediction History */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Prediction History
            </Typography>
            {history.length > 0 ? (
              <Box>
                {history.map((record, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(record.created_at).toLocaleString()}
                    </Typography>
                    <Chip
                      label={record.dropout_risk}
                      color={record.dropout_risk === 'High' ? 'error' : 'success'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Risk Score: {(record.risk_score * 100).toFixed(2)}%
                    </Typography>
                    {index < history.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No prediction history</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentProfile;
