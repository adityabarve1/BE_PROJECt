import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Chip,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { getRiskFactors, getStudentClusters } from '../services/api';
import { toast } from 'react-toastify';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [riskFactors, setRiskFactors] = useState(null);
  const [riskFactorTotal, setRiskFactorTotal] = useState(0);
  const [clusterData, setClusterData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    const isFirstLoad = loading;

    if (!isFirstLoad) {
      setRefreshing(true);
    }

    try {
      const [riskResult, clusterResult] = await Promise.allSettled([
        getRiskFactors(),
        getStudentClusters(3, 2000),
      ]);

      if (riskResult.status === 'fulfilled') {
        const payload = riskResult.value.data.data || null;
        if (payload && payload.factors) {
          setRiskFactors(payload.factors || null);
          setRiskFactorTotal(payload.total_high_risk_students || 0);
        } else {
          // Backward compatibility for older response shape.
          setRiskFactors(payload || null);
          setRiskFactorTotal(0);
        }
      } else {
        toast.error('Risk factors could not be loaded');
      }

      if (clusterResult.status === 'fulfilled') {
        setClusterData(clusterResult.value.data.data || null);
      } else {
        toast.error('Cluster analytics is slow/unavailable right now');
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load analytics');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const timer = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchAnalytics]);

  const clusterSummaries = clusterData?.cluster_summary
    ? Object.entries(clusterData.cluster_summary)
    : [];

  const topRiskCluster = clusterSummaries.reduce((best, current) => {
    if (!best) return current;
    return (current[1].high_risk_percentage || 0) > (best[1].high_risk_percentage || 0) ? current : best;
  }, null);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Analytics & Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Live mode is poll-based (every 15s). Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not yet'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControlLabel
            control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
            label="Auto refresh"
          />
          <Button
            variant="outlined"
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh now'}
          </Button>
        </Stack>
      </Stack>

      {clusterData?.meta?.sample_truncated && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Cluster view is computed from {clusterData.meta.sampled_students} of {clusterData.meta.total_students} students.
          Increase limit or paginate server-side clustering for full coverage.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Risk Factors Analysis
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Percentages are within the high-risk group, not all students.
              {riskFactorTotal > 0 ? ` Basis: ${riskFactorTotal} high-risk students.` : ''}
            </Typography>

            <Grid container spacing={2}>
              {riskFactors &&
                Object.entries(riskFactors).map(([factor, data]) => (
                  <Grid item xs={12} sm={6} md={3} key={factor}>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {factor.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="h4" sx={{ my: 1, fontWeight: 'bold' }}>
                        {data.percentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {riskFactorTotal > 0
                          ? `${data.count} of ${riskFactorTotal} high-risk students`
                          : `${data.count} students`}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Student Clusters (Real-time)
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Clustering uses 7 features: attendance, marks, risk score, gender, income, location, and class.
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <Chip
                label={`Mode: ${clusterData?.meta?.refresh_type || 'polling'} every ${clusterData?.meta?.recommended_refresh_seconds || 15}s`}
                size="small"
                color="default"
              />
              <Chip
                label={`Coverage: ${clusterData?.meta?.sampled_students || 0}/${clusterData?.meta?.total_students || 0} students`}
                size="small"
                color={clusterData?.meta?.sample_truncated ? 'warning' : 'success'}
              />
              {topRiskCluster && (
                <Chip
                  label={`Highest-risk cluster: ${topRiskCluster[0]} (${topRiskCluster[1].high_risk_percentage}%)`}
                  size="small"
                  color="error"
                />
              )}
            </Stack>

            <Grid container spacing={2}>
              {clusterData && clusterData.message && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {clusterData.message}
                  </Typography>
                </Grid>
              )}

              {clusterData && clusterData.cluster_summary &&
                Object.entries(clusterData.cluster_summary).map(([clusterId, summary]) => (
                  <Grid item xs={12} sm={6} md={4} key={clusterId}>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          Cluster {clusterId}
                        </Typography>
                        <Chip size="small" label={`${summary.count} students`} color="primary" />
                      </Box>
                      <Typography variant="body2">Avg Attendance: {summary.avg_attendance}%</Typography>
                      <Typography variant="body2">Avg Marks: {summary.avg_marks}</Typography>
                      <Typography variant="body2">High Risk: {summary.high_risk_percentage}%</Typography>
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
