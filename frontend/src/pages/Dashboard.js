import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
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
} from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import StatCard from '../components/StatCard';
import { getDashboardStats } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data.data || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      toast.error('Failed to load dashboard statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading Dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              color: 'white',
              textShadow: '0 2px 20px rgba(0,0,0,0.2)',
              mb: 1,
            }}
          >
            Dashboard Overview
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Monitor student performance and dropout risk analytics
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Enhanced Statistics Cards */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: alpha('#fff', 0.1),
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#fff', 0.2),
                      width: 60,
                      height: 60,
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Chip 
                    label="Active" 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      color: 'white',
                      fontWeight: 600,
                    }} 
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats?.total_students || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.error.main, 0.4)}`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: alpha('#fff', 0.1),
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#fff', 0.2),
                      width: 60,
                      height: 60,
                    }}
                  >
                    <WarningIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Chip 
                    label="Critical" 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      color: 'white',
                      fontWeight: 600,
                    }} 
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats?.high_risk_count || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  High Risk Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.success.main, 0.4)}`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: alpha('#fff', 0.1),
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#fff', 0.2),
                      width: 60,
                      height: 60,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Chip 
                    label="Safe" 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      color: 'white',
                      fontWeight: 600,
                    }} 
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats?.low_risk_count || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Low Risk Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.warning.main, 0.4)}`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: alpha('#fff', 0.1),
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha('#fff', 0.2),
                      width: 60,
                      height: 60,
                    }}
                  >
                    <TrendingIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Chip 
                    label="Trend" 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha('#fff', 0.2),
                      color: 'white',
                      fontWeight: 600,
                    }} 
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats?.risk_percentage || 0}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Risk Percentage
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Class Distribution - Enhanced */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 4,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      mr: 2,
                    }}
                  >
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Class Distribution
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Students by grade level
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  {stats?.class_distribution &&
                    Object.entries(stats.class_distribution).map(([cls, count], index) => {
                      const total = stats.total_students || 1;
                      const percentage = ((count / total) * 100).toFixed(1);
                      const colors = [
                        theme.palette.primary.main,
                        theme.palette.primary.light,
                        theme.palette.success.main,
                        theme.palette.warning.main,
                        theme.palette.error.main,
                        theme.palette.info.main,
                      ];
                      const color = colors[index % colors.length];

                      return (
                        <Box key={cls} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {cls} Standard
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

          {/* Location Statistics - Enhanced */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: 4,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.error.main})`,
                      mr: 2,
                    }}
                  >
                    <LocationIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Location-wise Analytics
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Risk distribution by area
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  {stats?.location_stats &&
                    Object.entries(stats.location_stats).map(([location, data]) => {
                      const riskPercentage = ((data.high_risk / data.total) * 100).toFixed(1);
                      const isHighRisk = parseFloat(riskPercentage) > 50;

                      return (
                        <Card
                          key={location}
                          sx={{
                            mb: 2,
                            p: 2,
                            background: isHighRisk
                              ? alpha(theme.palette.error.main, 0.05)
                              : alpha(theme.palette.success.main, 0.05),
                            border: `1px solid ${isHighRisk ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateX(4px)',
                              boxShadow: 2,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {location}
                            </Typography>
                            <Chip
                              label={isHighRisk ? 'High Risk Area' : 'Safe Area'}
                              size="small"
                              color={isHighRisk ? 'error' : 'success'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                Total
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {data.total}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="error">
                                High Risk
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                                {data.high_risk}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                Risk Rate
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: isHighRisk ? 'error.main' : 'success.main' }}>
                                {riskPercentage}%
                              </Typography>
                            </Grid>
                          </Grid>
                          <LinearProgress
                            variant="determinate"
                            value={parseFloat(riskPercentage)}
                            sx={{
                              mt: 1.5,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
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
