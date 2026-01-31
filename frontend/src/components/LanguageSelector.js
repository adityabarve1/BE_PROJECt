import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          width: 45,
          height: 45,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.3)',
          color: 'white',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)',
            transform: 'scale(1.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          },
        }}
      >
        <LanguageIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: '16px',
            overflow: 'visible',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid',
            borderColor: alpha('#3b82f6', 0.1),
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
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
              borderColor: alpha('#3b82f6', 0.1),
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={i18n.language === language.code}
            sx={{
              py: 1.5,
              px: 2,
              borderRadius: '8px',
              mx: 1,
              my: 0.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #3b82f615 0%, #60a5fa15 100%)',
              },
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, #3b82f620 0%, #60a5fa20 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3b82f630 0%, #60a5fa30 100%)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, fontSize: '1.5rem' }}>
              {language.flag}
            </ListItemIcon>
            <ListItemText
              primary={language.name}
              primaryTypographyProps={{
                fontWeight: i18n.language === language.code ? 700 : 600,
                fontSize: '0.95rem',
              }}
            />
            {i18n.language === language.code && (
              <CheckIcon sx={{ ml: 1, color: '#3b82f6', fontSize: 20 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;
