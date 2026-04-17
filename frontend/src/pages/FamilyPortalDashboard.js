import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  EventAvailable as EventAvailableIcon,
  Insights as InsightsIcon,
  School as SchoolIcon,
  Sync as SyncIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const InfoCard = ({ title, value, description, tone, accent }) => (
  <Card sx={{ height: '100%', borderRadius: 4, border: `1px solid ${alpha(accent, 0.2)}` }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" sx={{ mt: 1, fontWeight: 800, color: tone }}>{value}</Typography>
        </Box>
        <Box sx={{ width: 12, height: 12, borderRadius: 999, bgcolor: accent, mt: 0.5 }} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.65 }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const severityToColor = {
  high: 'error',
  medium: 'warning',
  info: 'info',
  success: 'success',
};

const normalizeValue = (value) => String(value || '').trim().toLowerCase();
const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const FamilyPortalDashboard = ({ role }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { portalData, refreshPortalData, loading } = usePortal();
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('all');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('all');
  const [ackLoadingId, setAckLoadingId] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const syncPortalData = async (showError = false) => {
      try {
        await refreshPortalData();
        if (isMounted) setLastSyncedAt(new Date());
      } catch (error) {
        if (showError) toast.error(t('portal.refresh_failed'));
      }
    };

    syncPortalData(true);

    const timer = setInterval(() => {
      syncPortalData(false);
    }, 30000);

    const handleFocus = () => syncPortalData(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncPortalData(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPortalData, t]);

  const student = portalData?.student;
  const summary = portalData?.summary;
  const history = portalData?.prediction_history || [];
  const alerts = portalData?.alerts || [];
  const recommendations = portalData?.recommendations || [];
  const interventions = portalData?.interventions || [];
  const meetings = useMemo(() => portalData?.meetings || [], [portalData]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return t('portal.not_synced_yet');
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return t('portal.not_synced_yet');

    const diffSeconds = Math.max(1, Math.floor(diffMs / 1000));
    if (diffSeconds < 60) return t('portal.last_synced_seconds', { count: diffSeconds });

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return t('portal.last_synced_minutes', { count: diffMinutes });

    const diffHours = Math.floor(diffMinutes / 60);
    return t('portal.last_synced_hours', { count: diffHours });
  };

  const translateRiskLabel = (value) => {
    const normalized = normalizeValue(value);
    if (normalized === 'high') return t('common.high');
    if (normalized === 'medium') return t('common.medium');
    if (normalized === 'low') return t('common.low');
    if (normalized === 'critical') return t('dashboard.critical');
    if (normalized === 'safe') return t('dashboard.safe');
    return value || '-';
  };

  const translateMeetingType = (value) => {
    const normalized = normalizeValue(value);
    const translations = {
      'school meeting': t('portal.school_meeting'),
      'parent meeting': t('portal.parent_meeting'),
      'follow-up': t('portal.follow_up'),
      'follow up': t('portal.follow_up'),
      counseling: t('portal.counseling'),
      'academic support': t('portal.academic_support'),
      'home visit': t('portal.home_visit'),
    };
    return translations[normalized] || value || t('portal.school_meeting');
  };

  const translateMeetingStatus = (value) => {
    const normalized = normalizeValue(value);
    const translations = {
      scheduled: t('portal.status_scheduled'),
      rescheduled: t('portal.status_rescheduled'),
      acknowledged: t('portal.status_acknowledged'),
      completed: t('portal.status_completed'),
      cancelled: t('portal.status_cancelled'),
      pending: t('portal.status_pending'),
      'in progress': t('portal.status_in_progress'),
      planned: t('portal.status_planned'),
    };
    return translations[normalized] || value || '-';
  };

  const translateStudentValue = (value) => {
    const normalized = normalizeValue(value);
    const translations = {
      male: t('common.male'),
      female: t('common.female'),
      rural: t('common.rural'),
      urban: t('common.urban'),
      low: t('common.low'),
      medium: t('common.medium'),
      high: t('common.high'),
      teacher: t('common.teacher'),
    };
    return translations[normalized] || value || '-';
  };

  const translateAlert = (alert) => {
    const title = normalizeValue(alert?.title);

    if (title === 'high dropout risk') {
      return {
        severity: alert?.severity,
        title: t('portal.high_dropout_risk_title'),
        message: t('portal.high_dropout_risk_message'),
      };
    }

    if (title === 'attendance is below target') {
      const attendanceMatch = String(alert?.message || '').match(/attendance is\s+([0-9]+(?:\.[0-9]+)?)%/i);
      return {
        severity: alert?.severity,
        title: t('portal.attendance_below_target_title'),
        message: t('portal.attendance_below_target_message', {
          attendance: attendanceMatch ? Number(attendanceMatch[1]).toFixed(1) : '-',
        }),
      };
    }

    if (title === 'marks need improvement') {
      const marksMatch = String(alert?.message || '').match(/current marks are\s+([0-9]+(?:\.[0-9]+)?)/i);
      return {
        severity: alert?.severity,
        title: t('portal.marks_improvement_title'),
        message: t('portal.marks_improvement_message', {
          marks: marksMatch ? Number(marksMatch[1]).toFixed(1) : '-',
        }),
      };
    }

    if (title === 'upcoming school meeting') {
      const meetingDate = String(alert?.message || '').replace(/^.*scheduled on\s*/i, '');
      return {
        severity: alert?.severity,
        title: t('portal.upcoming_meeting_title'),
        message: t('portal.upcoming_meeting_message', { date: meetingDate || '-' }),
      };
    }

    if (title === 'progress is stable') {
      return {
        severity: alert?.severity,
        title: t('portal.progress_stable_title'),
        message: t('portal.progress_stable_message'),
      };
    }

    return {
      severity: alert?.severity,
      title: alert?.title || '-',
      message: alert?.message || '-',
    };
  };

  const translateRecommendation = (item) => {
    const title = normalizeValue(item?.title);

    if (title === 'improve attendance') {
      return {
        title: t('portal.recommendation_attendance_title'),
        description: t('portal.recommendation_attendance_description'),
      };
    }
    if (title === 'get study support') {
      return {
        title: t('portal.recommendation_study_title'),
        description: t('portal.recommendation_study_description'),
      };
    }
    if (title === 'check support schemes') {
      return {
        title: t('portal.recommendation_support_title'),
        description: t('portal.recommendation_support_description'),
      };
    }
    if (title === 'plan school commute') {
      return {
        title: t('portal.recommendation_commute_title'),
        description: t('portal.recommendation_commute_description'),
      };
    }
    if (title === 'keep monitoring progress') {
      return {
        title: t('portal.recommendation_monitor_title'),
        description: t('portal.recommendation_monitor_description'),
      };
    }

    return {
      title: item?.title || '-',
      description: item?.description || '-',
    };
  };

  const translatedAlerts = alerts.map(translateAlert);
  const translatedRecommendations = recommendations.map(translateRecommendation);

  const meetingTypeOptions = useMemo(
    () => ['all', ...Array.from(new Set(meetings.map((meeting) => meeting.meeting_type).filter(Boolean)))],
    [meetings]
  );

  const meetingStatusOptions = useMemo(
    () => ['all', ...Array.from(new Set(meetings.map((meeting) => meeting.status).filter(Boolean)))],
    [meetings]
  );

  const unreadMeetings = useMemo(
    () => meetings.filter((meeting) => {
      const status = normalizeValue(meeting.status);
      const outcome = normalizeValue(meeting.outcome);
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

  const chartData = history.slice(0, 8).reverse().map((entry) => ({
    date: new Date(entry.created_at).toLocaleDateString(),
    risk: Math.round(Number(entry.risk_score || 0) * 100),
    confidence: Math.round(Number(entry.confidence || 0) * 100),
  }));

  const progressSnapshot = [
    { name: t('portal.attendance_label'), value: clampPercent(summary?.attendance), fill: theme.palette.primary.main },
    { name: t('portal.marks_label'), value: clampPercent(summary?.marks), fill: theme.palette.success.main },
    { name: t('portal.risk_label'), value: Math.max(0, 100 - Math.round(Number(summary?.risk_score || 0) * 100)), fill: theme.palette.warning.main },
  ];

  const statusChart = [
    { name: t('portal.attendance_label'), value: Number(summary?.attendance || 0), fill: theme.palette.primary.main },
    { name: t('portal.remaining_label'), value: Math.max(0, 100 - Number(summary?.attendance || 0)), fill: alpha(theme.palette.primary.main, 0.15) },
  ];

  const interventionStatusData = (() => {
    const counts = interventions.reduce((accumulator, intervention) => {
      const status = normalizeValue(intervention?.status);
      if (!status) return accumulator;
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts).map(([status, count], index) => ({
      name: translateMeetingStatus(status),
      value: count,
      fill: [theme.palette.warning.main, theme.palette.success.main, theme.palette.primary.main, theme.palette.secondary.main][index % 4],
    }));
  })();

  const attendanceNarrative = summary.attendance >= 75
    ? t('portal.attendance_good_story', { attendance: summary.attendance })
    : t('portal.attendance_need_help_story', { attendance: summary.attendance });

  const marksNarrative = summary.marks >= 50
    ? t('portal.marks_good_story', { marks: summary.marks })
    : t('portal.marks_need_help_story', { marks: summary.marks });

  const riskNarrative = Number(summary.risk_score || 0) >= 0.5
    ? t('portal.risk_high_story', { risk: Math.round(Number(summary.risk_score || 0) * 100) })
    : t('portal.risk_low_story', { risk: Math.round(Number(summary.risk_score || 0) * 100) });

  const handleAcknowledge = async (meetingId) => {
    try {
      setAckLoadingId(meetingId);
      await acknowledgeStudentMeeting(student.student_id, {
        meeting_id: meetingId,
        acknowledged_by: role,
        note: role === 'parent' ? t('portal.parent_ack_note') : t('portal.student_ack_note'),
      });
      await refreshPortalData();
      setLastSyncedAt(new Date());
      toast.success(t('portal.ack_success'));
    } catch (error) {
      toast.error(error?.response?.data?.error || t('portal.ack_failed'));
    } finally {
      setAckLoadingId(null);
    }
  };

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
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 5, mb: 3, background: 'linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%)' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                <Chip label={role === 'parent' ? t('portal.parent_tab') : t('portal.student_tab')} color="primary" />
                <Chip label={`${t('portal.class_label')}: ${student.class || '-'}`} variant="outlined" />
                <Chip label={`${t('portal.roll_number')}: ${student.roll_no || '-'}`} variant="outlined" />
                <Chip label={`${t('portal.unread_updates')}: ${unreadMeetings.length}`} color={unreadMeetings.length > 0 ? 'warning' : 'default'} />
                <Chip icon={<SyncIcon fontSize="small" />} label={t('portal.live_updates')} color="success" variant="outlined" />
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {role === 'parent'
                  ? t('portal.parent_welcome', { name: student.student_name })
                  : t('portal.student_welcome', { name: student.student_name })}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760 }}>
                {role === 'parent' ? t('portal.parent_summary_text') : t('portal.student_summary_text')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                <Typography variant="body2" color="text.secondary">{t('portal.current_risk')}</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: Number(summary.risk_score || 0) >= 0.5 ? theme.palette.error.main : theme.palette.success.main }}>
                  {translateRiskLabel(summary.risk_label)}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {t('portal.risk_score_value', { value: Math.round(Number(summary.risk_score || 0) * 100) })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {formatRelativeTime(lastSyncedAt)}
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

          <Grid item xs={12} lg={4}>
            <InfoCard
              title={t('portal.attendance_story_title')}
              value={t('portal.attendance_story_value', { attendance: summary.attendance })}
              description={attendanceNarrative}
              tone={summary.attendance >= 75 ? theme.palette.success.main : theme.palette.warning.main}
              accent={summary.attendance >= 75 ? theme.palette.success.main : theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} lg={4}>
            <InfoCard
              title={t('portal.marks_story_title')}
              value={t('portal.marks_story_value', { marks: summary.marks })}
              description={marksNarrative}
              tone={summary.marks >= 50 ? theme.palette.success.main : theme.palette.warning.main}
              accent={summary.marks >= 50 ? theme.palette.success.main : theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} lg={4}>
            <InfoCard
              title={t('portal.risk_story_title')}
              value={t('portal.risk_story_value', { risk: Math.round(Number(summary.risk_score || 0) * 100) })}
              description={riskNarrative}
              tone={Number(summary.risk_score || 0) >= 0.5 ? theme.palette.error.main : theme.palette.success.main}
              accent={Number(summary.risk_score || 0) >= 0.5 ? theme.palette.error.main : theme.palette.success.main}
            />
          </Grid>

          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <InsightsIcon color="primary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.progress_snapshot_title')}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('portal.progress_snapshot_subtitle')}</Typography>
                </Box>
              </Stack>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressSnapshot} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {progressSnapshot.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <AccessTimeIcon color="primary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.live_status_title')}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('portal.live_status_subtitle')}</Typography>
                </Box>
              </Stack>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChart} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={1}>
                      {statusChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('portal.attendance_target')}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <InsightsIcon color="primary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.risk_trend')}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('portal.risk_trend_subtitle')}</Typography>
                </Box>
              </Stack>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="risk" stroke={theme.palette.error.main} strokeWidth={3} name={t('portal.risk_line')} dot={false} />
                    <Line type="monotone" dataKey="confidence" stroke={theme.palette.primary.main} strokeWidth={2} name={t('portal.confidence_line')} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <SchoolIcon color="primary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.alerts_title')}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('portal.alerts_subtitle')}</Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5}>
                {translatedAlerts.length > 0 ? translatedAlerts.map((alert, index) => (
                  <Alert key={`${alert.title}-${index}`} severity={severityToColor[normalizeValue(alert.severity)] || 'info'}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{alert.title}</Typography>
                    <Typography variant="body2">{alert.message}</Typography>
                  </Alert>
                )) : <Typography color="text.secondary">{t('portal.no_alerts')}</Typography>}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <WarningAmberIcon color="warning" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.recommendations_title')}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('portal.recommendations_subtitle')}</Typography>
                </Box>
              </Stack>
              <List disablePadding>
                {translatedRecommendations.map((item, index) => (
                  <React.Fragment key={`${item.title}-${index}`}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>}
                        secondary={item.description}
                      />
                    </ListItem>
                    {index < translatedRecommendations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <EventAvailableIcon color="success" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('portal.status_breakdown_title')}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('portal.status_breakdown_subtitle')}</Typography>
                </Box>
              </Stack>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={interventionStatusData} dataKey="value" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {interventionStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('portal.support_health_note')}
              </Typography>
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{translateStudentValue(value)}</Typography>
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
                  {meetingTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>{type === 'all' ? t('portal.all_types') : translateMeetingType(type)}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t('portal.filter_by_status')}
                  value={meetingStatusFilter}
                  onChange={(event) => setMeetingStatusFilter(event.target.value)}
                  fullWidth
                >
                  {meetingStatusOptions.map((status) => (
                    <MenuItem key={status} value={status}>{status === 'all' ? t('portal.all_statuses') : translateMeetingStatus(status)}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              {filteredMeetings.length > 0 ? (
                <Stack spacing={1.5}>
                  {filteredMeetings.slice(0, 8).map((meeting, index) => (
                    <Box key={`${meeting.id || meeting.meeting_date}-${index}`} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <Typography sx={{ fontWeight: 700 }}>{translateMeetingType(meeting.meeting_type)}</Typography>
                        <Chip size="small" label={translateMeetingStatus(meeting.status)} />
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
                      <Typography sx={{ fontWeight: 700 }}>{translateMeetingType(item.intervention_type)}</Typography>
                      <Chip label={translateMeetingStatus(item.status)} size="small" color="warning" sx={{ my: 1 }} />
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