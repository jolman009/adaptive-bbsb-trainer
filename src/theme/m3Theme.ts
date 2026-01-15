import { createTheme } from '@mui/material/styles';

/**
 * Material Design 3-inspired theme configuration
 * Based on Google's Material Design 3 guidelines
 * https://m3.material.io/
 */
export const m3Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#006FEE',
      light: '#5B9EFF',
      dark: '#004BD6',
      contrastText: '#fff',
    },
    secondary: {
      main: '#03DAC6',
      light: '#66F9FF',
      dark: '#0088AC',
      contrastText: '#000',
    },
    error: {
      main: '#CF6679',
      light: '#F1B0BB',
      dark: '#B3261E',
    },
    warning: {
      main: '#F57C00',
      light: '#FFA040',
      dark: '#E65100',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    background: {
      default: '#FFFBFE',
      paper: '#FFFBFE',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.015625rem',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '0rem',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '0rem',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '0.009375rem',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: '0rem',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 700,
      letterSpacing: '0.03125rem',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.03125rem',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.0125rem',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.0625rem',
      textTransform: 'uppercase',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      letterSpacing: '0.0375rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});
