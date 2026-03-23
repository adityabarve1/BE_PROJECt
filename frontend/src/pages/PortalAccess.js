import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  FamilyRestroom as FamilyRestroomIcon,
  LockOpen as LockOpenIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { usePortal } from '../contexts/PortalContext';

const PortalAccess = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { loginParent, loginStudent } = usePortal();

  const [tab, setTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [studentForm, setStudentForm] = useState({ student_id: '', password: '' });
  const [parentForm, setParentForm] = useState({ student_id: '', roll_no: '', admission_year: '' });

  const handleStudentSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await loginStudent(studentForm);
      toast.success(t('portal.student_login_success'));
      navigate('/portal/student');
    } catch (apiError) {
      setError(apiError.response?.data?.error || t('portal.access_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleParentSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await loginParent({
        ...parentForm,
        roll_no: Number(parentForm.roll_no),
        admission_year: Number(parentForm.admission_year),
      });
      toast.success(t('portal.parent_login_success'));
      navigate('/portal/parent');
    } catch (apiError) {
      setError(apiError.response?.data?.error || t('portal.access_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const commonFieldProps = {
    fullWidth: true,
    margin: 'normal',
    variant: 'outlined',
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 3, md: 8 },
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 30%, #99f6e4 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Box sx={{ pr: { md: 3 }, pt: { md: 6 } }}>
              <Typography variant="overline" sx={{ color: theme.palette.primary.dark, fontWeight: 800 }}>
                {t('portal.family_access')}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                {t('portal.access_title')}
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                {t('portal.access_subtitle')}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={12}>
                  <Card sx={{ borderRadius: 4, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.12) }}>
                          <SchoolIcon color="primary" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {t('portal.student_title')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('portal.student_access_desc')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={12}>
                  <Card sx={{ borderRadius: 4, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.12) }}>
                          <FamilyRestroomIcon sx={{ color: theme.palette.success.main }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {t('portal.parent_title')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('portal.parent_access_desc')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
              <Tabs
                value={tab}
                onChange={(_, value) => {
                  setTab(value);
                  setError('');
                }}
                variant="fullWidth"
                sx={{ mb: 3 }}
              >
                <Tab icon={<SchoolIcon />} iconPosition="start" label={t('portal.student_tab')} />
                <Tab icon={<FamilyRestroomIcon />} iconPosition="start" label={t('portal.parent_tab')} />
              </Tabs>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {tab === 0 ? (
                <Box component="form" onSubmit={handleStudentSubmit}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('portal.student_login_title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('portal.student_login_help')}
                  </Typography>
                  <TextField
                    label={t('portal.student_id')}
                    value={studentForm.student_id}
                    onChange={(event) => setStudentForm({ ...studentForm, student_id: event.target.value })}
                    {...commonFieldProps}
                  />
                  <TextField
                    label={t('portal.student_password')}
                    type="password"
                    value={studentForm.password}
                    onChange={(event) => setStudentForm({ ...studentForm, password: event.target.value })}
                    {...commonFieldProps}
                  />
                  <Button type="submit" variant="contained" size="large" disabled={submitting} startIcon={<LockOpenIcon />} sx={{ mt: 2 }}>
                    {t('portal.enter_student_portal')}
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleParentSubmit}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('portal.parent_login_title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('portal.parent_login_help')}
                  </Typography>
                  <TextField
                    label={t('portal.student_id')}
                    value={parentForm.student_id}
                    onChange={(event) => setParentForm({ ...parentForm, student_id: event.target.value })}
                    {...commonFieldProps}
                  />
                  <TextField
                    label={t('portal.roll_number')}
                    value={parentForm.roll_no}
                    onChange={(event) => setParentForm({ ...parentForm, roll_no: event.target.value })}
                    {...commonFieldProps}
                  />
                  <TextField
                    label={t('portal.admission_year')}
                    value={parentForm.admission_year}
                    onChange={(event) => setParentForm({ ...parentForm, admission_year: event.target.value })}
                    {...commonFieldProps}
                  />
                  <Button type="submit" variant="contained" color="success" size="large" disabled={submitting} startIcon={<LockOpenIcon />} sx={{ mt: 2 }}>
                    {t('portal.enter_parent_portal')}
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PortalAccess;