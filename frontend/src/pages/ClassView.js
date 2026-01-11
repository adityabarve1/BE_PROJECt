import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Save, Edit, Refresh } from '@mui/icons-material';
import axios from 'axios';

const ClassView = () => {
  const [classValue, setClassValue] = useState('8th');
  const [admissionYear, setAdmissionYear] = useState('2026');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const classes = ['5th', '6th', '7th', '8th', '9th', '10th'];
  const years = ['2024', '2025', '2026', '2027'];

  const incomeOptions = ['Low', 'Medium', 'High'];
  const genderOptions = ['Male', 'Female'];
  const locationOptions = ['Rural', 'Urban', 'City'];
  const occupationOptions = ['Farmer', 'Labor', 'Small Business', 'Government Job', 'Private Job', 'Other'];

  useEffect(() => {
    fetchStudents();
  }, [classValue, admissionYear]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(
        `${API_URL}/students/class/${classValue}?admission_year=${admissionYear}`
      );
      setStudents(response.data.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (params) => {
    setSelectedStudent(params.row);
    setEditFormData({
      student_name: params.row.student_name,
      attendance: params.row.attendance || 0,
      marks: params.row.marks || 0,
      income: params.row.income,
      gender: params.row.gender,
      parent_occupation: params.row.parent_occupation,
      location: params.row.location
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.put(
        `${API_URL}/students/${selectedStudent.student_id}`,
        editFormData
      );
      
      // Refresh data
      await fetchStudents();
      setEditDialogOpen(false);
      setError('');
    } catch (err) {
      console.error('Error saving student:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const getRiskColor = (risk) => {
    if (!risk) return 'default';
    if (risk === 'High') return 'error';
    if (risk === 'Medium') return 'warning';
    return 'success';
  };

  const columns = [
    {
      field: 'student_id',
      headerName: 'Student ID',
      width: 130,
      headerClassName: 'header-bold'
    },
    {
      field: 'student_name',
      headerName: 'Student Name',
      width: 180,
      headerClassName: 'header-bold'
    },
    {
      field: 'roll_no',
      headerName: 'Roll No',
      width: 90,
      headerClassName: 'header-bold'
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 90
    },
    {
      field: 'attendance',
      headerName: 'Attendance %',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? `${params.value}%` : 'N/A'}
          size="small"
          color={params.value >= 75 ? 'success' : params.value >= 50 ? 'warning' : 'error'}
        />
      )
    },
    {
      field: 'marks',
      headerName: 'Average Marks',
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value ? params.value.toFixed(1) : 'N/A'}
          size="small"
          color={params.value >= 75 ? 'success' : params.value >= 50 ? 'warning' : 'error'}
        />
      )
    },
    {
      field: 'income',
      headerName: 'Income',
      width: 100
    },
    {
      field: 'parent_occupation',
      headerName: 'Parent Occupation',
      width: 150
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 100
    },
    {
      field: 'dropout_risk',
      headerName: 'Risk Level',
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Chip 
            label={params.value}
            size="small"
            color={getRiskColor(params.value)}
          />
        ) : (
          <Chip label="Not Predicted" size="small" variant="outlined" />
        )
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Class View & Edit
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchStudents}
          >
            Refresh
          </Button>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField
            select
            label="Class"
            value={classValue}
            onChange={(e) => setClassValue(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {classes.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Admission Year"
            value={admissionYear}
            onChange={(e) => setAdmissionYear(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ flex: 1 }} />
          
          <Chip 
            label={`Total Students: ${students.length}`}
            color="primary"
          />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={students}
              columns={columns}
              getRowId={(row) => row.student_id}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              onRowClick={handleRowClick}
              sx={{
                '& .header-bold': {
                  fontWeight: 'bold'
                },
                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer',
                  backgroundColor: 'action.hover'
                }
              }}
            />
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Click on any row to edit student details
        </Typography>
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} />
            Edit Student: {selectedStudent?.student_id}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Student Name"
              value={editFormData.student_name || ''}
              onChange={(e) => handleEditChange('student_name', e.target.value)}
              margin="normal"
            />

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Attendance %"
                type="number"
                value={editFormData.attendance || ''}
                onChange={(e) => handleEditChange('attendance', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />

              <TextField
                fullWidth
                label="Average Marks"
                type="number"
                value={editFormData.marks || ''}
                onChange={(e) => handleEditChange('marks', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Stack>

            <TextField
              select
              fullWidth
              label="Gender"
              value={editFormData.gender || ''}
              onChange={(e) => handleEditChange('gender', e.target.value)}
              margin="normal"
            >
              {genderOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Income Level"
              value={editFormData.income || ''}
              onChange={(e) => handleEditChange('income', e.target.value)}
              margin="normal"
            >
              {incomeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Parent Occupation"
              value={editFormData.parent_occupation || ''}
              onChange={(e) => handleEditChange('parent_occupation', e.target.value)}
              margin="normal"
            >
              {occupationOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Location"
              value={editFormData.location || ''}
              onChange={(e) => handleEditChange('location', e.target.value)}
              margin="normal"
            >
              {locationOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassView;
