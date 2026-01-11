import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAllStudents } from '../services/api';
import { toast } from 'react-toastify';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await getAllStudents();
      setStudents(response.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load students');
      setStudents([]);
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    return risk === 'High' ? 'error' : 'success';
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Student List
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Roll No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Attendance</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Dropout Risk</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.roll_no} hover>
                <TableCell>{student.roll_no}</TableCell>
                <TableCell>{student.student_name}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.attendance?.toFixed(1)}%</TableCell>
                <TableCell>{student.marks?.toFixed(1)}</TableCell>
                <TableCell>{student.location}</TableCell>
                <TableCell>
                  {student.dropout_risk ? (
                    <Chip
                      label={student.dropout_risk}
                      color={getRiskColor(student.dropout_risk)}
                      size="small"
                    />
                  ) : (
                    <Chip label="Not Assessed" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/students/${student.roll_no}`)}
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {students.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No students found
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default StudentList;
