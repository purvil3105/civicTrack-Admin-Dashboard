import React, { memo } from 'react'
import { Box, Typography, Paper, Chip } from '@mui/material'
import { LocationOn, Map } from '@mui/icons-material'

const PlaceholderMapsDashboard = ({ reports = [] }) => {
  const reportsWithLocation = reports.filter(report => 
    report.latitude && report.longitude
  )

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

  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Paper 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.50',
          border: '2px dashed',
          borderColor: 'grey.300',
          p: 3
        }}
      >
        <Map sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Interactive Map
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Google Maps integration will display report locations here
        </Typography>
        
        {reportsWithLocation.length > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.primary" gutterBottom>
              Reports with Location Data:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', maxWidth: 400 }}>
              {reportsWithLocation.slice(0, 5).map((report, index) => (
                <Chip
                  key={report.id}
                  label={`${getCategoryIcon(report.category)} ${report.title?.substring(0, 15)}...`}
                  color={getStatusColor(report.status)}
                  size="small"
                  variant="outlined"
                />
              ))}
              {reportsWithLocation.length > 5 && (
                <Chip
                  label={`+${reportsWithLocation.length - 5} more`}
                  color="default"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          {reportsWithLocation.length} reports with GPS coordinates
        </Typography>
      </Paper>
    </Box>
  )
}

export default memo(PlaceholderMapsDashboard)
