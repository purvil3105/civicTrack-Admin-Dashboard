import React, { useState, memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Skeleton,
  Card
} from '@mui/material'
import {
  Visibility,
  LocationOn,
  Schedule,
  MoreVert,
  CheckCircle,
  PlayArrow,
  Cancel,
  Image as ImageIcon
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

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent':
      return '#dc2626'
    case 'high':
      return '#ea580c'
    case 'medium':
      return '#d97706'
    case 'low':
      return '#6b7280'
    default:
      return '#6b7280'
  }
}

const StatusActionMenu = memo(({ report, onUpdateStatus, anchorEl, open, onClose }) => {
  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(report.id, newStatus)
    onClose()
  }

  const statusOptions = [
    { status: 'pending', label: 'Pending', icon: <Schedule />, color: '#ff9800' },
    { status: 'in_progress', label: 'In Progress', icon: <PlayArrow />, color: '#2196f3' },
    { status: 'resolved', label: 'Resolved', icon: <CheckCircle />, color: '#4caf50' },
    { status: 'rejected', label: 'Rejected', icon: <Cancel />, color: '#f44336' }
  ]

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { minWidth: 200 }
      }}
    >
      {statusOptions
        .filter(option => option.status !== report.status) // Don't show current status
        .map((option) => (
          <MenuItem 
            key={option.status}
            onClick={() => handleStatusUpdate(option.status)}
            sx={{ gap: 1 }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: option.color
              }}
            />
            {option.icon}
            {option.label}
          </MenuItem>
        ))}
    </Menu>
  )
})

const ReportRow = memo(({ report, onViewReport, onUpdateStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const menuOpen = Boolean(anchorEl)

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <TableRow 
      sx={{ 
        '&:hover': { 
          backgroundColor: 'action.hover' 
        }
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 40, height: 40, fontSize: '1rem' }}>
            {getCategoryIcon(report.category)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200, fontWeight: 600 }}>
              {report.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {report.id.slice(0, 8)}...
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {report.category.replace('_', ' ')}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={report.status.replace('_', ' ')}
          color={getStatusColor(report.status)}
          size="small"
          sx={{ textTransform: 'capitalize', fontWeight: 500 }}
        />
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule fontSize="small" color="action" />
          <Typography variant="caption">
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        {report.address ? (
          <Tooltip title={report.address}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="caption" noWrap sx={{ maxWidth: 150 }}>
                {report.address}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No address
          </Typography>
        )}
      </TableCell>

      <TableCell>
        {report.image_url && (
          <Tooltip title="Has image attachment">
            <ImageIcon fontSize="small" color="primary" />
          </Tooltip>
        )}
      </TableCell>

      <TableCell align="right">
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onViewReport(report)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Update Status">
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <StatusActionMenu
          report={report}
          onUpdateStatus={onUpdateStatus}
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
        />
      </TableCell>
    </TableRow>
  )
})

const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box>
              <Skeleton variant="text" width={150} />
              <Skeleton variant="text" width={100} />
            </Box>
          </Box>
        </TableCell>
        <TableCell><Skeleton variant="text" width={80} /></TableCell>
        <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
        <TableCell><Skeleton variant="text" width={100} /></TableCell>
        <TableCell><Skeleton variant="text" width={120} /></TableCell>
        <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
        <TableCell><Skeleton variant="text" width={60} /></TableCell>
      </TableRow>
    ))}
  </>
)

const ReportsTable = ({ reports, loading, onViewReport, onUpdateStatus }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedReports = reports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (!loading && reports.length === 0) {
    return (
      <Card sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Reports Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No reports match your current filters. Try adjusting your search criteria.
        </Typography>
      </Card>
    )
  }

  return (
    <Box>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Report</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Image</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              paginatedReports.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  onViewReport={onViewReport}
                  onUpdateStatus={onUpdateStatus}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && reports.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={reports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Box>
  )
}

export default memo(ReportsTable)
