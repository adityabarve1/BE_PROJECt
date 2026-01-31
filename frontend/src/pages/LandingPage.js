import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  const features = [
    {
      icon: <PsychologyIcon sx={{ fontSize: 50 }} />,
      title: t('landing.feature1_title'),
      description: t('landing.feature1_desc'),
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 50 }} />,
      title: t('landing.feature2_title'),
      description: t('landing.feature2_desc'),
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 50 }} />,
      title: t('landing.feature3_title'),
      description: t('landing.feature3_desc'),
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 50 }} />,
      title: t('landing.feature4_title'),
      description: t('landing.feature4_desc'),
    },
    {
      icon: <GroupIcon sx={{ fontSize: 50 }} />,
      title: t('landing.feature5_title'),
      description: t('landing.feature5_desc'),
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 50 }} />,
      title: t('landing.feature6_title'),
      description: t('landing.feature6_desc'),
    },
  ];

  const stats = [
    { value: '97.5%', label: t('landing.stats_accuracy') },
    { value: '10ms', label: t('landing.stats_response') },
    { value: '1000+', label: t('landing.stats_students') },
    { value: '24/7', label: t('landing.stats_availability') },
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          pt: 12,
          pb: 20,
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: alpha(theme.palette.common.white, 0.1),
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-30px)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '5%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: alpha(theme.palette.common.white, 0.08),
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h1"
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  mb: 3,
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  lineHeight: 1.2,
                }}
              >
                {t('landing.hero_title')}
              </Typography>
              
              <Typography
                variant="h5"
                sx={{
                  color: alpha(theme.palette.common.white, 0.95),
                  mb: 5,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                {t('landing.hero_subtitle')}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: 'white',
                    color: '#1e40af',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.95),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {t('landing.get_started')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    textTransform: 'none',
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: alpha(theme.palette.common.white, 0.2),
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {t('landing.sign_in')}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -20,
                    left: -20,
                    right: 20,
                    bottom: 20,
                    background: alpha(theme.palette.common.white, 0.1),
                    borderRadius: 8,
                    backdropFilter: 'blur(10px)',
                  },
                }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600"
                  alt="Students learning"
                  sx={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: 4,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Stats Section */}
          <Grid container spacing={3} sx={{ mt: 10 }}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    background: alpha(theme.palette.common.white, 0.15),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      color: 'white',
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: alpha(theme.palette.common.white, 0.9),
                      fontWeight: 500,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 12, bgcolor: alpha(theme.palette.common.white, 0.98) }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: 2,
              }}
            >
              FEATURES
            </Typography>
            <Typography
              variant="h2"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                mt: 2,
                mb: 2,
              }}
            >
              Everything You Need
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Comprehensive tools to predict, prevent, and manage student dropout rates effectively
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        background: `linear-gradient(135deg, #60a5fa, #3b82f6)`,
                        color: 'white',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 12,
          background: `linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)`,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 3,
              }}
            >
              Ready to Transform Education?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: alpha(theme.palette.common.white, 0.9),
                mb: 5,
                lineHeight: 1.8,
              }}
            >
              Join hundreds of schools using AI to improve student retention and success rates.
              Start your free trial today—no credit card required.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'white',
                color: theme.palette.primary.main,
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 3,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.95),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Free Trial
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          bgcolor: alpha(theme.palette.common.black, 0.05),
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            align="center"
            sx={{ color: theme.palette.text.secondary }}
          >
            © 2026 Student Dropout Prediction System. Built for Zilla Parishad Schools.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
