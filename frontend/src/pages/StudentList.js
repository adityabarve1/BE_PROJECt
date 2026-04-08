import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Button, TextField, MenuItem,
  Stack, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Grid, InputAdornment, Card, CardContent,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Avatar, IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Campaign as CampaignIcon,
  Call as CallIcon,
  Email as EmailIcon,
  Groups as GroupsIcon,
  WarningAmber as WarningAmberIcon,
  Insights as InsightsIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAllStudents, publishMeetingNotice, updateStudent, deleteStudent } from '../services/api';
import { toast } from 'react-toastify';

const MEETING_TYPES = ['Class Follow-up', 'Parent Meeting', 'Academic Alert', 'General Notice', 'Counselling Support'];
const MEETING_STATUSES = ['Scheduled', 'Rescheduled', 'Completed', 'Cancelled'];
const INCOME_OPTIONS = ['Low', 'Medium', 'High'];
const GENDER_OPTIONS = ['Male', 'Female'];
const LOCATION_OPTIONS = ['Rural', 'Urban', 'City'];
const OCCUPATION_OPTIONS = ['Farmer', 'Labor', 'Small Business', 'Government Job', 'Private Job', 'Other'];

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getRiskColor = (risk) => {
  if (risk === 'High') return 'error';
  if (risk === 'Low') return 'success';
  return 'default';
};

const getAttendanceColor = (val) => {
  const n = Number(val);
  if (!val) return 'default';
  if (n >= 75) return 'success';
  if (n >= 50) return 'warning';
  return 'error';
};

const getMarksColor = (val) => {
  const n = Number(val);
  if (!val) return 'default';
  if (n >= 75) return 'success';
  if (n >= 50) return 'warning';
  return 'error';
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{value || '—'}</Typography>
  </Box>
);

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);


  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);


  const [notifyForm, setNotifyForm] = useState({
    meeting_type: 'Class Follow-up',
    description: '',
    meeting_date: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    status: 'Scheduled',
  });
  const [notifying, setNotifying] = useState(false);

  const teacherId = localStorage.getItem('teacher_id');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllStudents(500);
      setStudents(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const classOptions = useMemo(() => {
    const cls = [...new Set(students.map((s) => s.class).filter(Boolean))].sort();
    return ['All', ...cls];
  }, [students]);

  const filtered = useMemo(() => students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q) ||
      String(s.roll_no || '').includes(q);
    const matchClass = classFilter === 'All' || s.class === classFilter;
    const matchRisk = riskFilter === 'All' || s.dropout_risk === riskFilter;
    return matchSearch && matchClass && matchRisk;
  }), [students, search, classFilter, riskFilter]);

  const stats = useMemo(() => {
    const total = students.length;
    const highRisk = students.filter((s) => s.dropout_risk === 'High').length;
    const avgAtt = total ? students.reduce((a, s) => a + Number(s.attendance || 0), 0) / total : 0;
    const avgMarks = total ? students.reduce((a, s) => a + Number(s.marks || 0), 0) / total : 0;
    return { total, highRisk, avgAtt, avgMarks };
  }, [students]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const openDetail = (student) => {
    setSelectedStudent(student);
    setEditForm({
      student_name: student.student_name || '',
      attendance: student.attendance || 0,
      marks: student.marks || 0,
      income: student.income || '',
      gender: student.gender || '',
      parent_occupation: student.parent_occupation || '',
      location: student.location || '',
      student_phone: student.student_phone || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
    });
    setEditMode(false);
    setNotifyForm((prev) => ({ ...prev, description: '' }));
    setDetailOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      await updateStudent(selectedStudent.student_id, editForm);
      toast.success('Student updated successfully');
      setEditMode(false);
      setSelectedStudent((prev) => ({ ...prev, ...editForm }));
      setStudents((prev) => prev.map((s) =>
        s.student_id === selectedStudent.student_id ? { ...s, ...editForm } : s
      ));
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (studentToDelete) => {
    if (!studentToDelete?.student_id) return;

    const confirmed = window.confirm(
      `Delete student ${studentToDelete.student_name} (${studentToDelete.student_id})? This also removes related data from database.`
    );
    if (!confirmed) return;

    try {
      await deleteStudent(studentToDelete.student_id);
      toast.success('Student deleted successfully');
      setStudents((prev) => prev.filter((s) => s.student_id !== studentToDelete.student_id));

      if (selectedStudent?.student_id === studentToDelete.student_id) {
        setDetailOpen(false);
        setSelectedStudent(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete student');
    }
  };

  const handleNotify = async () => {
    if (!teacherId) { toast.error('Teacher session missing. Please login again.'); return; }
    if (!notifyForm.description.trim()) { toast.error('Please enter a message.'); return; }
    setNotifying(true);
    try {
      await publishMeetingNotice({
        scope: 'student',
        teacher_id: teacherId,
        student_id: selectedStudent.student_id,
        meeting_type: notifyForm.meeting_type,
        description: notifyForm.description,
        meeting_date: new Date(notifyForm.meeting_date).toISOString(),
        status: notifyForm.status,
      });
      toast.success('Message published to student portal.');
      setNotifyForm((prev) => ({ ...prev, description: '' }));
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to publish message.');
    } finally {
      setNotifying(false);
    }
  };

  const studentPhone = selectedStudent ? (selectedStudent.student_phone || selectedStudent.phone || selectedStudent.contact_number || '') : '';
  const parentPhone = selectedStudent ? (selectedStudent.parent_phone || selectedStudent.guardian_phone || selectedStudent.parent_contact || '') : '';
  const parentEmail = selectedStudent ? (selectedStudent.parent_email || selectedStudent.guardian_email || selectedStudent.email || '') : '';

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>All Students</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and contact every student. Click a row or the Details button to open full info.
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} variant="outlined" sx={{ mt: { xs: 1.5, sm: 0 } }} onClick={fetchStudents}>
          Refresh
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <GroupsIcon />, label: 'Total Students', value: stats.total, color: 'primary' },
          { icon: <WarningAmberIcon />, label: 'High Risk', value: stats.highRisk, color: 'error' },
          { icon: <InsightsIcon />, label: 'Avg Attendance', value: `${stats.avgAtt.toFixed(1)}%`, color: 'success' },
          { icon: <InsightsIcon />, label: 'Avg Marks', value: stats.avgMarks.toFixed(1), color: 'info' },
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.light`, color: `${stat.color}.dark`, display: 'flex' }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search + Filter */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            placeholder="Search by name, Student ID or roll number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 220 }}
            size="small"
          />
          <TextField
            select label="Class" value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(0); }}
            size="small" sx={{ minWidth: 120 }}
          >
            {classOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField
            select label="Risk Level" value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
            size="small" sx={{ minWidth: 140 }}
          >
            {['All', 'High', 'Low'].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {filtered.length} of {students.length}
          </Typography>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', fontSize: '0.82rem' } }}>
                <TableCell sx={{ width: 40 }}>#</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Class / Roll</TableCell>
                <TableCell>Attendance</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Parent Phone</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Income</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Parent Occupation</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">No students found</Typography>
                  </TableCell>
                </TableRow>
              )}
              {paged.map((student, idx) => (
                <TableRow
                  key={student.student_id}
                  hover
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => openDetail(student)}
                >
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{page * rowsPerPage + idx + 1}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 36, height: 36, fontSize: 13, fontWeight: 700,
                          bgcolor: student.dropout_risk === 'High' ? 'error.light' : 'primary.light',
                          color: student.dropout_risk === 'High' ? 'error.dark' : 'primary.dark',
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(student.student_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {student.student_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{student.student_id}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.class || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">Roll {student.roll_no}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.attendance != null ? `${Number(student.attendance).toFixed(1)}%` : 'N/A'}
                      size="small"
                      color={getAttendanceColor(student.attendance)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.marks != null ? Number(student.marks).toFixed(1) : 'N/A'}
                      size="small"
                      color={getMarksColor(student.marks)}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant="body2">{student.parent_phone || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2">{student.income || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2">{student.location || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student.parent_occupation || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {student.dropout_risk
                      ? <Chip label={student.dropout_risk} size="small" color={getRiskColor(student.dropout_risk)} />
                      : <Chip label="N/A" size="small" variant="outlined" />
                    }
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button
                        size="small" variant="outlined"
                        startIcon={<PersonIcon fontSize="small" />}
                        onClick={() => openDetail(student)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Details
                      </Button>
                      <Tooltip title="Open Full Profile">
                        <IconButton size="small" color="primary"
                          onClick={() => navigate(`/students/${student.student_id}`)}>
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Student">
                        <IconButton size="small" color="error"
                          onClick={() => handleDeleteStudent(student)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Student Detail Dialog */}
      {selectedStudent && (
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth scroll="paper">
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 44, height: 44, fontWeight: 700,
                  bgcolor: selectedStudent.dropout_risk === 'High' ? 'error.light' : 'primary.light',
                  color: selectedStudent.dropout_risk === 'High' ? 'error.dark' : 'primary.dark',
                }}
              >
                {getInitials(selectedStudent.student_name)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {selectedStudent.student_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedStudent.student_id} · Class {selectedStudent.class} · Roll {selectedStudent.roll_no}
                </Typography>
              </Box>
              <Chip
                label={selectedStudent.dropout_risk || 'Not Assessed'}
                color={getRiskColor(selectedStudent.dropout_risk)}
                size="small"
              />
              <Tooltip title="Open Full Profile Page">
                <IconButton size="small" onClick={() => navigate(`/students/${selectedStudent.student_id}`)}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Student">
                <IconButton size="small" color="error" onClick={() => handleDeleteStudent(selectedStudent)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setDetailOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent dividers>
            <Grid container spacing={2}>
              {/* Academic Snapshot */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                    Academic Details
                  </Typography>
                  <InfoRow label="Attendance" value={selectedStudent.attendance != null ? `${Number(selectedStudent.attendance).toFixed(1)}%` : '—'} />
                  {selectedStudent.attendance != null && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, Number(selectedStudent.attendance || 0))}
                      color={getAttendanceColor(selectedStudent.attendance)}
                      sx={{ mb: 1, height: 6, borderRadius: 3 }}
                    />
                  )}
                  <InfoRow label="Marks" value={selectedStudent.marks != null ? Number(selectedStudent.marks).toFixed(1) : '—'} />
                  {selectedStudent.marks != null && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, Number(selectedStudent.marks || 0))}
                      color={getMarksColor(selectedStudent.marks)}
                      sx={{ mb: 1, height: 6, borderRadius: 3 }}
                    />
                  )}
                  <InfoRow label="Dropout Risk" value={selectedStudent.dropout_risk || 'Not Assessed'} />
                  <InfoRow label="Risk Score" value={selectedStudent.risk_score != null ? `${(Number(selectedStudent.risk_score) * 100).toFixed(1)}%` : '—'} />
                  <InfoRow label="Admission Year" value={selectedStudent.admission_year} />
                  <InfoRow label="Date of Birth" value={selectedStudent.date_of_birth || '—'} />
                </Paper>
              </Grid>

              {/* Family Info */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'secondary.main' }}>
                    Family & Background
                  </Typography>
                  <InfoRow label="Gender" value={selectedStudent.gender} />
                  <InfoRow label="Family Income" value={selectedStudent.income} />
                  <InfoRow label="Parent Occupation" value={selectedStudent.parent_occupation} />
                  <InfoRow label="Location" value={selectedStudent.location} />
                  <InfoRow label="Admission Year" value={selectedStudent.admission_year} />
                  <InfoRow label="Student ID" value={selectedStudent.student_id} />
                </Paper>
              </Grid>

              {/* Contact Actions */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Contact Actions
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                    <Button
                      variant="outlined" size="small" startIcon={<CallIcon />}
                      href={studentPhone ? `tel:${studentPhone}` : undefined}
                      disabled={!studentPhone}
                    >
                      Call Student{studentPhone ? ` · ${studentPhone}` : ' (No number)'}
                    </Button>
                    <Button
                      variant="outlined" size="small" color="secondary" startIcon={<CallIcon />}
                      href={parentPhone ? `tel:${parentPhone}` : undefined}
                      disabled={!parentPhone}
                    >
                      Call Parent{parentPhone ? ` · ${parentPhone}` : ' (No number)'}
                    </Button>
                    <Button
                      variant="outlined" size="small" startIcon={<EmailIcon />}
                      href={parentEmail ? `mailto:${parentEmail}` : undefined}
                      disabled={!parentEmail}
                    >
                      Email Parent{parentEmail ? ` · ${parentEmail}` : ' (No email)'}
                    </Button>
                  </Stack>

                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                    Send Portal Message / Schedule Meeting
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                    <TextField
                      select label="Type" size="small" value={notifyForm.meeting_type}
                      onChange={(e) => setNotifyForm((p) => ({ ...p, meeting_type: e.target.value }))}
                      sx={{ minWidth: 180 }}
                    >
                      {MEETING_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                    <TextField
                      select label="Status" size="small" value={notifyForm.status}
                      onChange={(e) => setNotifyForm((p) => ({ ...p, status: e.target.value }))}
                      sx={{ minWidth: 140 }}
                    >
                      {MEETING_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                    <TextField
                      type="datetime-local" label="Date & Time" size="small"
                      value={notifyForm.meeting_date}
                      onChange={(e) => setNotifyForm((p) => ({ ...p, meeting_date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 200, flex: 1 }}
                    />
                  </Stack>
                  <TextField
                    fullWidth multiline minRows={2} size="small" label="Message / Notes"
                    value={notifyForm.description}
                    onChange={(e) => setNotifyForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder={`Example: Parent meeting for ${selectedStudent.student_name} scheduled on Friday at 10 AM.`}
                    sx={{ mb: 1 }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="contained" size="small" startIcon={<CampaignIcon />}
                      disabled={notifying} onClick={handleNotify}
                    >
                      {notifying ? 'Publishing...' : 'Publish to Portal'}
                    </Button>
                    <Button
                      variant="outlined" size="small" color="secondary"
                      onClick={() => setNotifyForm((p) => ({
                        ...p,
                        meeting_type: 'Parent Meeting',
                        description: `Parent-teacher meeting request for ${selectedStudent.student_name} regarding attendance and academic progress.`,
                      }))}
                    >
                      Auto-fill Parent Meeting
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              {/* Quick Edit */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" sx={{ mb: editMode ? 2 : 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Edit Student Record</Typography>
                    {!editMode ? (
                      <Button size="small" startIcon={<EditIcon />} onClick={() => setEditMode(true)} variant="text">
                        Edit
                      </Button>
                    ) : (
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" size="small" startIcon={<SaveIcon />} disabled={saving} onClick={handleSaveEdit}>
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="text" size="small" onClick={() => setEditMode(false)}>Cancel</Button>
                      </Stack>
                    )}
                  </Stack>
                  {editMode && (
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Student Name" size="small" value={editForm.student_name || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, student_name: e.target.value }))} />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField fullWidth label="Attendance %" type="number" size="small" value={editForm.attendance}
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          onChange={(e) => setEditForm((p) => ({ ...p, attendance: parseFloat(e.target.value) }))} />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField fullWidth label="Marks" type="number" size="small" value={editForm.marks}
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          onChange={(e) => setEditForm((p) => ({ ...p, marks: parseFloat(e.target.value) }))} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth label="Gender" size="small" value={editForm.gender || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}>
                          {GENDER_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth label="Income" size="small" value={editForm.income || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, income: e.target.value }))}>
                          {INCOME_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth label="Location" size="small" value={editForm.location || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}>
                          {LOCATION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Student Phone" size="small" value={editForm.student_phone || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, student_phone: e.target.value }))} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Parent Phone" size="small" value={editForm.parent_phone || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, parent_phone: e.target.value }))} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Parent Email" size="small" value={editForm.parent_email || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, parent_email: e.target.value }))} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField select fullWidth label="Parent Occupation" size="small" value={editForm.parent_occupation || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, parent_occupation: e.target.value }))}>
                          {OCCUPATION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </TextField>
                      </Grid>
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
            <Button variant="contained" onClick={() => navigate(`/students/${selectedStudent.student_id}`)}>
              Open Full Profile
            </Button>
          </DialogActions>
        </Dialog>


      )}
    </Container>
  );
};

export default StudentList;
