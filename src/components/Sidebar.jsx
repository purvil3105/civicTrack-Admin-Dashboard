import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Chip
} from '@mui/material'
import {
  Dashboard,
  ReportProblem,
  Analytics,
  Settings
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { getInitials, generateAvatarColor } from '../utils/helpers'

const navigationItems = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: Dashboard
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: ReportProblem
  },
  {
    title: 'Analytics',
    path: '/analytics',
    icon: Analytics
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings
  }
]

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle, isMobile }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { adminProfile, user } = useAuth()

  const handleNavigation = (path) => {
    navigate(path)
    if (isMobile) {
      handleDrawerToggle()
    }
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            mb: 2,
            overflow: 'hidden'
          }}
        >
          <img 
            src="/src/assets/app_logo1.png" 
            alt="CivicTrack Logo" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }} 
          />
        </Box>
        <Typography variant="h6" component="h1" gutterBottom>
          CivicTrack
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Admin Dashboard
        </Typography>
      </Box>

      <Divider />

      {/* Admin Profile */}
      {adminProfile && (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: generateAvatarColor(adminProfile.full_name || user?.email || ''),
                width: 40,
                height: 40
              }}
            >
              {getInitials(adminProfile.full_name || user?.email || '')}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {adminProfile.full_name || 'Admin User'}
              </Typography>
              <Typography variant="caption" color="textSecondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Box>
          
          {adminProfile.role && (
            <Chip
              label={adminProfile.role.replace('_', ' ').toUpperCase()}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
          
          {adminProfile.departments && (
            <Typography variant="caption" color="textSecondary" display="block">
              {adminProfile.departments.name}
            </Typography>
          )}
        </Box>
      )}

      <Divider />

      {/* Navigation */}
      <Box sx={{ flex: 1, pt: 1 }}>
        <List sx={{ px: 2 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path
            const IconComponent = item.icon

            return (
              <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'white' : 'text.secondary',
                      minWidth: 40
                    }}
                  >
                    <IconComponent />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          CivicTrack v1.0.0
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth
          }
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}

export default Sidebar
