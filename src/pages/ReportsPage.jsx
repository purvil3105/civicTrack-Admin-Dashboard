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
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ReportsPage = () => {
  const [currentTab, setCurrentTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [statusUpdateReport, setStatusUpdateReport] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })
  const [selectedReports, setSelectedReports] = useState([])

  const {
    reports,
    loading,
    error,
    updateReportStatus,
    updateMultipleReportsStatus,
    refetch
  } = useReports()

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
        filtered = reports.filter(
          (report) =>
            report.created_at.startsWith(todayStr) ||
            report.created_at.startsWith(yesterdayStr)
        )
        break
      case 1: // Pending
        filtered = reports.filter((report) => report.status === 'pending')
        break
      case 2: // In Progress
        filtered = reports.filter((report) => report.status === 'in_progress')
        break
      case 3: // History (All)
        filtered = reports
        break
      default:
        filtered = reports
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((report) => report.status === statusFilter)
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((report) => report.category === categoryFilter)
    }

    return filtered.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  }, [reports, currentTab, searchTerm, statusFilter, categoryFilter])

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue)
  }

  const handleViewReport = useCallback((report) => {
    setSelectedReport(report)
    setShowDetailModal(true)
  }, [])

  const handleUpdateStatus = useCallback(
    async (reportId, newStatus) => {
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
    },
    [updateReportStatus]
  )

  const handleSelect = (reportId) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    )
  }

  const handleSelectAll = (checked, pageIds) => {
    if (checked) {
      setSelectedReports((prev) => [...new Set([...prev, ...pageIds])])
    } else {
      setSelectedReports((prev) => prev.filter((id) => !pageIds.includes(id)))
    }
  }

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      const result = await updateMultipleReportsStatus(
        selectedReports,
        newStatus
      )
      if (result.success) {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        })
        setSelectedReports([])
      } else {
        setSnackbar({ open: true, message: result.message, severity: 'error' })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating reports: ${error.message}`,
        severity: 'error'
      })
    }
  }

  const handleExportCSV = () => {
    const csvData = filteredReports.map((report) => ({
      ID: report.id,
      Title: report.title,
      Category: report.category,
      Status: report.status,
      Address: report.address || 'N/A',
      Date: new Date(report.created_at).toLocaleDateString()
    }))
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reports_export_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text('IssueSpotter Reports Export', 14, 15)

    const tableColumn = ['ID', 'Title', 'Category', 'Status', 'Date']
    const tableRows = []

    filteredReports.forEach((report) => {
      const reportData = [
        report.id.substring(0, 8),
        report.title,
        report.category,
        report.status,
        new Date(report.created_at).toLocaleDateString()
      ]
      tableRows.push(reportData)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    })

    doc.save(`reports_export_${new Date().getTime()}.pdf`)
  }

  const getTabCounts = useMemo(() => {
    if (!reports) return { recent: 0, pending: 0, inProgress: 0, total: 0 }

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    return {
      recent: reports.filter(
        (r) =>
          r.created_at.startsWith(today) ||
          r.created_at.startsWith(yesterdayStr)
      ).length,
      pending: reports.filter((r) => r.status === 'pending').length,
      inProgress: reports.filter((r) => r.status === 'in_progress').length,
      total: reports.length
    }
  }, [reports])

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Error loading reports: {error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4, width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ color: '#1976d2' }}
        >
          Reports Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and review all issue reports submitted by citizens
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '2fr 1fr 1fr 1fr'
            },
            gap: 2,
            alignItems: 'center'
          }}
        >
          <TextField
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
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
              <MenuItem value="ROADS">ROADS</MenuItem>
              <MenuItem value="LIGHTING">LIGHTING</MenuItem>
              <MenuItem value="WATER_SUPPLY">WATER SUPPLY</MenuItem>
              <MenuItem value="CLEANLINESS">CLEANLINESS</MenuItem>
              <MenuItem value="PUBLIC_SAFETY">PUBLIC SAFETY</MenuItem>
              <MenuItem value="OBSTRUCTION">OBSTRUCTION</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleExportCSV}
              disabled={loading || filteredReports.length === 0}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportPDF}
              disabled={loading || filteredReports.length === 0}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              onClick={refetch}
              disabled={loading}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="reports tabs"
        >
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

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'primary.light',
            color: 'primary.contrastText'
          }}
        >
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {selectedReports.length} report
            {selectedReports.length > 1 ? 's' : ''} selected
          </Typography>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleBulkStatusUpdate('in_progress')}
            startIcon={<PlayArrow />}
            sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
          >
            Mark In Progress
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleBulkStatusUpdate('resolved')}
            startIcon={<CheckCircle />}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
          >
            Mark Resolved
          </Button>
        </Paper>
      )}

      {/* Reports Table */}
      <Paper sx={{ p: 3 }}>
        <ReportsTable
          reports={filteredReports}
          loading={loading}
          onViewReport={handleViewReport}
          onUpdateStatus={handleUpdateStatus}
          selected={selectedReports}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
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
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ReportsPage
