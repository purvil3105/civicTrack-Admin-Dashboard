import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar
} from '@mui/material'

const getColorValue = (color) => {
  const colors = {
    primary: '#1976d2',
    warning: '#ed6c02',
    info: '#0288d1',
    success: '#2e7d32',
    error: '#d32f2f'
  }
  return colors[color] || colors.primary
}

const StatsCard = React.memo(({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend,
  subtitle 
}) => {
  const colorValue = React.useMemo(() => getColorValue(color), [color])

  return (
    <Card 
      className="card-hover"
      sx={{ 
        height: '100%',
        background: 'linear-gradient(45deg, #ffffff 30%, #f8f9fa 90%)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        contain: 'layout style',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: colorValue,
              width: 56,
              height: 56,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: colorValue, fontWeight: 'bold' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
        </Box>
        
        {(trend || subtitle) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography variant="body2" color="text.secondary">
                {trend}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

export default StatsCard
