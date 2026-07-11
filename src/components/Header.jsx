import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Button,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Person,
  LightMode,
  DarkMode
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { getInitials, generateAvatarColor } from '../utils/helpers'
import { useReports } from '../hooks/useData'
import { useNavigate } from 'react-router-dom'

const Header = ({ handleDrawerToggle, isMobile }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationsAnchor, setNotificationsAnchor] = useState(null)
  const { user, adminProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const { reports } = useReports({ status: 'pending' })

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget)
  }

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null)
  }

  const handleSignOut = async () => {
    handleProfileMenuClose()
    await signOut()
  }

  const handleSettingsClick = () => {
    handleProfileMenuClose()
    navigate('/settings')
  }

  const handleProfileClick = () => {
    handleProfileMenuClose()
    // For now, we just rely on the info shown in the dropdown menu
    alert(`Signed in as: ${adminProfile?.full_name || user?.email}`)
  }

  const recentNotifications = reports ? reports.slice(0, 5) : []
  const unreadCount = recentNotifications.length

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Page title */}
        <Typography
          variant="h6"
          component="h1"
          sx={{
            flexGrow: 1,
            color: 'text.primary',
            fontWeight: 600
          }}
        >
          {getPageTitle()}
        </Typography>

        {/* Header actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
              sx={{ color: 'text.primary' }}
              aria-label="Open notifications menu"
              aria-expanded={Boolean(notificationsAnchor)}
              aria-haspopup="true"
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ p: 0, ml: 1 }}
              aria-label="Open profile menu"
              aria-expanded={Boolean(anchorEl)}
              aria-haspopup="true"
            >
              <Avatar
                sx={{
                  bgcolor: generateAvatarColor(
                    adminProfile?.full_name || user?.email || ''
                  ),
                  width: 36,
                  height: 36
                }}
              >
                {getInitials(adminProfile?.full_name || user?.email || '')}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 220,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* Profile info */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" noWrap>
              {adminProfile?.full_name || 'Admin User'}
            </Typography>
            <Typography variant="caption" color="textSecondary" noWrap>
              {user?.email}
            </Typography>
          </Box>

          <Divider />

          <MenuItem onClick={handleProfileClick}>
            <Person sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
            <Settings sx={{ mr: 2 }} />
            Settings
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleSignOut}>
            <Logout sx={{ mr: 2 }} />
            Sign Out
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={handleNotificationsClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 300,
              maxHeight: 400,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 75,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Notifications</Typography>
          </Box>

          {recentNotifications.length === 0 ? (
            <MenuItem onClick={handleNotificationsClose}>
              <Typography variant="body2" color="textSecondary">
                No pending reports
              </Typography>
            </MenuItem>
          ) : (
            recentNotifications.map((report) => (
              <MenuItem
                key={report.id}
                onClick={() => {
                  handleNotificationsClose()
                  navigate('/reports')
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    New: {report.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(report.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}

          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
            <Button fullWidth size="small">
              View All Notifications
            </Button>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

// Helper function to get page title based on current path
const getPageTitle = () => {
  const path = window.location.pathname
  const titleMap = {
    '/dashboard': 'Dashboard',
    '/reports': 'Reports Management',
    '/analytics': 'Analytics & Reports',
    '/departments': 'Departments',
    '/settings': 'Settings'
  }
  return titleMap[path] || 'IssueSpotter Admin'
}

export default Header
