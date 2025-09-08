import React, { useEffect, useRef, memo } from 'react'
import { Box, Typography, Paper, Chip, CircularProgress } from '@mui/material'
import { LocationOn, Warning } from '@mui/icons-material'
import { 
  openInGoogleMaps, 
  getDirectionsToLocation, 
  copyLocationToClipboard 
} from '../utils/locationUtils'

// Global functions for popup buttons (needed since popup content is HTML string)
window.openLocationInGoogleMaps = (lat, lng, title) => {
  openInGoogleMaps(lat, lng, title)
}

window.getDirectionsToLocation = (lat, lng, title) => {
  getDirectionsToLocation(lat, lng, title)
}

window.copyLocationFromMap = async (lat, lng, address, title) => {
  const result = await copyLocationToClipboard(lat, lng, address, title)
  if (result.success) {
    // Create a temporary notification
    const notification = document.createElement('div')
    notification.innerHTML = '✅ Location copied to clipboard!'
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: #4caf50; color: white; padding: 12px 16px;
      border-radius: 4px; font-family: system-ui; font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  } else {
    // Error notification
    const notification = document.createElement('div')
    notification.innerHTML = '❌ Failed to copy location'
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: #f44336; color: white; padding: 12px 16px;
      border-radius: 4px; font-family: system-ui; font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }
}

const InteractiveMap = ({ reports = [], height = 400 }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800'
      case 'in_progress':
        return '#2196f3'
      case 'resolved':
        return '#4caf50'
      case 'rejected':
        return '#f44336'
      default:
        return '#757575'
    }
  }

  useEffect(() => {
    // Debug: Log the reports data
    console.log('InteractiveMap received reports:', reports)
    const reportsWithCoords = reports.filter(r => r.latitude && r.longitude)
    console.log('Reports with coordinates:', reportsWithCoords)
    
    // If no coordinates, add test data for demonstration
    let testReports = [...reports]
    if (reportsWithCoords.length === 0 && reports.length > 0) {
      console.log('No coordinates found, adding test coordinates for demonstration')
      testReports = reports.map((report, index) => ({
        ...report,
        latitude: 40.7128 + (index * 0.01), // NYC area with slight offsets
        longitude: -74.0060 + (index * 0.01)
      })).slice(0, 3) // Only first 3 for demo
    }
    
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      try {
        // Import Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Import Leaflet JS
        if (!window.L) {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          document.head.appendChild(script)
          
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }

        // Initialize map
        if (mapRef.current && window.L && !mapInstanceRef.current) {
          // Default center (you can change this to your city's coordinates)
          let center = [40.7128, -74.0060] // New York City
          let zoom = 10

          // If we have reports with coordinates, center on the first one
          const reportsWithTestCoords = testReports.filter(r => r.latitude && r.longitude)
          if (reportsWithTestCoords.length > 0) {
            const firstReport = reportsWithTestCoords[0]
            center = [parseFloat(firstReport.latitude), parseFloat(firstReport.longitude)]
            zoom = reportsWithTestCoords.length === 1 ? 15 : 12
          }

          // Create map
          mapInstanceRef.current = window.L.map(mapRef.current).setView(center, zoom)

          // Add tile layer
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current)

          // Clear existing markers
          markersRef.current.forEach(marker => {
            mapInstanceRef.current.removeLayer(marker)
          })
          markersRef.current = []

          // Add markers for reports
          reportsWithTestCoords.forEach(report => {
            const lat = parseFloat(report.latitude)
            const lng = parseFloat(report.longitude)

            if (!isNaN(lat) && !isNaN(lng)) {
              // Create custom icon
              const customIcon = window.L.divIcon({
                html: `
                  <div style="
                    background-color: ${getStatusColor(report.status)};
                    border: 3px solid white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    font-size: 10px;
                  ">
                    ${getCategoryIcon(report.category)}
                  </div>
                `,
                className: 'custom-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })

              const marker = window.L.marker([lat, lng], { icon: customIcon })
                .addTo(mapInstanceRef.current)

              // Create popup content with location actions
              const popupContent = `
                <div style="min-width: 280px; font-family: system-ui;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 20px;">${getCategoryIcon(report.category)}</span>
                    <strong style="color: #1976d2; font-size: 16px;">${report.title}</strong>
                  </div>
                  <p style="margin: 4px 0; color: #666; font-size: 14px;">
                    <strong>Category:</strong> ${report.category?.replace('_', ' ').toUpperCase()}
                  </p>
                  <p style="margin: 4px 0; color: #666; font-size: 14px;">
                    <strong>Status:</strong> 
                    <span style="
                      color: ${getStatusColor(report.status)}; 
                      font-weight: bold; 
                      text-transform: capitalize;
                      background: ${getStatusColor(report.status)}20;
                      padding: 2px 6px;
                      border-radius: 4px;
                    ">
                      ${report.status?.replace('_', ' ')}
                    </span>
                  </p>
                  ${report.description ? `
                    <p style="margin: 8px 0 4px 0; color: #333; font-size: 14px; line-height: 1.4;">
                      <strong>Description:</strong><br>
                      ${report.description.length > 100 ? report.description.substring(0, 100) + '...' : report.description}
                    </p>
                  ` : ''}
                  ${report.address ? `
                    <p style="margin: 4px 0; color: #666; font-size: 12px;">
                      📍 ${report.address}
                    </p>
                  ` : ''}
                  <div style="margin: 8px 0 4px 0; font-size: 12px; color: #888;">
                    <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
                  </div>
                  <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 4px;">
                    <button 
                      onclick="window.openLocationInGoogleMaps(${lat}, ${lng}, '${report.title?.replace(/'/g, "\\'")}')"
                      style="
                        background: #1976d2; color: white; border: none; padding: 6px 12px; 
                        border-radius: 4px; font-size: 12px; cursor: pointer; width: 100%;
                        display: flex; align-items: center; justify-content: center; gap: 4px;
                      "
                      onmouseover="this.style.background='#1565c0'"
                      onmouseout="this.style.background='#1976d2'"
                    >
                      🗺️ Open in Google Maps
                    </button>
                    <div style="display: flex; gap: 4px;">
                      <button 
                        onclick="window.getDirectionsToLocation(${lat}, ${lng}, '${report.title?.replace(/'/g, "\\'")}')"
                        style="
                          background: #2e7d32; color: white; border: none; padding: 6px 8px; 
                          border-radius: 4px; font-size: 11px; cursor: pointer; flex: 1;
                        "
                        onmouseover="this.style.background='#1b5e20'"
                        onmouseout="this.style.background='#2e7d32'"
                      >
                        🧭 Directions
                      </button>
                      <button 
                        onclick="window.copyLocationFromMap(${lat}, ${lng}, '${report.address?.replace(/'/g, "\\'") || ''}', '${report.title?.replace(/'/g, "\\'")}')"
                        style="
                          background: #ed6c02; color: white; border: none; padding: 6px 8px; 
                          border-radius: 4px; font-size: 11px; cursor: pointer; flex: 1;
                        "
                        onmouseover="this.style.background='#e65100'"
                        onmouseout="this.style.background='#ed6c02'"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </div>
              `

              marker.bindPopup(popupContent, {
                maxWidth: 300,
                closeButton: true
              })

              markersRef.current.push(marker)
            }
          })

          // Fit bounds if multiple markers
          if (markersRef.current.length > 1) {
            const group = new window.L.featureGroup(markersRef.current)
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
          }
        }
      } catch (error) {
        console.error('Error loading map:', error)
      }
    }

    loadLeaflet()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [reports])

  const reportsWithLocation = reports.filter(r => r.latitude && r.longitude)

  // Show message if no real coordinates but add test coordinates for demo
  if (reportsWithLocation.length === 0 && reports.length > 0) {
    return (
      <Box sx={{ height, position: 'relative' }}>
        <div 
          ref={mapRef}
          style={{ 
            width: '100%', 
            height: '100%',
            borderRadius: '4px',
            overflow: 'hidden'
          }} 
        />
        
        {/* Demo Notice */}
        <Paper sx={{ 
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          p: 2,
          bgcolor: 'rgba(255, 243, 224, 0.95)',
          border: '1px solid',
          borderColor: 'warning.main',
          zIndex: 1000
        }}>
          <Typography variant="body2" color="warning.dark">
            <strong>Demo Mode:</strong> No GPS coordinates found in reports. Showing sample locations for demonstration.
          </Typography>
        </Paper>
        
        {/* Report Count Badge */}
        <Chip
          label={`${reports.length} Report${reports.length !== 1 ? 's' : ''} (demo locations)`}
          color="warning"
          size="small"
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            zIndex: 1000
          }}
        />
      </Box>
    )
  }

  if (reportsWithLocation.length === 0) {
    return (
      <Paper sx={{ 
        height, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.50',
        border: '2px dashed',
        borderColor: 'grey.300'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <LocationOn sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Location Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This report doesn't have GPS coordinates
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Box sx={{ height, position: 'relative' }}>
      <div 
        ref={mapRef}
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '4px',
          overflow: 'hidden'
        }} 
      />
      
      {/* Legend */}
      {reports.length > 1 && (
        <Paper sx={{ 
          position: 'absolute',
          top: 10,
          right: 10,
          p: 2,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          maxWidth: 200,
          zIndex: 1000
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Report Status Legend
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: '#ff9800',
                border: '2px solid white'
              }} />
              <Typography variant="caption">Pending</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: '#2196f3',
                border: '2px solid white'
              }} />
              <Typography variant="caption">In Progress</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: '#4caf50',
                border: '2px solid white'
              }} />
              <Typography variant="caption">Resolved</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: '#f44336',
                border: '2px solid white'
              }} />
              <Typography variant="caption">Rejected</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Report Count Badge */}
      {reports.length > 0 && (
        <Chip
          label={`${reportsWithLocation.length} Report${reportsWithLocation.length !== 1 ? 's' : ''} with location`}
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            bgcolor: 'rgba(25, 118, 210, 0.9)',
            color: 'white',
            zIndex: 1000
          }}
        />
      )}
    </Box>
  )
}

export default memo(InteractiveMap)
