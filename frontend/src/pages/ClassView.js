import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Chip,
  Divider,
  Snackbar,
  Grid,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Save,
  Edit,
  Refresh,
  Campaign,
  DeleteOutline,
  Visibility,
  Call,
  Email,
  Groups,
  WarningAmber,
  Insights,
} from '@mui/icons-material';
import { deleteTeacherPublication, getTeacherPublications, getTeacherPublicationSummary, publishMeetingNotice } from '../services/api';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, Legend } from 'recharts';

const ClassView = () => {
  const [classValue, setClassValue] = useState('8th');
  const [admissionYear, setAdmissionYear] = useState('2026');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deletingPublicationId, setDeletingPublicationId] = useState(null);
  const [publishStatus, setPublishStatus] = useState(null);
  const [teacherFeed, setTeacherFeed] = useState([]);
  const [teacherSummary, setTeacherSummary] = useState(null);
  const [commForm, setCommForm] = useState({
    scope: 'class',
    student_id: '',
    meeting_type: 'Class Follow-up',
    description: '',
    meeting_date: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    status: 'Scheduled',
  });

  const classes = ['5th', '6th', '7th', '8th', '9th', '10th'];
  const years = ['2024', '2025', '2026', '2027'];

  const incomeOptions = ['Low', 'Medium', 'High'];
  const genderOptions = ['Male', 'Female'];
  const locationOptions = ['Rural', 'Urban', 'City'];
  const occupationOptions = ['Farmer', 'Labor', 'Small Business', 'Government Job', 'Private Job', 'Other'];
  const scopeOptions = [
    { value: 'all', label: 'All Students' },
    { value: 'class', label: 'Selected Class' },
    { value: 'student', label: 'Particular Student' },
  ];
  const meetingTypes = ['Class Follow-up', 'Parent Meeting', 'Academic Alert', 'General Notice', 'Counselling Support'];
  const meetingStatuses = ['Scheduled', 'Rescheduled', 'Completed', 'Cancelled'];
  const teacherId = localStorage.getItem('teacher_id');


  const formatDateTime = (rawValue) => {
    if (!rawValue) return '-';
    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return rawValue;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getContactValue = (student, keys) => {
    if (!student) return '';
    for (const key of keys) {
      const value = student[key];
      if (value && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  };


  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(
        `${API_URL}/students/class/${classValue}?admission_year=${admissionYear}`
      );
      setStudents(response.data.data || []);

      if (teacherId) {
        const [publications, summary] = await Promise.all([
          getTeacherPublications(teacherId, 20),
          getTeacherPublicationSummary(teacherId, 2000),
        ]);
        setTeacherFeed(publications.data.data || []);
        setTeacherSummary(summary.data.data || null);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [admissionYear, classValue, teacherId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleRowClick = (params) => {
    setSelectedStudent(params.row);
    setDetailDialogOpen(true);
  };

  const handleOpenEditDialog = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      student_name: student.student_name,
      attendance: student.attendance || 0,
      marks: student.marks || 0,
      income: student.income,
      gender: student.gender,
      parent_occupation: student.parent_occupation,
      location: student.location
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
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
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

  const handleCommFieldChange = (field, value) => {
    setCommForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuickNotifyStudent = (studentId) => {
    setCommForm((prev) => ({
      ...prev,
      scope: 'student',
      student_id: studentId,
    }));
  };

  const handlePublishCommunication = async () => {
    if (!teacherId) {
      setPublishStatus({ severity: 'error', message: 'Teacher session missing. Please login again.' });
      return;
    }

    if (!commForm.description.trim()) {
      setPublishStatus({ severity: 'error', message: 'Please enter message/description.' });
      return;
    }

    if (commForm.scope === 'student' && !commForm.student_id) {
      setPublishStatus({ severity: 'error', message: 'Please select a student for student scope.' });
      return;
    }

    setPublishLoading(true);

    try {
      const payload = {
        scope: commForm.scope,
        teacher_id: teacherId,
        meeting_type: commForm.meeting_type,
        description: commForm.description,
        meeting_date: new Date(commForm.meeting_date).toISOString(),
        status: commForm.status,
      };

      if (commForm.scope === 'student') {
        payload.student_id = commForm.student_id;
      }

      if (commForm.scope === 'class') {
        payload.class = classValue;
        payload.admission_year = Number(admissionYear);
      }

      const response = await publishMeetingNotice(payload);
      const count = response.data?.data?.published_count || 0;

      setPublishStatus({ severity: 'success', message: `Published successfully for ${count} student(s).` });
      setCommForm((prev) => ({
        ...prev,
        description: '',
        scope: prev.scope === 'student' ? 'class' : prev.scope,
      }));

      const [publications, summary] = await Promise.all([
        getTeacherPublications(teacherId, 20),
        getTeacherPublicationSummary(teacherId, 2000),
      ]);
      setTeacherFeed(publications.data.data || []);
      setTeacherSummary(summary.data.data || null);
      await fetchStudents();
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to publish communication.';
      setPublishStatus({ severity: 'error', message });
    } finally {
      setPublishLoading(false);
    }
  };

  const handleDeletePublication = async (publicationId) => {
    if (!teacherId || !publicationId) return;

    try {
      setDeletingPublicationId(publicationId);
      await deleteTeacherPublication(teacherId, publicationId);
      setPublishStatus({ severity: 'success', message: 'Publication deleted successfully.' });

      const [publications, summary] = await Promise.all([
        getTeacherPublications(teacherId, 20),
        getTeacherPublicationSummary(teacherId, 2000),
      ]);
      setTeacherFeed(publications.data.data || []);
      setTeacherSummary(summary.data.data || null);
    } catch (err) {
      setPublishStatus({
        severity: 'error',
        message: err?.response?.data?.error || 'Failed to delete publication.',
      });
    } finally {
      setDeletingPublicationId(null);
    }
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
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 280,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Visibility fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedStudent(params.row);
              setDetailDialogOpen(true);
            }}
          >
            Details
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              handleOpenEditDialog(params.row);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Campaign fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              handleQuickNotifyStudent(params.row.student_id);
            }}
          >
            Notify
          </Button>
        </Stack>
      )
    }
  ];

  const classInsights = useMemo(() => {
    const total = students.length;
    const highRisk = students.filter((s) => s.dropout_risk === 'High').length;
    const avgAttendance = total
      ? students.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / total
      : 0;
    const avgMarks = total
      ? students.reduce((sum, s) => sum + Number(s.marks || 0), 0) / total
      : 0;

    const chart = students
      .slice()
      .sort((a, b) => (a.roll_no || 0) - (b.roll_no || 0))
      .map((s) => ({
        name: `R${s.roll_no}`,
        attendance: Number(s.attendance || 0),
        marks: Number(s.marks || 0),
      }));

    return {
      total,
      highRisk,
      avgAttendance,
      avgMarks,
      chart,
      riskPercent: total ? Math.round((highRisk / total) * 100) : 0,
    };
  }, [students]);

  const studentPhone = getContactValue(selectedStudent, ['student_phone', 'phone', 'contact_number']);
  const parentPhone = getContactValue(selectedStudent, ['parent_phone', 'guardian_phone', 'parent_contact']);
  const parentEmail = getContactValue(selectedStudent, ['parent_email', 'guardian_email', 'email']);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          background: 'linear-gradient(160deg, #f7fbff 0%, #eef5ff 52%, #fefefe 100%)',
        }}
      >
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

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
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

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Groups fontSize="small" color="primary" />
                  <Typography variant="body2" color="text.secondary">Class Size</Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{classInsights.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <WarningAmber fontSize="small" color="warning" />
                  <Typography variant="body2" color="text.secondary">High Risk</Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 700, color: classInsights.highRisk > 0 ? 'error.main' : 'text.primary' }}>
                  {classInsights.highRisk}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={classInsights.riskPercent}
                  color={classInsights.riskPercent > 30 ? 'error' : 'primary'}
                  sx={{ mt: 1, height: 6, borderRadius: 6 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Insights fontSize="small" color="success" />
                  <Typography variant="body2" color="text.secondary">Avg Attendance</Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{classInsights.avgAttendance.toFixed(1)}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Insights fontSize="small" color="info" />
                  <Typography variant="body2" color="text.secondary">Avg Marks</Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{classInsights.avgMarks.toFixed(1)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Class Performance Trend</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Attendance and marks by roll number for quick spotting of students who need support.
          </Typography>
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={classInsights.chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <RechartTooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#1976d2" strokeWidth={2} dot={false} name="Attendance %" />
                <Line type="monotone" dataKey="marks" stroke="#2e7d32" strokeWidth={2} dot={false} name="Marks" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Class Communication Actions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Publish meeting and follow-up updates for all students, selected class, or a particular student. Students and parents will see this in their portal.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              label="Scope"
              value={commForm.scope}
              onChange={(e) => handleCommFieldChange('scope', e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {scopeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Type"
              value={commForm.meeting_type}
              onChange={(e) => handleCommFieldChange('meeting_type', e.target.value)}
              sx={{ minWidth: 220 }}
            >
              {meetingTypes.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={commForm.status}
              onChange={(e) => handleCommFieldChange('status', e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {meetingStatuses.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Meeting Date"
              type="datetime-local"
              value={commForm.meeting_date}
              onChange={(e) => handleCommFieldChange('meeting_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
          </Stack>

          {commForm.scope === 'student' && (
            <TextField
              select
              fullWidth
              label="Select Student"
              value={commForm.student_id}
              onChange={(e) => handleCommFieldChange('student_id', e.target.value)}
              sx={{ mb: 2 }}
            >
              {students.map((student) => (
                <MenuItem key={student.student_id} value={student.student_id}>
                  {student.student_id} - {student.student_name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Message / Follow-up Notes"
            value={commForm.description}
            onChange={(e) => handleCommFieldChange('description', e.target.value)}
            placeholder="Example: Parent-teacher meeting for attendance improvement is scheduled on Friday at 11 AM."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={publishLoading ? <CircularProgress size={18} color="inherit" /> : <Campaign />}
              onClick={handlePublishCommunication}
              disabled={publishLoading}
            >
              {publishLoading ? 'Publishing...' : 'Publish To Portal'}
            </Button>
            <Button
              variant="text"
              onClick={() => setCommForm((prev) => ({
                ...prev,
                description: '',
                student_id: '',
                scope: 'class',
              }))}
            >
              Reset
            </Button>
          </Stack>

          {publishStatus && (
            <Alert severity={publishStatus.severity} sx={{ mt: 2 }}>
              {publishStatus.message}
            </Alert>
          )}

          <Divider sx={{ my: 2.5 }} />

          {teacherSummary && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Total Published</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{teacherSummary.total_published}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Acknowledged</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{teacherSummary.acknowledged_count}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Pending Acknowledgement</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>{teacherSummary.pending_ack_count}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Acknowledgement Rate</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{teacherSummary.acknowledgement_rate}%</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Recent Published Updates
          </Typography>

          <Box sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5 }}>
            <Stack spacing={1}>
              {teacherFeed.length > 0 ? teacherFeed.slice(0, 20).map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    <Chip size="small" label={item.meeting_type || 'Follow-up'} color="primary" />
                    <Chip size="small" label={item.status || 'Scheduled'} />
                    <Chip size="small" label={`Scope: ${item.scope || 'student'}`} />
                    <Typography variant="body2" color="text.secondary">Audience: {item.audience || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">Targets: {item.target_count || 1}</Typography>
                    <Typography variant="body2" color="text.secondary">Acknowledged: {item.acknowledged_count || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">When: {formatDateTime(item.meeting_date)}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Delete this publication">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePublication(item.publication_id || item.id)}
                          disabled={deletingPublicationId === (item.publication_id || item.id)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 1 }}>{item.description}</Typography>
                </Paper>
              )) : (
                <Typography variant="body2" color="text.secondary">No communications published yet.</Typography>
              )}
            </Stack>
          </Box>
        </Paper>

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
          Click a row or Details to open full student information and contact options
        </Typography>
      </Paper>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Student Details: {selectedStudent?.student_name || '-'} ({selectedStudent?.student_id || '-'})
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Academic Snapshot</Typography>
                <Typography variant="body2">Roll No: {selectedStudent?.roll_no ?? '-'}</Typography>
                <Typography variant="body2">Class: {selectedStudent?.class ?? classValue}</Typography>
                <Typography variant="body2">Attendance: {selectedStudent?.attendance ?? '-'}%</Typography>
                <Typography variant="body2">Marks: {selectedStudent?.marks ?? '-'}</Typography>
                <Typography variant="body2">Risk: {selectedStudent?.dropout_risk || 'Not Predicted'}</Typography>
                <Typography variant="body2">Risk Score: {selectedStudent?.risk_score ?? '-'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Family and Background</Typography>
                <Typography variant="body2">Gender: {selectedStudent?.gender || '-'}</Typography>
                <Typography variant="body2">Income: {selectedStudent?.income || '-'}</Typography>
                <Typography variant="body2">Parent Occupation: {selectedStudent?.parent_occupation || '-'}</Typography>
                <Typography variant="body2">Location: {selectedStudent?.location || '-'}</Typography>
                <Typography variant="body2">Admission Year: {selectedStudent?.admission_year || admissionYear}</Typography>
                <Typography variant="body2">DOB: {selectedStudent?.date_of_birth || '-'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Contact and Follow-up Actions</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Call />}
                    href={studentPhone ? `tel:${studentPhone}` : undefined}
                    disabled={!studentPhone}
                  >
                    Call Student {studentPhone ? `(${studentPhone})` : '(Not Available)'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Call />}
                    href={parentPhone ? `tel:${parentPhone}` : undefined}
                    disabled={!parentPhone}
                  >
                    Call Parent {parentPhone ? `(${parentPhone})` : '(Not Available)'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    href={parentEmail ? `mailto:${parentEmail}` : undefined}
                    disabled={!parentEmail}
                  >
                    Email Parent
                  </Button>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={<Campaign />}
                    onClick={() => {
                      handleQuickNotifyStudent(selectedStudent?.student_id || '');
                      setDetailDialogOpen(false);
                    }}
                  >
                    Send Portal Message
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      handleQuickNotifyStudent(selectedStudent?.student_id || '');
                      handleCommFieldChange('meeting_type', 'Parent Meeting');
                      handleCommFieldChange('description', `Parent meeting request for ${selectedStudent?.student_name || 'student'} regarding attendance and progress.`);
                      setDetailDialogOpen(false);
                    }}
                  >
                    Schedule Parent Meeting
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      handleOpenEditDialog(selectedStudent);
                    }}
                  >
                    Edit Student Record
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

      <Snackbar
        open={Boolean(publishStatus)}
        autoHideDuration={3000}
        onClose={() => setPublishStatus(null)}
      />
    </Container>
  );
};

export default ClassView;
