import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Toolbar,
  Typography,
  alpha,
} from '@mui/material';
import {
  FamilyRestroom as FamilyRestroomIcon,
  Logout as LogoutIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { usePortal } from '../contexts/PortalContext';

const PortalNavbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { portalSession, logoutPortal } = usePortal();

  const handleLogout = () => {
    logoutPortal();
    navigate('/portal/access');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #0f766e 100%)',
        borderBottom: `1px solid ${alpha('#ffffff', 0.15)}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2, py: 1 }}>
          <Box
            component={RouterLink}
            to={portalSession?.role === 'parent' ? '/portal/parent' : '/portal/student'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'white',
              mr: 'auto',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha('#ffffff', 0.18),
                mr: 1.5,
              }}
            >
              {portalSession?.role === 'parent' ? <FamilyRestroomIcon /> : <SchoolIcon />}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {portalSession?.role === 'parent' ? t('portal.parent_title') : t('portal.student_title')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {portalSession?.name || portalSession?.studentId}
              </Typography>
            </Box>
          </Box>

          <Chip
            label={portalSession?.studentId}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              bgcolor: alpha('#ffffff', 0.18),
              color: 'white',
              fontWeight: 700,
            }}
          />

          <LanguageSelector />

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              px: 2,
              bgcolor: alpha('#ffffff', 0.08),
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.16),
              },
            }}
          >
            {t('nav.logout')}
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default PortalNavbar;