import { useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Button
} from '@mui/material'
import {
  FilterList,
  Refresh,
  Fullscreen,
  MyLocation
} from '@mui/icons-material'
import GoogleMapsWrapper from './GoogleMapsWrapper'
import { useReports } from '../hooks/useData'
import { formatStatus, formatPriority } from '../utils/helpers'

const ReportsMap = ({ 
  reports = [], 
  selectedReport = null, 
  onReportSelect,
  filters = {},
  onFilterChange 
}) => {
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const infoWindowRef = useRef(null)

  // Default center (you can change this to your city's center)
  const defaultCenter = { lat: 40.7128, lng: -74.0060 } // New York City

  useEffect(() => {
    if (mapRef.current && window.google && reports.length > 0) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      })

      // Create bounds to fit all markers
      const bounds = new window.google.maps.LatLngBounds()

      // Add markers for each report
      reports.forEach((report) => {
        if (report.latitude && report.longitude) {
          const position = { lat: report.latitude, lng: report.longitude }
          
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: report.title,
            icon: {
              url: getMarkerIcon(report.category, report.priority),
              scaledSize: new window.google.maps.Size(30, 30),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 30)
            }
          })

          // Create info window content
          const infoWindowContent = createInfoWindowContent(report)

          marker.addListener('click', () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.close()
            }

            infoWindowRef.current = new window.google.maps.InfoWindow({
              content: infoWindowContent
            })

            infoWindowRef.current.open(map, marker)

            // Trigger callback if provided
            if (onReportSelect) {
              onReportSelect(report)
            }
          })

          markersRef.current.push(marker)
          bounds.extend(position)
        }
      })

      // Fit map to show all markers
      if (reports.length > 0) {
        map.fitBounds(bounds)
        
        // Ensure minimum zoom level
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 16) map.setZoom(16)
          window.google.maps.event.removeListener(listener)
        })
      }
    }
  }, [reports, selectedReport])

  const getMarkerIcon = (category, priority) => {
    const iconBase = 'https://maps.google.com/mapfiles/ms/icons/'
    
    // Color based on priority
    const priorityColors = {
      'urgent': 'red',
      'high': 'orange',
      'medium': 'yellow',
      'low': 'green'
    }

    const color = priorityColors[priority] || 'blue'
    return `${iconBase}${color}-dot.png`
  }

  const createInfoWindowContent = (report) => {
    const statusColor = getStatusColor(report.status)
    const priorityColor = getPriorityColor(report.priority)

    return `
      <div style="padding: 12px; max-width: 280px; font-family: 'Roboto', Arial, sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937; flex: 1;">
            ${report.title}
          </h3>
        </div>
        
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <span style="
            background-color: ${statusColor.bg}; 
            color: ${statusColor.text}; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 11px; 
            font-weight: 500;
          ">
            ${formatStatus(report.status)}
          </span>
          <span style="
            background-color: ${priorityColor.bg}; 
            color: ${priorityColor.text}; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 11px; 
            font-weight: 500;
          ">
            ${formatPriority(report.priority)}
          </span>
        </div>

        <p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563; line-height: 1.4;">
          ${report.description.length > 100 ? report.description.substring(0, 100) + '...' : report.description}
        </p>

        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          <div style="margin-bottom: 2px;">
            <strong>Address:</strong> ${report.address || 'No address provided'}
          </div>
          <div style="margin-bottom: 2px;">
            <strong>Category:</strong> ${report.category.replace('_', ' ').toUpperCase()}
          </div>
          <div>
            <strong>Reported:</strong> ${new Date(report.created_at).toLocaleDateString()}
          </div>
        </div>

        <div style="text-align: right;">
          <button 
            onclick="window.parent.postMessage({type: 'viewReport', reportId: '${report.id}'}, '*')"
            style="
              background-color: #2563eb; 
              color: white; 
              border: none; 
              padding: 6px 12px; 
              border-radius: 6px; 
              font-size: 12px; 
              cursor: pointer;
              font-weight: 500;
            "
          >
            View Details
          </button>
        </div>
      </div>
    `
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': { bg: '#fef3c7', text: '#d97706' },
      'in_progress': { bg: '#dbeafe', text: '#2563eb' },
      'resolved': { bg: '#d1fae5', text: '#059669' },
      'rejected': { bg: '#fee2e2', text: '#dc2626' }
    }
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'low': { bg: '#f3f4f6', text: '#6b7280' },
      'medium': { bg: '#fef3c7', text: '#d97706' },
      'high': { bg: '#fed7aa', text: '#ea580c' },
      'urgent': { bg: '#fee2e2', text: '#dc2626' }
    }
    return colors[priority] || { bg: '#f3f4f6', text: '#6b7280' }
  }

  return (
    <Box
      ref={mapRef}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    />
  )
}

const MapsDashboard = () => {
  const [filters, setFilters] = useState({})
  const { reports, loading, refetch } = useReports(filters)
  const [selectedReport, setSelectedReport] = useState(null)

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === 'all' ? undefined : value
    }))
  }

  const handleReportSelect = (report) => {
    setSelectedReport(report)
  }

  // Listen for messages from info window
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'viewReport') {
        const report = reports.find(r => r.id === event.data.reportId)
        if (report) {
          setSelectedReport(report)
          // You can add navigation logic here
          console.log('Navigate to report:', report)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [reports])

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Reports Map
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Filters */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || 'all'}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority || 'all'}
                label="Priority"
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh">
              <IconButton onClick={refetch} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={`${reports.length} Reports`} size="small" />
          <Chip 
            label={`${reports.filter(r => r.status === 'pending').length} Pending`} 
            size="small" 
            color="warning"
          />
          <Chip 
            label={`${reports.filter(r => r.priority === 'urgent').length} Urgent`} 
            size="small" 
            color="error"
          />
        </Box>

        {/* Map */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <GoogleMapsWrapper>
            <ReportsMap
              reports={reports}
              selectedReport={selectedReport}
              onReportSelect={handleReportSelect}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </GoogleMapsWrapper>
        </Box>
      </CardContent>
    </Card>
  )
}

export default MapsDashboard
