import React, { useState, useEffect, memo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material'
import {
  DeleteSweep,
  Schedule,
  History,
  Warning,
  CheckCircle,
  PlayArrow,
  Stop,
  Refresh
} from '@mui/icons-material'
import { format, formatDistanceToNow } from 'date-fns'
import { reportCleanupService } from '../services/reportCleanupService'

const CleanupManagement = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cleanupInProgress, setCleanupInProgress] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [lastCleanupResult, setLastCleanupResult] = useState(null)
  const [error, setError] = useState(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      const result = await reportCleanupService.getCleanupStats()
      
      if (result.success) {
        setStats(result.data)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCleanup = async () => {
    try {
      setCleanupInProgress(true)
      setConfirmDialog(false)
      
      const result = await reportCleanupService.manualCleanup()
      setLastCleanupResult(result)
      
      // Reload stats after cleanup
      await loadStats()
    } catch (err) {
      setError(err.message)
    } finally {
      setCleanupInProgress(false)
    }
  }

  const handleServiceToggle = () => {
    if (stats?.isServiceRunning) {
      reportCleanupService.stop()
    } else {
      reportCleanupService.start()
    }
    
    // Reload stats to reflect the change
    setTimeout(loadStats, 500)
  }

  useEffect(() => {
    loadStats()
    
    // Set up periodic refresh
    const interval = setInterval(loadStats, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading cleanup statistics...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Error loading cleanup data: {error}
          </Alert>
          <Button onClick={loadStats} startIcon={<Refresh />} sx={{ mt: 2 }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      {/* Service Status and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Automatic Cleanup Service
            </Typography>
            <Chip
              label={stats?.isServiceRunning ? 'Running' : 'Stopped'}
              color={stats?.isServiceRunning ? 'success' : 'default'}
              icon={stats?.isServiceRunning ? <PlayArrow /> : <Stop />}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="primary">
                    {stats?.retentionDays}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Days Retention
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="info.main">
                    {stats?.currentResolvedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved Reports
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="warning.main">
                    {stats?.pendingDeleteCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Deletion
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="text.primary">
                    {stats?.nextCleanupIn || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Next Cleanup
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleServiceToggle}
              startIcon={stats?.isServiceRunning ? <Stop /> : <PlayArrow />}
              color={stats?.isServiceRunning ? 'error' : 'primary'}
            >
              {stats?.isServiceRunning ? 'Stop Service' : 'Start Service'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => setConfirmDialog(true)}
              startIcon={<DeleteSweep />}
              disabled={cleanupInProgress || stats?.pendingDeleteCount === 0}
            >
              Manual Cleanup
            </Button>

            <Button
              variant="outlined"
              onClick={loadStats}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Last Cleanup Result */}
      {lastCleanupResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Last Cleanup Result
            </Typography>
            <Alert 
              severity={lastCleanupResult.success ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              {lastCleanupResult.success 
                ? `Successfully deleted ${lastCleanupResult.deleted} reports`
                : `Cleanup failed: ${lastCleanupResult.error}`
              }
            </Alert>
            
            {lastCleanupResult.success && lastCleanupResult.reports && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Deleted Reports:
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {lastCleanupResult.reports.map((report) => (
                    <Typography key={report.id} variant="body2" color="text.secondary">
                      • {report.title} (ID: {report.id})
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cleanup History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cleanup History
          </Typography>
          
          {stats?.recentLogs && stats.recentLogs.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Reports Deleted</TableCell>
                    <TableCell>Cutoff Date</TableCell>
                    <TableCell>Time Ago</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(log.cleanup_date), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={log.reports_deleted} 
                          size="small" 
                          color={log.reports_deleted > 0 ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.cutoff_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(log.cleanup_date), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No cleanup history available
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Confirm Manual Cleanup
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will permanently delete {stats?.pendingDeleteCount} resolved reports that are older than {stats?.retentionDays} days.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. Make sure you have exported any data you need before proceeding.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleManualCleanup} 
            color="error" 
            variant="contained"
            disabled={cleanupInProgress}
            startIcon={cleanupInProgress ? <CircularProgress size={16} /> : <DeleteSweep />}
          >
            {cleanupInProgress ? 'Cleaning...' : 'Delete Reports'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default memo(CleanupManagement)
