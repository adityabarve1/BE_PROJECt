import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Divider,
  useScrollTrigger,
  Slide,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  PsychologyAlt as PredictIcon,
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  AccountCircle,
  Logout,
  Settings,
  Person
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Navbar = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleClose();
  };

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: <DashboardIcon /> },
    { path: '/students', label: t('nav.students'), icon: <PeopleIcon /> },
    { path: '/upload', label: t('nav.upload'), icon: <UploadIcon /> },
    { path: '/class-view', label: t('nav.class_view'), icon: <EditIcon /> },
    { path: '/predict', label: t('nav.predict'), icon: <PredictIcon /> },
    { path: '/analytics', label: t('nav.analytics'), icon: <AssessmentIcon /> },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <HideOnScroll {...props}>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          mb: 4,
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: alpha('#ffffff', 0.1),
          boxShadow: '0 4px 30px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1 }}>
            {/* Logo & Brand */}
            <Box
              component={Link}
              to="/dashboard"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                mr: 6,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                  border: '2px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}
              >
                <PredictIcon sx={{ color: '#1e40af', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0e7ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                  fontSize: '1.25rem',
                }}
              >
                {t('app_name')}
              </Typography>
            </Box>

            {/* Navigation Items */}
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5 }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: 'white',
                      px: 2.5,
                      py: 1,
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)'
                        : 'transparent',
                      backdropFilter: isActive ? 'blur(10px)' : 'none',
                      border: isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                      boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                        backdropFilter: 'blur(10px)',
                        transform: 'translateY(-2px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                      },
                      '&::before': isActive ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, white, transparent)',
                        borderRadius: '2px',
                      } : {},
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
              <LanguageSelector />
              
              <Chip
                icon={<Person sx={{ color: 'white !important' }} />}
                label={user?.full_name || user?.email || t('common.teacher') || 'Teacher'}
                sx={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  height: 36,
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
              
              <IconButton
                size="large"
                onClick={handleMenu}
                sx={{
                  width: 45,
                  height: 45,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)',
                    transform: 'rotate(180deg)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(user?.full_name || user?.email)}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    mt: 1.5,
                    minWidth: 220,
                    borderRadius: '16px',
                    overflow: 'visible',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid',
                    borderColor: alpha('#7C3AED', 0.1),
                    boxShadow: '0 8px 32px rgba(124, 58, 237, 0.15)',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 20,
                      width: 12,
                      height: 12,
                      bgcolor: '#ffffff',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                      borderLeft: '1px solid',
                      borderTop: '1px solid',
                      borderColor: alpha('#7C3AED', 0.1),
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
                    {user?.full_name || 'Teacher'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    {user?.email}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 0.5 }} />
                
                <MenuItem 
                  onClick={handleClose}
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    borderRadius: '8px',
                    mx: 1,
                    my: 0.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3b82f615 0%, #60a5fa15 100%)',
                    }
                  }}
                >
                  <Settings sx={{ mr: 1.5, color: '#7C3AED', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('nav.settings')}</Typography>
                </MenuItem>
                
                <Divider sx={{ my: 0.5 }} />
                
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    borderRadius: '8px',
                    mx: 1,
                    my: 0.5,
                    color: '#EF4444',
                    '&:hover': {
                      background: alpha('#EF4444', 0.1),
                    }
                  }}
                >
                  <Logout sx={{ mr: 1.5, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('nav.logout')}</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar;
