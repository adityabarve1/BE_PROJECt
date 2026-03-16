import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { getRiskFactors, getStudentClusters } from '../services/api';
import { toast } from 'react-toastify';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [riskFactors, setRiskFactors] = useState(null);
  const [clusterData, setClusterData] = useState(null);

  useEffect(() => {
    fetchAnalytics();

    const timer = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(timer);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [riskResult, clusterResult] = await Promise.allSettled([
        getRiskFactors(),
        getStudentClusters(3),
      ]);

      if (riskResult.status === 'fulfilled') {
        setRiskFactors(riskResult.value.data.data || null);
      } else {
        toast.error('Risk factors could not be loaded');
      }

      if (clusterResult.status === 'fulfilled') {
        setClusterData(clusterResult.value.data.data || null);
      } else {
        toast.error('Cluster analytics is slow/unavailable right now');
      }

      setLoading(false);
    } catch (error) {
      toast.error('Failed to load analytics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Analytics & Insights
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Risk Factors Analysis
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
                      <Typography variant="body2">
                        {data.count} students
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
