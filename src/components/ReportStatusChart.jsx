import React from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'

const getColorForStatus = (status) => {
  const colors = {
    pending: 'warning',
    inProgress: 'info', 
    resolved: 'success',
    rejected: 'error'
  }
  return colors[status] || 'primary'
}

const ReportStatusChart = React.memo(({ data }) => {
  const total = React.useMemo(() => 
    data.pending + data.inProgress + data.resolved + data.rejected, 
    [data.pending, data.inProgress, data.resolved, data.rejected]
  )

  const statusData = React.useMemo(() => [
    { label: 'Pending', value: data.pending, color: 'warning' },
    { label: 'In Progress', value: data.inProgress, color: 'info' },
    { label: 'Resolved', value: data.resolved, color: 'success' },
    { label: 'Rejected', value: data.rejected, color: 'error' }
  ], [data.pending, data.inProgress, data.resolved, data.rejected])

  const getPercentage = React.useCallback((value) => (value / total) * 100, [total])

  if (total === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data to display
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, contain: 'layout style' }}>
      <Typography variant="h6" gutterBottom>
        Report Status Distribution
      </Typography>
      
      {statusData.map((item) => (
        <Box key={item.label} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">{item.label}</Typography>
            <Typography variant="body2">
              {item.value} ({getPercentage(item.value).toFixed(1)}%)
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getPercentage(item.value)} 
            color={item.color}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      ))}
    </Box>
  )
})

ReportStatusChart.displayName = 'ReportStatusChart'

export default ReportStatusChart
