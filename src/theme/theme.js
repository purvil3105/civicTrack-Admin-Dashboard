import { createTheme } from '@mui/material/styles'

// CivicTrack Color Palette (inspired by civic/government themes)
const palette = {
  primary: {
    main: '#2563eb', // Blue - trustworthy, professional
    light: '#60a5fa',
    dark: '#1d4ed8',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#059669', // Green - growth, positivity
    light: '#34d399',
    dark: '#047857',
    contrastText: '#ffffff'
  },
  error: {
    main: '#dc2626', // Red for urgent issues
    light: '#f87171',
    dark: '#b91c1c'
  },
  warning: {
    main: '#d97706', // Orange for medium priority
    light: '#fbbf24',
    dark: '#b45309'
  },
  info: {
    main: '#0891b2', // Cyan for information
    light: '#67e8f9',
    dark: '#0e7490'
  },
  success: {
    main: '#059669', // Green for resolved issues
    light: '#34d399',
    dark: '#047857'
  },
  grey: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    ...palette,
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1f2937'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1f2937'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1f2937'
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1f2937'
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#1f2937'
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1f2937'
    },
    body1: {
      fontSize: '1rem',
      color: '#4b5563'
    },
    body2: {
      fontSize: '0.875rem',
      color: '#6b7280'
    }
  },
  shape: {
    borderRadius: 12
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    ...Array(18).fill('0 25px 50px -12px rgb(0 0 0 / 0.25)')
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '10px 20px'
        },
        contained: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1f2937',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          borderBottom: '1px solid #e5e7eb'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e5e7eb',
          backgroundColor: '#ffffff'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f9fafb'
        }
      }
    }
  }
})

// Status colors for reports
export const statusColors = {
  pending: {
    color: palette.warning.main,
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b'
  },
  in_progress: {
    color: palette.info.main,
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6'
  },
  resolved: {
    color: palette.success.main,
    backgroundColor: '#d1fae5',
    borderColor: '#10b981'
  },
  rejected: {
    color: palette.error.main,
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444'
  }
}

// Priority colors
export const priorityColors = {
  low: {
    color: '#6b7280',
    backgroundColor: '#f3f4f6'
  },
  medium: {
    color: '#d97706',
    backgroundColor: '#fef3c7'
  },
  high: {
    color: '#dc2626',
    backgroundColor: '#fee2e2'
  },
  urgent: {
    color: '#7c2d12',
    backgroundColor: '#fed7aa'
  }
}
