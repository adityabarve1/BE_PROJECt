import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { CloudUpload, CheckCircle, Error } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const DocumentUpload = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('admission');
  const [classValue, setClassValue] = useState('8th');
  const [admissionYear, setAdmissionYear] = useState('2026');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const classes = ['5th', '6th', '7th', '8th', '9th', '10th'];
  const years = ['2024', '2025', '2026', '2027'];
  const documentTypes = [
    { value: 'admission', label: 'Admission Document (Create Profiles)' },
    { value: 'attendance', label: 'Attendance Sheet (Update Attendance)' },
    { value: 'results', label: 'Results Sheet (Update Marks)' }
  ];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('class', classValue);
    formData.append('admission_year', admissionYear);
    formData.append('teacher_id', user.id);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const endpoint = `${API_URL}/documents/upload/${documentType}`;
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setResult(response.data);
      setSelectedFile(null);
      
      // Reset file input
      document.getElementById('file-input').value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getResultMessage = () => {
    if (!result) return null;

    if (documentType === 'admission') {
      return `Successfully created ${result.data.students_created} student profiles`;
    } else if (documentType === 'attendance') {
      return `Successfully updated attendance for ${result.data.students_updated} students`;
    } else if (documentType === 'results') {
      return `Successfully updated marks for ${result.data.students_updated} students`;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload Document
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload Excel documents to create student profiles or update their attendance and marks
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <TextField
            select
            fullWidth
            label="Document Type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            margin="normal"
          >
            {documentTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              select
              label="Class"
              value={classValue}
              onChange={(e) => setClassValue(e.target.value)}
              sx={{ flex: 1 }}
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
              sx={{ flex: 1 }}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Box>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: selectedFile ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: selectedFile ? 'action.hover' : 'background.paper',
            mb: 2
          }}
        >
          <input
            type="file"
            id="file-input"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <label htmlFor="file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              size="large"
            >
              Choose Excel File
            </Button>
          </label>

          {selectedFile && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={selectedFile.name}
                color="primary"
                onDelete={() => {
                  setSelectedFile(null);
                  document.getElementById('file-input').value = '';
                }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}
        </Box>

        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" icon={<Error />} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && result.success && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
            {getResultMessage()}
            {result.data.errors && result.data.errors.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" display="block">
                  Errors: {result.data.errors.join(', ')}
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Required Excel Format:
          </Typography>
          <Typography variant="caption" component="div">
            • <strong>Admission:</strong> Name, Roll No, Admission Year, Gender, Income, Parent Occupation, Location
          </Typography>
          <Typography variant="caption" component="div">
            • <strong>Attendance:</strong> Roll No, Student Name, Attendance (%)
          </Typography>
          <Typography variant="caption" component="div">
            • <strong>Results:</strong> Roll No, Student Name, Subject columns (Marathi, English, etc.)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DocumentUpload;
