import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  EventAvailable as EventAvailableIcon,
  Insights as InsightsIcon,
  School as SchoolIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'react-toastify';
import { usePortal } from '../contexts/PortalContext';
import { acknowledgeStudentMeeting } from '../services/api';

const MetricCard = ({ title, value, subtitle, color }) => (
  <Card sx={{ height: '100%', borderRadius: 4 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
    </CardContent>
  </Card>
);

const severityToColor = {
  high: 'error',
  medium: 'warning',
  info: 'info',
  success: 'success',
};

const FamilyPortalDashboard = ({ role }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { portalData, refreshPortalData, loading } = usePortal();
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('all');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('all');
  const [ackLoadingId, setAckLoadingId] = useState(null);

  // This view intentionally starts one polling loop for the mounted portal session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    refreshPortalData().catch(() => {
      toast.error(t('portal.refresh_failed'));
    });

    const timer = setInterval(() => {
      refreshPortalData().catch(() => {});
    }, 30000);

    return () => clearInterval(timer);
  }, [refreshPortalData, t]);

  const student = portalData?.student;
  const summary = portalData?.summary;
  const history = portalData?.prediction_history || [];
  const alerts = portalData?.alerts || [];
  const recommendations = portalData?.recommendations || [];
  const interventions = portalData?.interventions || [];
  const meetings = useMemo(() => portalData?.meetings || [], [portalData]);

  const unreadMeetings = useMemo(
    () => meetings.filter((meeting) => {
      const status = (meeting.status || '').toLowerCase();
      const outcome = (meeting.outcome || '').toLowerCase();
      return ['scheduled', 'rescheduled'].includes(status) && !outcome.includes('acknowledged');
    }),
    [meetings]
  );

  const filteredMeetings = useMemo(
    () => meetings.filter((meeting) => {
      const typeOk = meetingTypeFilter === 'all' || meeting.meeting_type === meetingTypeFilter;
      const statusOk = meetingStatusFilter === 'all' || meeting.status === meetingStatusFilter;
      return typeOk && statusOk;
    }),
    [meetings, meetingTypeFilter, meetingStatusFilter]
  );

  const meetingTypes = useMemo(
    () => ['all', ...Array.from(new Set(meetings.map((meeting) => meeting.meeting_type).filter(Boolean)))],
    [meetings]
  );

  const meetingStatuses = useMemo(
    () => ['all', ...Array.from(new Set(meetings.map((meeting) => meeting.status).filter(Boolean)))],
    [meetings]
  );

  const formatDateTime = (rawValue) => {
    if (!rawValue) return '-';
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return rawValue;
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleAcknowledge = async (meetingId) => {
    try {
      setAckLoadingId(meetingId);
      await acknowledgeStudentMeeting(student.student_id, {
        meeting_id: meetingId,
        acknowledged_by: role,
        note: role === 'parent' ? 'Parent has reviewed this communication.' : 'Student has reviewed this communication.',
      });
      await refreshPortalData();
      toast.success(t('portal.ack_success'));
    } catch (error) {
      toast.error(error?.response?.data?.error || t('portal.ack_failed'));
    } finally {
      setAckLoadingId(null);
    }
  };

  const chartData = history.slice(0, 8).reverse().map((entry) => ({
    date: new Date(entry.created_at).toLocaleDateString(),
    risk: Math.round((Number(entry.risk_score || 0) * 100)),
    confidence: Math.round((Number(entry.confidence || 0) * 100)),
  }));

  const statusChart = [
    { name: t('portal.attendance_label'), value: Number(summary?.attendance || 0), fill: theme.palette.primary.main },
    { name: t('portal.remaining_label'), value: Math.max(0, 100 - Number(summary?.attendance || 0)), fill: alpha(theme.palette.primary.main, 0.15) },
  ];

  if (!student || !summary) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        {loading ? <LinearProgress /> : <Alert severity="warning">{t('portal.no_portal_data')}</Alert>}
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, background: 'linear-gradient(180deg, rgba(219,234,254,0.5), rgba(240,253,250,0.85))' }}>
      <Container maxWidth="xl">
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            mb: 3,
            background: 'linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Chip label={role === 'parent' ? t('portal.parent_tab') : t('portal.student_tab')} color="primary" />
                <Chip label={`${t('portal.class_label')}: ${student.class || '-'}`} variant="outlined" />
                <Chip label={`${t('portal.roll_number')}: ${student.roll_no || '-'}`} variant="outlined" />
                <Chip label={`${t('portal.unread_updates')}: ${unreadMeetings.length}`} color={unreadMeetings.length > 0 ? 'warning' : 'default'} />
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {role === 'parent' ? t('portal.parent_welcome', { name: student.student_name }) : t('portal.student_welcome', { name: student.student_name })}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760 }}>
                {role === 'parent' ? t('portal.parent_summary_text') : t('portal.student_summary_text')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="body2" color="text.secondary">{t('portal.current_risk')}</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: summary.risk_label === 'High' ? theme.palette.error.main : theme.palette.success.main }}>
                  {summary.risk_label}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {t('portal.risk_score_value', { value: Math.round(Number(summary.risk_score || 0) * 100) })}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard title={t('portal.attendance_label')} value={`${summary.attendance}%`} subtitle={t('portal.attendance_hint')} color={theme.palette.primary.main} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard title={t('portal.marks_label')} value={summary.marks} subtitle={t('portal.marks_hint')} color={theme.palette.success.main} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard title={t('portal.interventions_label')} value={summary.active_interventions} subtitle={t('portal.interventions_hint')} color={theme.palette.warning.main} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard title={t('portal.meetings_label')} value={summary.upcoming_meetings} subtitle={t('portal.meetings_hint')} color={theme.palette.secondary.main} />
          </Grid>

          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <InsightsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.risk_trend')}</Typography>
              </Stack>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="risk" stroke={theme.palette.error.main} strokeWidth={3} name={t('portal.risk_line')} />
                    <Line type="monotone" dataKey="confidence" stroke={theme.palette.primary.main} strokeWidth={2} name={t('portal.confidence_line')} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.attendance_view')}</Typography>
              </Stack>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChart} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={1} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('portal.attendance_target')}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <WarningAmberIcon color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.alerts_title')}</Typography>
              </Stack>
              <Stack spacing={1.5}>
                {alerts.length > 0 ? alerts.map((alert, index) => (
                  <Alert key={`${alert.title}-${index}`} severity={severityToColor[alert.severity] || 'info'}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{alert.title}</Typography>
                    <Typography variant="body2">{alert.message}</Typography>
                  </Alert>
                )) : <Typography color="text.secondary">{t('portal.no_alerts')}</Typography>}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{t('portal.recommendations_title')}</Typography>
              <List disablePadding>
                {recommendations.map((item, index) => (
                  <React.Fragment key={`${item.title}-${index}`}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>}
                        secondary={item.description}
                      />
                    </ListItem>
                    {index < recommendations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{t('portal.profile_title')}</Typography>
              <Grid container spacing={2}>
                {[
                  [t('portal.student_id'), student.student_id],
                  [t('portal.class_label'), student.class],
                  [t('portal.gender_label'), student.gender],
                  [t('portal.income_label'), student.income],
                  [t('portal.location_label'), student.location],
                  [t('portal.parent_job_label'), student.parent_occupation],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{value || '-'}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <EventAvailableIcon color="success" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.meeting_plan_title')}</Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <TextField
                  select
                  label={t('portal.filter_by_type')}
                  value={meetingTypeFilter}
                  onChange={(event) => setMeetingTypeFilter(event.target.value)}
                  fullWidth
                >
                  {meetingTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type === 'all' ? t('portal.all_types') : type}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t('portal.filter_by_status')}
                  value={meetingStatusFilter}
                  onChange={(event) => setMeetingStatusFilter(event.target.value)}
                  fullWidth
                >
                  {meetingStatuses.map((status) => (
                    <MenuItem key={status} value={status}>{status === 'all' ? t('portal.all_statuses') : status}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              {filteredMeetings.length > 0 ? (
                <Stack spacing={1.5}>
                  {filteredMeetings.slice(0, 8).map((meeting, index) => (
                    <Box key={`${meeting.id || meeting.meeting_date}-${index}`} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <Typography sx={{ fontWeight: 700 }}>{meeting.meeting_type || t('portal.school_meeting')}</Typography>
                        <Chip size="small" label={meeting.status || '-'} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{formatDateTime(meeting.meeting_date)}</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{meeting.description || '-'}</Typography>
                      {meeting.id && (
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1 }}
                          disabled={ackLoadingId === meeting.id}
                          onClick={() => handleAcknowledge(meeting.id)}
                        >
                          {ackLoadingId === meeting.id ? t('portal.ack_in_progress') : t('portal.ack_button')}
                        </Button>
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">{t('portal.no_meetings')}</Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{t('portal.school_support_title')}</Typography>
              <Grid container spacing={2}>
                {interventions.length > 0 ? interventions.slice(0, 6).map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`${item.id || item.intervention_type}-${index}`}>
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.08), height: '100%' }}>
                      <Typography sx={{ fontWeight: 700 }}>{item.intervention_type}</Typography>
                      <Chip label={item.status || '-'} size="small" color="warning" sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">{item.description || item.notes || t('portal.no_description')}</Typography>
                    </Box>
                  </Grid>
                )) : (
                  <Grid item xs={12}>
                    <Typography color="text.secondary">{t('portal.no_support_plans')}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default FamilyPortalDashboard;