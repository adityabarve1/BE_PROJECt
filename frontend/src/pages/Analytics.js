import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
} from '@mui/material';
import { getRiskFactors } from '../services/api';
import { toast } from 'react-toastify';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [riskFactors, setRiskFactors] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await getRiskFactors();
      setRiskFactors(response.data);
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
      </Grid>
    </Container>
  );
};

export default Analytics;
