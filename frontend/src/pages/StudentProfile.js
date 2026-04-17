import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Grid, Box, Chip, CircularProgress,
  Stack, Button, Avatar, Card, CardContent, TextField, MenuItem,
  LinearProgress, Alert, Divider,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Call as CallIcon,
  Email as EmailIcon,
  Campaign as CampaignIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  WarningAmber as WarningAmberIcon,
  School as SchoolIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Insights as InsightsIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, Legend,
} from 'recharts';
import { getStudentById, getPredictionHistory, updateStudent, publishMeetingNotice, deleteStudent } from '../services/api';

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

const getAttendanceColor = (val) => {
  const n = Number(val);
  if (!val && val !== 0) return 'default';
  if (n >= 75) return 'success';
  if (n >= 50) return 'warning';
  return 'error';
};

const getMarksColor = (val) => {
  const n = Number(val);
  if (!val && val !== 0) return 'default';
  if (n >= 75) return 'success';
  if (n >= 50) return 'warning';
  return 'error';
};

const InfoBlock = ({ label, value, chip, chipColor }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.9, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>{label}</Typography>
    {chip
      ? <Chip label={value || 'â€”'} size="small" color={chipColor || 'default'} />
      : <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{value || 'â€”'}</Typography>
    }
  </Box>
);

const SectionCard = ({ icon, title, color = 'primary', children }) => (
  <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${color}.light`, color: `${color}.dark`, display: 'flex' }}>
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
    </Stack>
    {children}
  </Paper>
);

const StudentProfile = () => {
  const { studentId } = useParams();

  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);


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


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, historyRes] = await Promise.all([
        getStudentById(studentId),
        getPredictionHistory(studentId),
      ]);
      const s = studentRes.data.data;
      setStudent(s);
      setEditForm({
        student_name: s.student_name || '',
        attendance: s.attendance || 0,
        marks: s.marks || 0,
        income: s.income || '',
        gender: s.gender || '',
        parent_occupation: s.parent_occupation || '',
        location: s.location || '',
        student_phone: s.student_phone || '',
        parent_phone: s.parent_phone || '',
        parent_email: s.parent_email || '',
      });
      setHistory(historyRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateStudent(studentId, editForm);
      const updated = res?.data?.data || { ...student, ...editForm };
      setStudent(updated);
      setEditMode(false);
      toast.success('Student record updated successfully');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!student?.student_id) return;

    const confirmed = window.confirm(
      `Delete student ${student.student_name} (${student.student_id})? This also removes related database records.`
    );
    if (!confirmed) return;

    try {
      await deleteStudent(student.student_id);
      toast.success('Student deleted successfully');
      navigate('/students');
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
        student_id: studentId,
        meeting_type: notifyForm.meeting_type,
        description: notifyForm.description,
        meeting_date: new Date(notifyForm.meeting_date).toISOString(),
        status: notifyForm.status,
      });
      toast.success('Message published to student/parent portal.');
      setNotifyForm((p) => ({ ...p, description: '' }));
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to publish message.');
    } finally {
      setNotifying(false);
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
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning" action={<Button size="small" onClick={() => navigate('/students')}>Back to list</Button>}>
          Student not found.
        </Alert>
      </Container>
    );
  }

  const riskColor = student.dropout_risk === 'High' ? 'error' : student.dropout_risk === 'Low' ? 'success' : 'default';
  const attendanceColor = getAttendanceColor(student.attendance);
  const marksColor = getMarksColor(student.marks);

  const chartData = history.slice().reverse().map((rec) => ({
    date: new Date(rec.created_at).toLocaleDateString(),
    risk: Math.round(Number(rec.risk_score || 0) * 100),
    confidence: Math.round(Number(rec.confidence || 0) * 100),
  }));

  const studentPhone = student.student_phone || student.phone || student.contact_number || '';
  const parentPhone = student.parent_phone || student.guardian_phone || student.parent_contact || '';
  const parentEmail = student.parent_email || student.guardian_email || student.email || '';

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
      {/* Back + Refresh */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/students')}>
          Back to Students
        </Button>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={fetchData}>
            Refresh
          </Button>
          <Button startIcon={<DeleteIcon />} variant="outlined" color="error" size="small" onClick={handleDeleteStudent}>
            Delete
          </Button>
        </Stack>
      </Stack>

      {/* Hero Card */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 4,
          boxShadow: 3,
          background: student.dropout_risk === 'High'
            ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 60%, #fef9ff 100%)'
            : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 60%, #ecfdf5 100%)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Avatar
                sx={{
                  width: { xs: 64, sm: 80 }, height: { xs: 64, sm: 80 },
                  fontSize: { xs: 22, sm: 28 }, fontWeight: 800,
                  bgcolor: student.dropout_risk === 'High' ? 'error.light' : 'primary.light',
                  color: student.dropout_risk === 'High' ? 'error.dark' : 'primary.dark',
                  flexShrink: 0,
                }}
              >
                {getInitials(student.student_name)}
              </Avatar>
              <Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1, gap: 0.5 }}>
                  <Chip label={`Class ${student.class}`} size="small" color="primary" variant="outlined" />
                  <Chip label={`Roll ${student.roll_no}`} size="small" variant="outlined" />
                  {student.admission_year && (
                    <Chip label={`Batch ${student.admission_year}`} size="small" variant="outlined" />
                  )}
                  {student.gender && (
                    <Chip label={student.gender} size="small" variant="outlined" />
                  )}
                  {student.dropout_risk && (
                    <Chip
                      label={`${student.dropout_risk} Risk`}
                      size="small"
                      color={riskColor}
                      icon={student.dropout_risk === 'High' ? <WarningAmberIcon fontSize="small" /> : undefined}
                    />
                  )}
                </Stack>
                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, mb: 0.5, fontSize: { xs: '1.9rem', sm: '2.5rem' } }}>
                  {student.student_name}
                </Typography>
                <Typography color="text.secondary" variant="body1">{student.student_id}</Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Quick Stat Mini Cards */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={1.5}>
              {[
                { label: 'Attendance', value: student.attendance != null ? `${Number(student.attendance).toFixed(1)}%` : 'â€”', color: attendanceColor },
                { label: 'Marks', value: student.marks != null ? Number(student.marks).toFixed(1) : 'â€”', color: marksColor },
                { label: 'Risk Score', value: student.risk_score != null ? `${(Number(student.risk_score) * 100).toFixed(1)}%` : 'â€”', color: riskColor },
                { label: 'History', value: `${history.length} entries`, color: 'default' },
              ].map((m) => (
                <Grid item xs={6} key={m.label}>
                  <Card sx={{ borderRadius: 2.5, textAlign: 'center', boxShadow: 1 }}>
                    <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: `${m.color}.main`, fontSize: '1.4rem' }}>
                        {m.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Academic Details */}
        <Grid item xs={12} md={6} lg={4}>
          <SectionCard icon={<SchoolIcon fontSize="small" />} title="Academic Details" color="primary">
            <InfoBlock label="Attendance" value={student.attendance != null ? `${Number(student.attendance).toFixed(1)}%` : 'â€”'} chip chipColor={attendanceColor} />
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Number(student.attendance || 0))}
              color={attendanceColor}
              sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
            />
            <InfoBlock label="Marks" value={student.marks != null ? Number(student.marks).toFixed(1) : 'â€”'} chip chipColor={marksColor} />
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Number(student.marks || 0))}
              color={marksColor}
              sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
            />
            <InfoBlock label="Dropout Risk" value={student.dropout_risk || 'Not Assessed'} chip chipColor={riskColor} />
            <InfoBlock label="Risk Score" value={student.risk_score != null ? `${(Number(student.risk_score) * 100).toFixed(1)}%` : 'â€”'} />
            <InfoBlock label="Admission Year" value={student.admission_year} />
            <InfoBlock label="Date of Birth" value={student.date_of_birth || 'â€”'} />
          </SectionCard>
        </Grid>

        {/* Family Info */}
        <Grid item xs={12} md={6} lg={4}>
          <SectionCard icon={<FamilyRestroomIcon fontSize="small" />} title="Family & Background" color="secondary">
            <InfoBlock label="Gender" value={student.gender} />
            <InfoBlock label="Family Income" value={student.income} />
            <InfoBlock label="Parent Occupation" value={student.parent_occupation} />
            <InfoBlock label="Location" value={student.location} />
            <InfoBlock label="Student ID" value={student.student_id} />
            <InfoBlock label="Class" value={student.class} />
            <InfoBlock label="Roll Number" value={student.roll_no} />
          </SectionCard>
        </Grid>

        {/* Contact & Portal Message */}
        <Grid item xs={12} md={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'success.light', color: 'success.dark', display: 'flex' }}>
                <CallIcon fontSize="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Contact the Student</Typography>
            </Stack>

            <Stack spacing={1} sx={{ mb: 2.5 }}>
              <Button
                fullWidth variant="outlined" startIcon={<CallIcon />} size="small"
                href={studentPhone ? `tel:${studentPhone}` : undefined}
                disabled={!studentPhone}
              >
                {studentPhone ? `Call Student Â· ${studentPhone}` : 'Call Student (No number on record)'}
              </Button>
              <Button
                fullWidth variant="outlined" color="secondary" startIcon={<CallIcon />} size="small"
                href={parentPhone ? `tel:${parentPhone}` : undefined}
                disabled={!parentPhone}
              >
                {parentPhone ? `Call Parent Â· ${parentPhone}` : 'Call Parent (No number on record)'}
              </Button>
              <Button
                fullWidth variant="outlined" startIcon={<EmailIcon />} size="small"
                href={parentEmail ? `mailto:${parentEmail}` : undefined}
                disabled={!parentEmail}
              >
                {parentEmail ? `Email Parent Â· ${parentEmail}` : 'Email Parent (No email on record)'}
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Send Portal Message / Schedule Meeting
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  select label="Type" size="small" value={notifyForm.meeting_type} fullWidth
                  onChange={(e) => setNotifyForm((p) => ({ ...p, meeting_type: e.target.value }))}
                >
                  {MEETING_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField
                  select label="Status" size="small" value={notifyForm.status} fullWidth
                  onChange={(e) => setNotifyForm((p) => ({ ...p, status: e.target.value }))}
                >
                  {MEETING_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Stack>
              <TextField
                type="datetime-local" label="Date & Time" size="small" fullWidth
                value={notifyForm.meeting_date}
                onChange={(e) => setNotifyForm((p) => ({ ...p, meeting_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                multiline minRows={3} size="small" fullWidth label="Message for Student / Parent"
                value={notifyForm.description}
                onChange={(e) => setNotifyForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={`Example: Parent-teacher meeting for ${student.student_name} is scheduled on Friday at 10 AM.`}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained" startIcon={<CampaignIcon />}
                  disabled={notifying} onClick={handleNotify} size="small"
                >
                  {notifying ? 'Publishing...' : 'Publish to Portal'}
                </Button>
                <Button
                  variant="outlined" size="small" color="secondary"
                  onClick={() => setNotifyForm((p) => ({
                    ...p,
                    meeting_type: 'Parent Meeting',
                    description: `Parent-teacher meeting for ${student.student_name} to discuss attendance and academic progress.`,
                  }))}
                >
                  Auto-fill Parent Meeting
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Prediction History Chart */}
        {chartData.length > 0 && (
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'info.light', color: 'info.dark', display: 'flex' }}>
                  <InsightsIcon fontSize="small" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Dropout Risk Trend</Typography>
              </Stack>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <RechartTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} name="Risk Score" dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={2} name="Confidence" dot={{ r: 3 }} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Prediction History Log */}
        <Grid item xs={12} lg={chartData.length > 0 ? 4 : 12}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Prediction Log</Typography>
            {history.length > 0 ? (
              <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                {history.map((rec, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.5, borderRadius: 2,
                      bgcolor: rec.dropout_risk === 'High' ? 'error.light' : 'success.light',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Chip
                        label={rec.dropout_risk}
                        size="small"
                        color={rec.dropout_risk === 'High' ? 'error' : 'success'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(rec.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                    <Typography variant="body2">
                      Risk: {(Number(rec.risk_score || 0) * 100).toFixed(2)}%
                      {rec.confidence ? ` Â· Confidence: ${(Number(rec.confidence) * 100).toFixed(1)}%` : ''}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No prediction history available.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Edit Student Record */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Stack direction="row" alignItems="center" sx={{ mb: editMode ? 2 : 0 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'warning.light', color: 'warning.dark', display: 'flex' }}>
                  <EditIcon fontSize="small" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit Student Record</Typography>
              </Stack>
              {!editMode ? (
                <Button startIcon={<EditIcon />} onClick={() => setEditMode(true)} variant="outlined" size="small">
                  Edit
                </Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button startIcon={<SaveIcon />} variant="contained" size="small" disabled={saving} onClick={handleSave}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="text" size="small" onClick={() => setEditMode(false)}>Cancel</Button>
                </Stack>
              )}
            </Stack>

            {editMode && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth label="Student Name" value={editForm.student_name || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, student_name: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth label="Attendance %" type="number" value={editForm.attendance}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    onChange={(e) => setEditForm((p) => ({ ...p, attendance: parseFloat(e.target.value) }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth label="Marks" type="number" value={editForm.marks}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    onChange={(e) => setEditForm((p) => ({ ...p, marks: parseFloat(e.target.value) }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField select fullWidth label="Gender" value={editForm.gender || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}>
                    {GENDER_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField select fullWidth label="Income" value={editForm.income || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, income: e.target.value }))}>
                    {INCOME_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField select fullWidth label="Location" value={editForm.location || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}>
                    {LOCATION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Student Phone" value={editForm.student_phone || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, student_phone: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Parent Phone" value={editForm.parent_phone || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, parent_phone: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth label="Parent Email" value={editForm.parent_email || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, parent_email: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={5}>
                  <TextField select fullWidth label="Parent Occupation" value={editForm.parent_occupation || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, parent_occupation: e.target.value }))}>
                    {OCCUPATION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentProfile;
