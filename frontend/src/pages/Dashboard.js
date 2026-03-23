import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  alpha,
  useTheme,
  Avatar,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    const timer = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchDashboardStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data.data || response.data);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      toast.error(t('common.error'));
      setLoading(false);
    }
  };

  const chartColors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const getInsights = () => {
    if (!stats) return [];
    const insights = [];
    const riskPct = stats.risk_percentage || 0;
    const avgAtt = stats.avg_attendance || 0;
    const highRisk = stats.high_risk_count || 0;

    if (riskPct > 40) {
      insights.push({ severity: 'error', msg: t('dashboard.insight_high_risk_alert', { pct: riskPct }) });
    } else if (riskPct > 20) {
      insights.push({ severity: 'warning', msg: t('dashboard.insight_moderate_risk', { pct: riskPct }) });
    } else if (stats.total_students > 0) {
      insights.push({ severity: 'success', msg: t('dashboard.insight_positive') });
    }
    if (avgAtt > 0 && avgAtt < 75) {
      insights.push({ severity: 'error', msg: t('dashboard.insight_low_attendance', { att: avgAtt.toFixed(1) }) });
    }
    if (highRisk > 0) {
      insights.push({ severity: 'info', msg: t('dashboard.insight_attention_needed', { count: highRisk }) });
    }
    return insights;
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            {t('dashboard.loading')}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Container maxWidth="xl">
        {/* Header with Refresh */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                color: 'white',
                textShadow: '0 2px 20px rgba(0,0,0,0.2)',
                mb: 1,
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              {t('dashboard.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {t('dashboard.last_updated')}: {lastUpdated}
            </Typography>
          </Box>
          <Tooltip title={t('dashboard.refresh_data')}>
            <IconButton 
              onClick={fetchDashboardStats}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* AI Insights Banner */}
        {stats && getInsights().length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: 1.5, mb: 1.5, display: 'block' }}
            >
              {t('dashboard.insights_title')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
              {getInsights().map((insight, idx) => {
                const bgMap = {
                  error: alpha(theme.palette.error.main, 0.18),
                  warning: alpha(theme.palette.warning.main, 0.18),
                  success: alpha(theme.palette.success.main, 0.18),
                  info: alpha(theme.palette.info.main, 0.18),
                };
                const borderMap = {
                  error: alpha(theme.palette.error.main, 0.45),
                  warning: alpha(theme.palette.warning.main, 0.45),
                  success: alpha(theme.palette.success.main, 0.45),
                  info: alpha(theme.palette.info.main, 0.45),
                };
                return (
                  <Box
                    key={idx}
                    sx={{
                      px: 2, py: 1,
                      borderRadius: 2,
                      background: bgMap[insight.severity],
                      border: `1px solid ${borderMap[insight.severity]}`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {insight.msg}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* KPI Cards Row 1 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: t('dashboard.total_students'), value: stats?.total_students || 0, color: 'primary', icon: PeopleIcon },
            { label: t('dashboard.high_risk'), value: stats?.high_risk_count || 0, color: 'error', icon: WarningIcon },
            { label: t('dashboard.low_risk'), value: stats?.low_risk_count || 0, color: 'success', icon: CheckCircleIcon },
            { label: t('dashboard.risk_percentage'), value: `${stats?.risk_percentage || 0}%`, color: 'warning', icon: TrendingIcon },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <Grid item xs={12} sm={6} lg={3} key={idx}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette[card.color].main}, ${theme.palette[card.color].dark})`,
                    color: 'white',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 40px ${alpha(theme.palette[card.color].main, 0.4)}`,
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha('#fff', 0.2),
                          width: 55,
                          height: 55,
                        }}
                      >
                        <Icon sx={{ fontSize: 28 }} />
                      </Avatar>
                      <Chip 
                        label={t('dashboard.active')} 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha('#fff', 0.2),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }} 
                      />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      {card.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Additional Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600 }}>
                  {t('dashboard.avg_attendance')}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  {stats?.avg_attendance?.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(stats?.avg_attendance || 0, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600 }}>
                  {t('dashboard.avg_marks')}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                  {stats?.avg_marks?.toFixed(1)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((stats?.avg_marks || 0) / 100 * 100, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)}, ${alpha(theme.palette.error.main, 0.02)})`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
              }}
            >
              <CardContent>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600 }}>
                  {t('dashboard.high_risk')}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                  {stats?.high_risk_count || 0}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((stats?.high_risk_count || 0) / (stats?.total_students || 1)) * 100, 100)}
                  sx={{
                    height: 6, borderRadius: 3,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: theme.palette.error.main },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.main, 0.02)})`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              }}
            >
              <CardContent>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600 }}>
                  {t('dashboard.low_risk')}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  {stats?.low_risk_count || 0}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((stats?.low_risk_count || 0) / (stats?.total_students || 1)) * 100, 100)}
                  sx={{
                    height: 6, borderRadius: 3,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: theme.palette.success.main },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gender & Income Distribution Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {t('dashboard.gender_distribution')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('dashboard.gender_distribution_subtitle')}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {stats?.gender_stats && Object.keys(stats.gender_stats).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.gender_stats).map(([name, data]) => ({
                          name,
                          value: data.total,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.keys(stats.gender_stats).map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">{t('dashboard.no_high_risk')}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`, mr: 2 }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {t('dashboard.income_distribution')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('dashboard.income_distribution_subtitle')}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {stats?.income_stats && Object.keys(stats.income_stats).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.income_stats).map(([name, data]) => ({
                          name,
                          value: data.total,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.keys(stats.income_stats).map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">{t('dashboard.no_high_risk')}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top 5 High-Risk Students */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`, mr: 2 }}>
                      <WarningIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t('dashboard.top_risk_students')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('dashboard.top_risk_students_subtitle')}
                      </Typography>
                    </Box>
                  </Box>
                  <Button 
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/students')}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {t('dashboard.view_all_high_risk')}
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {stats?.top_risk_students && stats.top_risk_students.length > 0 ? (
                  <TableContainer sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                          <TableCell sx={{ fontWeight: 700 }}>{t('common.name')}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Class</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{t('dashboard.avg_attendance')}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{t('dashboard.avg_marks')}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{t('common.actions')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.top_risk_students.map((student, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={idx + 1}
                                  size="small"
                                  sx={{ minWidth: 24, bgcolor: theme.palette.error.main, color: 'white', fontWeight: 700 }}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {student.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">{student.class}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${student.attendance}%`}
                                size="small"
                                color={student.attendance < 75 ? 'error' : 'success'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={student.marks}
                                size="small"
                                color={student.marks < 50 ? 'error' : 'success'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title={t('dashboard.view_profile')}>
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/students/${student.id}`)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <PersonIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography color="text.secondary">{t('dashboard.no_high_risk')}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {t('dashboard.quick_actions')}
                </Typography>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2}
                  sx={{ flexWrap: 'wrap' }}
                >
                  <Button 
                    variant="contained" 
                    startIcon={<PersonIcon />}
                    onClick={() => navigate('/students')}
                  >
                    {t('dashboard.view_all_students')}
                  </Button>
                  <Button 
                    variant="contained"
                    color="error"
                    startIcon={<WarningIcon />}
                    onClick={() => navigate('/students?filter=high-risk')}
                  >
                    {t('dashboard.view_all_high_risk')}
                  </Button>
                  <Button 
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                  >
                    {t('dashboard.export_report')}
                  </Button>
                  <Button 
                    variant="outlined"
                    color="success"
                    onClick={() => navigate('/class-view')}
                  >
                    {t('dashboard.schedule_intervention')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Class Distribution & Location Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, mr: 2 }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {t('dashboard.class_distribution')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('dashboard.class_distribution_subtitle')}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  {stats?.class_distribution && Object.entries(stats.class_distribution).map(([cls, count], index) => {
                    const total = stats.total_students || 1;
                    const percentage = ((count / total) * 100).toFixed(1);
                    const color = chartColors[index % chartColors.length];

                    return (
                      <Box key={cls} sx={{ mb: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {cls}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color }}>
                            {count} ({percentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(percentage)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(color, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.7)})`,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`, mr: 2 }}>
                    <LocationIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {t('dashboard.location_analytics')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('dashboard.location_analytics_subtitle')}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  {stats?.location_stats && Object.entries(stats.location_stats).map(([location, data]) => {
                    const riskPercentage = ((data.high_risk / data.total) * 100).toFixed(1);
                    const isHighRisk = parseFloat(riskPercentage) > 50;

                    return (
                      <Card
                        key={location}
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          background: isHighRisk
                            ? alpha(theme.palette.error.main, 0.05)
                            : alpha(theme.palette.success.main, 0.05),
                          border: `1px solid ${isHighRisk ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: 1,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {location}
                          </Typography>
                          <Chip
                            label={isHighRisk ? t('dashboard.critical') : t('dashboard.safe')}
                            size="small"
                            color={isHighRisk ? 'error' : 'success'}
                            variant="outlined"
                          />
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Total
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {data.total}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main' }}>
                              High Risk
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                              {data.high_risk}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Rate
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: isHighRisk ? 'error.main' : 'success.main' }}>
                              {riskPercentage}%
                            </Typography>
                          </Grid>
                        </Grid>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(riskPercentage)}
                          sx={{
                            mt: 1,
                            height: 5,
                            borderRadius: 2.5,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2.5,
                              bgcolor: isHighRisk ? theme.palette.error.main : theme.palette.success.main,
                            },
                          }}
                        />
                      </Card>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
