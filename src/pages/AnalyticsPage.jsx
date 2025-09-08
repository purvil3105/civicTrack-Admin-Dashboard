import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  LocationOn,
  Timeline,
  PieChart,
  BarChart,
  Schedule,
  CheckCircle,
  PendingActions,
  Warning,
  Error,
  Refresh
} from '@mui/icons-material'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Chart as ChartJS, registerables } from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(...registerables)

const AnalyticsPage = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7days')
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    avgResolutionTime: 0,
    reportsByStatus: {},
    reportsByPriority: {},
    reportsByCategory: {},
    dailyReports: [],
    topLocations: [],
    resolutionTrend: []
  })

  // Color schemes for charts
  const statusColors = {
    'new': '#2196f3',
    'in_progress': '#ff9800', 
    'resolved': '#4caf50',
    'rejected': '#f44336'
  }

  const priorityColors = {
    'low': '#4caf50',
    'medium': '#ff9800',
    'high': '#f44336',
    'urgent': '#9c27b0'
  }

  const categoryColors = [
    '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
    '#7b1fa2', '#0288d1', '#689f38', '#f9a825'
  ]

  useEffect(() => {
    fetchReports()
  }, [timeframe])

  useEffect(() => {
    if (reports.length > 0) {
      calculateAnalytics()
    }
  }, [reports])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const daysAgo = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90
      const startDate = startOfDay(subDays(new Date(), daysAgo))
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = () => {
    const totalReports = reports.length
    const resolvedReports = reports.filter(r => r.status === 'resolved').length
    const pendingReports = reports.filter(r => ['new', 'in_progress'].includes(r.status)).length

    // Calculate average resolution time for resolved reports
    const resolvedWithTime = reports.filter(r => r.status === 'resolved' && r.resolved_at)
    const avgResolutionTime = resolvedWithTime.length > 0 
      ? resolvedWithTime.reduce((acc, report) => {
          const created = new Date(report.created_at)
          const resolved = new Date(report.resolved_at)
          return acc + (resolved - created) / (1000 * 60 * 60 * 24) // days
        }, 0) / resolvedWithTime.length
      : 0

    // Group by status
    const reportsByStatus = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1
      return acc
    }, {})

    // Group by priority
    const reportsByPriority = reports.reduce((acc, report) => {
      acc[report.priority] = (acc[report.priority] || 0) + 1
      return acc
    }, {})

    // Group by category
    const reportsByCategory = reports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1
      return acc
    }, {})

    // Daily reports for the last 7 days
    const dailyReports = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      
      const dayReports = reports.filter(report => {
        const reportDate = new Date(report.created_at)
        return reportDate >= dayStart && reportDate <= dayEnd
      }).length

      dailyReports.push({
        date: format(date, 'MMM dd'),
        count: dayReports
      })
    }

    // Top locations by report count
    const locationCounts = reports.reduce((acc, report) => {
      if (report.address) {
        const location = report.address.split(',')[0] // Get first part of address
        acc[location] = (acc[location] || 0) + 1
      }
      return acc
    }, {})

    const topLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }))

    // Resolution trend (percentage resolved per day)
    const resolutionTrend = dailyReports.map(day => {
      const dayReports = reports.filter(report => 
        format(new Date(report.created_at), 'MMM dd') === day.date
      )
      const dayResolved = dayReports.filter(r => r.status === 'resolved').length
      const resolutionRate = dayReports.length > 0 ? (dayResolved / dayReports.length) * 100 : 0
      
      return {
        date: day.date,
        rate: resolutionRate
      }
    })

    setAnalytics({
      totalReports,
      resolvedReports,
      pendingReports,
      avgResolutionTime,
      reportsByStatus,
      reportsByPriority,
      reportsByCategory,
      dailyReports,
      topLocations,
      resolutionTrend
    })
  }

  // Chart configurations
  const dailyReportsChart = {
    data: {
      labels: analytics.dailyReports.map(d => d.date),
      datasets: [
        {
          label: 'Reports Submitted',
          data: analytics.dailyReports.map(d => d.count),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  }

  const statusChart = {
    data: {
      labels: Object.keys(analytics.reportsByStatus).map(status => 
        status.replace('_', ' ').toUpperCase()
      ),
      datasets: [
        {
          data: Object.values(analytics.reportsByStatus),
          backgroundColor: Object.keys(analytics.reportsByStatus).map(status => statusColors[status]),
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  }

  const priorityChart = {
    data: {
      labels: Object.keys(analytics.reportsByPriority).map(priority => 
        priority.toUpperCase()
      ),
      datasets: [
        {
          data: Object.values(analytics.reportsByPriority),
          backgroundColor: Object.keys(analytics.reportsByPriority).map(priority => priorityColors[priority]),
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  }

  const resolutionTrendChart = {
    data: {
      labels: analytics.resolutionTrend.map(d => d.date),
      datasets: [
        {
          label: 'Resolution Rate (%)',
          data: analytics.resolutionTrend.map(d => d.rate),
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%'
            }
          }
        }
      }
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <PendingActions color="info" />
      case 'in_progress':
        return <Schedule color="warning" />
      case 'resolved':
        return <CheckCircle color="success" />
      case 'rejected':
        return <Error color="error" />
      default:
        return <Warning />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'success'
      case 'medium':
        return 'warning'
      case 'high':
        return 'error'
      case 'urgent':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%' 
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Comprehensive insights into civic report patterns and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchReports}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.totalReports}</Typography>
                  <Typography color="textSecondary">Total Reports</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.resolvedReports}</Typography>
                  <Typography color="textSecondary">Resolved</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main">
                      {analytics.totalReports > 0 ? 
                        Math.round((analytics.resolvedReports / analytics.totalReports) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PendingActions color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{analytics.pendingReports}</Typography>
                  <Typography color="textSecondary">Pending</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {analytics.pendingReports > analytics.resolvedReports ? (
                      <TrendingUp fontSize="small" color="warning" />
                    ) : (
                      <TrendingDown fontSize="small" color="success" />
                    )}
                    <Typography variant="caption">
                      {analytics.totalReports > 0 ? 
                        Math.round((analytics.pendingReports / analytics.totalReports) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Timeline color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {analytics.avgResolutionTime.toFixed(1)}
                  </Typography>
                  <Typography color="textSecondary">Avg. Resolution</Typography>
                  <Typography variant="caption" color="textSecondary">
                    days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Daily Reports Trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title="Daily Reports Trend"
              subheader="Number of reports submitted each day"
              action={<BarChart />}
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line {...dailyReportsChart} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reports by Status */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title="Reports by Status"
              subheader="Current status distribution"
              action={<PieChart />}
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Doughnut {...statusChart} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Priority Distribution"
              subheader="Reports categorized by priority level"
            />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <Bar {...priorityChart} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resolution Rate Trend */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Resolution Rate Trend"
              subheader="Daily resolution efficiency"
            />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <Line {...resolutionTrendChart} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Insights */}
      <Grid container spacing={3}>
        {/* Top Report Categories */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Top Report Categories"
              subheader="Most reported issues"
            />
            <CardContent>
              <List>
                {Object.entries(analytics.reportsByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count], index) => (
                    <ListItem key={category} divider={index < 4}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: categoryColors[index % categoryColors.length]
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={category.replace('_', ' ').toUpperCase()}
                        secondary={`${count} reports`}
                      />
                      <Chip
                        label={Math.round((count / analytics.totalReports) * 100) + '%'}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Locations */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Top Report Locations"
              subheader="Areas with most reports"
              action={<LocationOn />}
            />
            <CardContent>
              <List>
                {analytics.topLocations.map((location, index) => (
                  <ListItem key={location.location} divider={index < analytics.topLocations.length - 1}>
                    <ListItemIcon>
                      <LocationOn color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={location.location}
                      secondary={`${location.count} reports`}
                    />
                    <Chip
                      label={Math.round((location.count / analytics.totalReports) * 100) + '%'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AnalyticsPage
