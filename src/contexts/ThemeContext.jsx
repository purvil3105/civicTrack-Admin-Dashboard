/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react'
import {
  ThemeProvider as MuiThemeProvider,
  createTheme
} from '@mui/material/styles'

const ThemeContext = createContext()

export const useThemeContext = () => {
  return useContext(ThemeContext)
}

export const ThemeContextProvider = ({ children }) => {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#1976d2'
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff'
          }
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
        }
      }),
    []
  )

  // We keep mode and toggleTheme in the context value so any downstream components don't crash,
  // but toggleTheme is now a no-op.
  return (
    <ThemeContext.Provider value={{ mode: 'light', toggleTheme: () => {} }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
