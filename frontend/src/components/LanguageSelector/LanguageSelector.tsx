import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Language as LanguageIcon,
} from '@mui/icons-material';

interface LanguageSelectorProps {
  darkMode?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ darkMode = false }) => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    
    // localStorage에 언어 설정 저장
    localStorage.setItem('i18nextLng', newLanguage);
  };

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  // 다크 테마 색상
  const darkTheme = {
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    accent: {
      primary: '#bb86fc',
      secondary: '#03dac6',
    },
    background: {
      primary: '#121212',
      secondary: '#1e1e1e',
      tertiary: '#2d2d2d',
    },
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        displayEmpty
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: darkMode ? darkTheme.text.primary : 'inherit',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: darkMode ? alpha(darkTheme.text.secondary, 0.3) : 'rgba(0, 0, 0, 0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: darkMode ? darkTheme.accent.primary : 'rgba(0, 0, 0, 0.23)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: darkMode ? darkTheme.accent.primary : 'primary.main',
          },
          '& .MuiSelect-icon': {
            color: darkMode ? darkTheme.text.secondary : 'inherit',
          },
        }}
        startAdornment={
          <LanguageIcon sx={{ 
            color: darkMode ? darkTheme.accent.primary : 'action.active', 
            mr: 1, 
            fontSize: 20 
          }} />
        }
        MenuProps={{
          PaperProps: {
            sx: darkMode ? {
              bgcolor: darkTheme.background.secondary,
              color: darkTheme.text.primary,
              border: `1px solid ${alpha(darkTheme.text.secondary, 0.2)}`,
            } : {},
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem 
            key={lang.code} 
            value={lang.code}
            sx={darkMode ? {
              color: darkTheme.text.primary,
              '&:hover': {
                bgcolor: alpha(darkTheme.accent.primary, 0.1),
              },
              '&.Mui-selected': {
                bgcolor: alpha(darkTheme.accent.primary, 0.2),
                '&:hover': {
                  bgcolor: alpha(darkTheme.accent.primary, 0.3),
                },
              },
            } : {}}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography component="span" sx={{ fontSize: '1.2em' }}>
                {lang.flag}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? darkTheme.text.primary : 'inherit' 
                }}
              >
                {lang.name}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;