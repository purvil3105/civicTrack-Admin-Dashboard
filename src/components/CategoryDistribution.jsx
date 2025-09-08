import React from 'react'
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { Circle } from '@mui/icons-material'

const categoryLabels = {
  roads: 'Roads',
  lighting: 'Lighting',
  water_supply: 'Water Supply',
  cleanliness: 'Cleanliness',
  public_safety: 'Public Safety',
  obstructions: 'Obstructions'
}

const colors = [
  '#1976d2', // primary
  '#dc004e', // secondary
  '#2e7d32', // success
  '#ed6c02', // warning
  '#d32f2f', // error
  '#0288d1'  // info
]

const CategoryDistribution = React.memo(({ reports = [] }) => {
  // Memoize category counts calculation
  const categoryCounts = React.useMemo(() => {
    return reports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1
      return acc
    }, {})
  }, [reports])

  const entries = React.useMemo(() => Object.entries(categoryCounts), [categoryCounts])

  if (!reports.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ contain: 'layout style' }}>
      <Typography variant="h6" gutterBottom>
        Category Breakdown
      </Typography>
      
      <List dense>
        {entries.map(([category, count], index) => (
          <ListItem key={category} sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Circle sx={{ color: colors[index % colors.length], fontSize: 12 }} />
            </ListItemIcon>
            <ListItemText 
              primary={categoryLabels[category] || category}
              secondary={`${count} reports`}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Total Categories: {entries.length}
        </Typography>
      </Box>
    </Box>
  )
})

CategoryDistribution.displayName = 'CategoryDistribution'

export default CategoryDistribution
