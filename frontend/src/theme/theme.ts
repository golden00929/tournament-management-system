import { createTheme } from '@mui/material/styles';
import { koKR } from '@mui/material/locale';

// Miiracer Brand Colors
const miiracerColors = {
  primary: '#E31E1E',     // Miiracer Red
  secondary: '#2C2C2C',   // Miiracer Dark
  accent: '#FF4444',      // Lighter Red for accents
  success: '#00C851',     // Green for success states
  warning: '#FF8800',     // Orange for warnings
  error: '#DC3545',       // Error red
  info: '#007BFF',        // Blue for info
  light: '#F8F9FA',       // Light background
  dark: '#1A1A1A',        // Dark background
};

export const miiracerTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: miiracerColors.primary,
      light: '#FF5555',
      dark: '#B71C1C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: miiracerColors.secondary,
      light: '#424242',
      dark: '#1A1A1A',
      contrastText: '#FFFFFF',
    },
    success: {
      main: miiracerColors.success,
      light: '#4CAF50',
      dark: '#388E3C',
    },
    warning: {
      main: miiracerColors.warning,
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: miiracerColors.error,
      light: '#EF5350',
      dark: '#C62828',
    },
    info: {
      main: miiracerColors.info,
      light: '#42A5F5',
      dark: '#1976D2',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: miiracerColors.secondary,
      secondary: '#666666',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: [
      '"Noto Sans KR"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: miiracerColors.secondary,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: miiracerColors.secondary,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: miiracerColors.secondary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: miiracerColors.secondary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: miiracerColors.secondary,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: miiracerColors.secondary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    // App Bar
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: miiracerColors.primary,
          boxShadow: '0 4px 12px rgba(227, 30, 30, 0.15)',
          backgroundImage: 'linear-gradient(135deg, #E31E1E 0%, #B71C1C 100%)',
        },
      },
    },
    // Buttons
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${miiracerColors.primary} 0%, #B71C1C 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, #B71C1C 0%, #9A0007 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${miiracerColors.secondary} 0%, #1A1A1A 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, #1A1A1A 0%, #000000 100%)`,
          },
        },
      },
    },
    // Cards
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #F0F0F0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    // Chips
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: miiracerColors.primary,
          color: '#FFFFFF',
        },
        colorSecondary: {
          backgroundColor: miiracerColors.secondary,
          color: '#FFFFFF',
        },
      },
    },
    // Table
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8F9FA',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: miiracerColors.secondary,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#FAFAFA',
          },
          '&:hover': {
            backgroundColor: '#F5F5F5',
          },
        },
      },
    },
    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        },
        elevation3: {
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        },
      },
    },
    // Drawer
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E0E0E0',
        },
      },
    },
    // List Items
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: `${miiracerColors.primary}15`,
            color: miiracerColors.primary,
            '& .MuiListItemIcon-root': {
              color: miiracerColors.primary,
            },
            '&:hover': {
              backgroundColor: `${miiracerColors.primary}20`,
            },
          },
        },
      },
    },
    // TextField
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: miiracerColors.primary,
              borderWidth: 2,
            },
          },
        },
      },
    },
  },
}, koKR);

export default miiracerTheme;