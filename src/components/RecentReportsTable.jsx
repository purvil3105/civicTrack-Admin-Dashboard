import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Visibility,
  LocationOn,
  Schedule
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'

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

const RecentReportsTable = ({ reports = [] }) => {
  // Memoize expensive operations
  const processedReports = useMemo(() => {
    return reports.map(report => ({
      ...report,
      timeAgo: formatDistanceToNow(new Date(report.created_at), { addSuffix: true }),
      categoryIcon: getCategoryIcon(report.category),
      statusColor: getStatusColor(report.status)
    }))
  }, [reports])

  if (!reports.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No recent reports found
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Report</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processedReports.map((report) => (
            <TableRow 
              key={report.id}
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'action.hover' 
                }
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                    {report.categoryIcon}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
                      {report.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {report.timeAgo}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={report.status.replace('_', ' ')}
                  color={report.statusColor}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                  <Tooltip title="View Details">
                    <IconButton size="small" color="primary">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {report.latitude && report.longitude && (
                    <Tooltip title="View Location">
                      <IconButton size="small" color="secondary">
                        <LocationOn fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default RecentReportsTable
