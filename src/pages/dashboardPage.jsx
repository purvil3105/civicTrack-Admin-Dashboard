import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  LinearProgress,
  Alert
} from '@mui/material'
import {
  TrendingUp,
  Report,
  CheckCircle,
  Schedule,
  Warning
} from '@mui/icons-material'
import { useReports } from '../hooks/useData'
import StatsCard from '../components/StatsCard'
import RecentReportsTable from '../components/RecentReportsTable'
import ReportStatusChart from '../components/ReportStatusChart'
import CategoryDistribution from '../components/CategoryDistribution'
import InteractiveMap from '../components/InteractiveMap'
// import CleanupManagement from '../components/CleanupManagement' // Disabled for now

const DashboardPage = () => {
  const { reports, loading, error } = useReports()
  
  // Memoize stats calculation to prevent unnecessary recalculations
  const stats = useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0
      }
    }

    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      rejected: reports.filter(r => r.status === 'rejected').length
    }
  }, [reports])

  // Memoize recent reports slice
  const recentReports = useMemo(() => {
    return reports?.slice(0, 5) || []
  }, [reports])

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading dashboard data...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading dashboard data: {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2' }}>
          CivicTrack Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage civic reports across the city
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4 
        }}
      >
        <StatsCard
          title="Total Reports"
          value={stats.total}
          icon={<Report />}
          color="primary"
          trend="+12%"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={<Schedule />}
          color="warning"
          trend="-5%"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={<TrendingUp />}
          color="info"
          trend="+8%"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={<CheckCircle />}
          color="success"
          trend="+15%"
        />
      </Box>

      {/* Charts and Analytics */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr'
          },
          gap: 3,
          mb: 4 
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Status Overview
          </Typography>
          <ReportStatusChart data={stats} />
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Category Distribution
          </Typography>
          <CategoryDistribution reports={reports} />
        </Paper>
      </Box>

      {/* Maps and Recent Reports */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr'
          },
          gap: 3 
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Locations
          </Typography>
          <InteractiveMap reports={reports?.filter(r => r.latitude && r.longitude) || []} height={300} />
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Reports
          </Typography>
          <RecentReportsTable reports={recentReports} />
        </Paper>
      </Box>

      {/* System Maintenance Section - Disabled for now */}
      {/* 
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 500 }}>
          System Maintenance
        </Typography>
        <CleanupManagement />
      </Box>
      */}
    </Container>
  )
}

export default DashboardPage
