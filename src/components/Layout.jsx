import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material'
import Sidebar from './Sidebar'
import Header from './Header'

const DRAWER_WIDTH = 280

const Layout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isMobile={isMobile}
      />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: 'background.default'
        }}
      >
        <Header 
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={DRAWER_WIDTH}
        />
        
        {/* Page content */}
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
