import React, { useState, memo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  Card,
  CardMedia,
  IconButton,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import {
  Close,
  LocationOn,
  Schedule,
  Person,
  Category,
  Description,
  Image as ImageIcon,
  Phone,
  Email,
  MoreVert,
  CheckCircle,
  PlayArrow,
  Cancel,
  Flag,
  Directions as DirectionsIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material'
import { formatDistanceToNow, format } from 'date-fns'
import InteractiveMap from './InteractiveMap'
import { 
  openInGoogleMaps, 
  getDirectionsToLocation, 
  shareLocation, 
  copyLocationToClipboard,
  formatCoordinates 
} from '../utils/locationUtils'

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'in_progress':
      return 'info'
    case 'resolved':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'default'
  }
}

const getCategoryIcon = (category) => {
  const iconMap = {
    roads: '🛣️',
    lighting: '💡',
    water_supply: '💧',
    cleanliness: '🧹',
    public_safety: '🛡️',
    obstructions: '⚠️'
  }
  return iconMap[category] || '📋'
}

const LocationActions = memo(({ latitude, longitude, title, address }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleOpenInMaps = () => {
    const success = openInGoogleMaps(latitude, longitude, title)
    if (success) {
      showSnackbar('Opening location in Google Maps...')
    } else {
      showSnackbar('Failed to open Google Maps', 'error')
    }
  }

  const handleGetDirections = () => {
    const success = getDirectionsToLocation(latitude, longitude, title)
    if (success) {
      showSnackbar('Opening directions in Google Maps...')
    } else {
      showSnackbar('Failed to open directions', 'error')
    }
  }

  const handleShareLocation = async () => {
    const result = await shareLocation(latitude, longitude, title, address)
    if (result.success) {
      if (result.method === 'native') {
        showSnackbar('Location shared successfully!')
      } else {
        showSnackbar('Location copied to clipboard!')
      }
    } else {
      showSnackbar('Failed to share location', 'error')
    }
  }

  const handleCopyCoordinates = async () => {
    const result = await copyLocationToClipboard(latitude, longitude, address, title)
    if (result.success) {
      showSnackbar('Location details copied to clipboard!')
    } else {
      showSnackbar('Failed to copy to clipboard', 'error')
    }
  }

  // Don't render if no valid coordinates
  if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
    return null
  }

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Location Actions:
        </Typography>
        <ButtonGroup 
          variant="outlined" 
          size="small" 
          orientation="vertical"
          fullWidth
          sx={{ mb: 1 }}
        >
          <Button
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenInMaps}
          >
            Open in Google Maps
          </Button>
          <Button
            startIcon={<DirectionsIcon />}
            onClick={handleGetDirections}
          >
            Get Directions
          </Button>
        </ButtonGroup>
        
        <ButtonGroup 
          variant="outlined" 
          size="small" 
          orientation="vertical"
          fullWidth
        >
          <Button
            startIcon={<ShareIcon />}
            onClick={handleShareLocation}
          >
            Share Location
          </Button>
          <Button
            startIcon={<CopyIcon />}
            onClick={handleCopyCoordinates}
          >
            Copy Details
          </Button>
        </ButtonGroup>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
})

const StatusDropdown = memo(({ report, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(report.status)

  const handleStatusChange = (event) => {
    const newStatus = event.target.value
    setSelectedStatus(newStatus)
    onUpdateStatus(report.id, newStatus)
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#ff9800' },
    { value: 'in_progress', label: 'In Progress', color: '#2196f3' },
    { value: 'resolved', label: 'Resolved', color: '#4caf50' },
    { value: 'rejected', label: 'Rejected', color: '#f44336' }
  ]

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Status</InputLabel>
      <Select
        value={selectedStatus}
        label="Status"
        onChange={handleStatusChange}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: option.color
                }}
              />
              {option.label}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
})

const ReportDetailModal = ({ open, report, onClose, onUpdateStatus }) => {
  if (!report) return null

  const reportLocation = report.latitude && report.longitude 
    ? [{ ...report }] 
    : []

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1976d2' }}>
          {getCategoryIcon(report.category)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div">
            {report.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Report ID: {report.id}
          </Typography>
        </Box>
        <Chip
          label={report.status.replace('_', ' ')}
          color={getStatusColor(report.status)}
          sx={{ textTransform: 'capitalize', fontWeight: 500 }}
        />
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'grey.500' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          height: '100%' 
        }}>
          {/* Left Panel - Report Details */}
          <Paper sx={{ p: 3, borderRadius: 0, height: 'fit-content' }}>
            {/* Basic Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Report Details
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Category />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Category" 
                    secondary={report.category.replace('_', ' ').toUpperCase()}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Reported" 
                    secondary={`${format(new Date(report.created_at), 'PPp')} (${formatDistanceToNow(new Date(report.created_at), { addSuffix: true })})`}
                  />
                </ListItem>

                {report.updated_at && report.updated_at !== report.created_at && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={`${format(new Date(report.updated_at), 'PPp')} (${formatDistanceToNow(new Date(report.updated_at), { addSuffix: true })})`}
                    />
                  </ListItem>
                )}

                {report.user_id && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Reported By" 
                      secondary={`User ID: ${report.user_id}`}
                    />
                  </ListItem>
                )}

                {report.address && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Location" 
                      secondary={report.address}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" sx={{ 
                lineHeight: 1.6,
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                {report.description || 'No description provided'}
              </Typography>
            </Box>

            {/* Image */}
            {report.image_url && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Attachment
                  </Typography>
                  <Card sx={{ maxWidth: 400 }}>
                    <CardMedia
                      component="img"
                      image={report.image_url}
                      alt="Report attachment"
                      sx={{ 
                        height: 250,
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(report.image_url, '_blank')}
                    />
                  </Card>
                </Box>
              </>
            )}
          </Paper>

          {/* Right Panel - Map */}
          <Paper sx={{ p: 3, borderRadius: 0 }}>
            <Typography variant="h6" gutterBottom>
              Location on Map
            </Typography>
            
            {reportLocation.length > 0 ? (
              <Box sx={{ height: 400, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                <InteractiveMap reports={reportLocation} height={400} />
              </Box>
            ) : (
              <Paper sx={{ 
                height: 400, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'grey.300'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <LocationOn sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Location Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This report doesn't have GPS coordinates
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Coordinates & Location Actions */}
            {report.latitude && report.longitude && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  GPS Coordinates:
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatCoordinates(report.latitude, report.longitude)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Lat: {report.latitude} | Lng: {report.longitude}
                </Typography>
                
                <LocationActions 
                  latitude={report.latitude}
                  longitude={report.longitude}
                  title={report.title}
                  address={report.address}
                />
              </Box>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button onClick={onClose}>
          Close
        </Button>
        
        <StatusDropdown 
          report={report} 
          onUpdateStatus={onUpdateStatus}
        />
      </DialogActions>
    </Dialog>
  )
}

export default memo(ReportDetailModal)
