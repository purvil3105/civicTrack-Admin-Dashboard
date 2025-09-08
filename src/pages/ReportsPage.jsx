import React, { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Search,
  FilterList,
  Refresh,
  CheckCircle,
  Cancel,
  Visibility,
  PlayArrow,
  Schedule,
  Today,
  History
} from '@mui/icons-material'
import { useReports } from '../hooks/useData'
import ReportsTable from '../components/ReportsTable'
import ReportDetailModal from '../components/ReportDetailModal'
import { formatDistanceToNow } from 'date-fns'

const ReportsPage = () => {
  const [currentTab, setCurrentTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [statusUpdateReport, setStatusUpdateReport] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const { reports, loading, error, updateReportStatus, updateMultipleReportsStatus, refetch } = useReports()

  // Filter reports based on tab selection
  const filteredReports = useMemo(() => {
    if (!reports) return []

    let filtered = reports

    // Apply tab filters
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    switch (currentTab) {
      case 0: // Recent/Today
        filtered = reports.filter(report => 
          report.created_at.startsWith(todayStr) || 
          report.created_at.startsWith(yesterdayStr)
        )
        break
      case 1: // Pending
        filtered = reports.filter(report => report.status === 'pending')
        break
      case 2: // In Progress
        filtered = reports.filter(report => report.status === 'in_progress')
        break
      case 3: // History (All)
        filtered = reports
        break
      default:
        filtered = reports
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter)
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(report => report.category === categoryFilter)
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [reports, currentTab, searchTerm, statusFilter, categoryFilter])

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue)
  }

  const handleViewReport = useCallback((report) => {
    setSelectedReport(report)
    setShowDetailModal(true)
  }, [])

  const handleUpdateStatus = useCallback(async (reportId, newStatus) => {
    try {
      const result = await updateReportStatus(reportId, newStatus)
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error'
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating status: ${error.message}`,
        severity: 'error'
      })
    }
  }, [updateReportStatus])

  const getTabCounts = useMemo(() => {
    if (!reports) return { recent: 0, pending: 0, inProgress: 0, total: 0 }

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    return {
      recent: reports.filter(r => 
        r.created_at.startsWith(today) || r.created_at.startsWith(yesterdayStr)
      ).length,
      pending: reports.filter(r => r.status === 'pending').length,
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      total: reports.length
    }
  }, [reports])

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Error loading reports: {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4, width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2' }}>
          Reports Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and review all civic reports submitted by citizens
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: '2fr 1fr 1fr 1fr',
          },
          gap: 2,
          alignItems: 'center'
        }}>
          <TextField
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="roads">Roads</MenuItem>
              <MenuItem value="lighting">Lighting</MenuItem>
              <MenuItem value="water_supply">Water Supply</MenuItem>
              <MenuItem value="cleanliness">Cleanliness</MenuItem>
              <MenuItem value="public_safety">Public Safety</MenuItem>
              <MenuItem value="obstructions">Obstructions</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={refetch}
            disabled={loading}
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="reports tabs">
          <Tab 
            icon={<Today />} 
            label={`Recent (${getTabCounts.recent})`}
            iconPosition="start"
          />
          <Tab 
            icon={<Schedule />} 
            label={`Pending (${getTabCounts.pending})`}
            iconPosition="start"
          />
          <Tab 
            icon={<PlayArrow />} 
            label={`In Progress (${getTabCounts.inProgress})`}
            iconPosition="start"
          />
          <Tab 
            icon={<History />} 
            label={`History (${getTabCounts.total})`}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Reports Table */}
      <Paper sx={{ p: 3 }}>
        <ReportsTable
          reports={filteredReports}
          loading={loading}
          onViewReport={handleViewReport}
          onUpdateStatus={handleUpdateStatus}
        />
      </Paper>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          open={showDetailModal}
          report={selectedReport}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedReport(null)
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Status Update Dialog */}
      {statusUpdateReport && (
        <StatusUpdateDialog
          open={showStatusDialog}
          report={statusUpdateReport}
          onClose={() => {
            setShowStatusDialog(false)
            setStatusUpdateReport(null)
          }}
          onUpdateStatus={handleUpdateStatus}
          loading={loading}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ReportsPage
