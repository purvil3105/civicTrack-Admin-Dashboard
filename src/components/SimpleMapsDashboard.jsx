import React, { useState, useEffect, memo } from 'react'
import { Box, Typography, Paper, Chip, CircularProgress } from '@mui/material'
import { LocationOn, Warning } from '@mui/icons-material'

// Simple Maps Dashboard Component that integrates with Google Maps
const SimpleMapsDashboard = ({ reports = [] }) => {
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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
    const initializeMap = () => {
      try {
        // Check if Google Maps is available
        if (!window.google || !window.google.maps) {
          setError('Google Maps API not loaded')
          setIsLoading(false)
          return
        }

        // Check if the map container exists
        const mapContainer = document.getElementById('google-map')
        if (!mapContainer) {
          console.warn('Map container not found, retrying...')
          setTimeout(initializeMap, 100)
          return
        }

        // Default center (you can change this to your city's coordinates)
        const defaultCenter = { lat: 40.7128, lng: -74.0060 } // New York City

        // If we have reports with coordinates, center on the first one
        const centerLocation = reports.length > 0 && reports[0].latitude && reports[0].longitude
          ? { lat: parseFloat(reports[0].latitude), lng: parseFloat(reports[0].longitude) }
          : defaultCenter

        const mapInstance = new window.google.maps.Map(mapContainer, {
          zoom: reports.length > 0 ? 15 : 10,
          center: centerLocation,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'cooperative'
        })

        setMap(mapInstance)

        // Create markers for reports
        const newMarkers = reports
          .filter(report => report.latitude && report.longitude)
          .map(report => {
            const position = {
              lat: parseFloat(report.latitude),
              lng: parseFloat(report.longitude)
            }

            const marker = new window.google.maps.Marker({
              position,
              map: mapInstance,
              title: report.title,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: getStatusColor(report.status),
                fillOpacity: 0.8,
                strokeColor: '#fff',
                strokeWeight: 2
              }
            })

            // Create info window
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; max-width: 300px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 20px;">${getCategoryIcon(report.category)}</span>
                    <strong style="color: #1976d2;">${report.title}</strong>
                  </div>
                  <p style="margin: 4px 0; color: #666; font-size: 14px;">
                    <strong>Category:</strong> ${report.category.replace('_', ' ').toUpperCase()}
                  </p>
                  <p style="margin: 4px 0; color: #666; font-size: 14px;">
                    <strong>Status:</strong> 
                    <span style="color: ${getStatusColor(report.status)}; font-weight: bold; text-transform: capitalize;">
                      ${report.status.replace('_', ' ')}
                    </span>
                  </p>
                  ${report.description ? `
                    <p style="margin: 8px 0 4px 0; color: #333; font-size: 14px; line-height: 1.4;">
                      ${report.description.length > 100 ? report.description.substring(0, 100) + '...' : report.description}
                    </p>
                  ` : ''}
                  ${report.address ? `
                    <p style="margin: 4px 0; color: #666; font-size: 12px;">
                      📍 ${report.address}
                    </p>
                  ` : ''}
                </div>
              `
            })

            marker.addListener('click', () => {
              infoWindow.open(mapInstance, marker)
            })

            return { marker, infoWindow, report }
          })

        setMarkers(newMarkers)
        setIsLoading(false)

        // If we have multiple reports, adjust bounds to show all
        if (newMarkers.length > 1) {
          const bounds = new window.google.maps.LatLngBounds()
          newMarkers.forEach(({ marker }) => {
            bounds.extend(marker.getPosition())
          })
          mapInstance.fitBounds(bounds)
        }

      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Failed to initialize map')
        setIsLoading(false)
      }
    }

    // Load Google Maps API if not already loaded
    if (!window.google && !window.googleMapsLoading) {
      window.googleMapsLoading = true
      const script = document.createElement('script')
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        window.googleMapsLoading = false
        initializeMap()
      }
      script.onerror = () => {
        window.googleMapsLoading = false
        setError('Failed to load Google Maps API. Please check your API key.')
        setIsLoading(false)
      }
      document.head.appendChild(script)
    } else if (window.google) {
      initializeMap()
    } else {
      // Google Maps is already loading, wait for it
      const checkLoaded = setInterval(() => {
        if (window.google && !window.googleMapsLoading) {
          clearInterval(checkLoaded)
          initializeMap()
        }
      }, 100)
    }

    // Cleanup function
    return () => {
      markers.forEach(({ marker }) => {
        marker.setMap(null)
      })
    }
  }, [reports])

  if (error) {
    return (
      <Paper sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'error.light',
        color: 'error.contrastText',
        p: 3
      }}>
        <Warning sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Map Loading Error
        </Typography>
        <Typography variant="body2" textAlign="center">
          {error}
        </Typography>
        <Typography variant="caption" textAlign="center" sx={{ mt: 1 }}>
          Please check your Google Maps API configuration
        </Typography>
      </Paper>
    )
  }

  if (isLoading) {
    return (
      <Paper sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        p: 3
      }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Loading Map...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Initializing Google Maps
        </Typography>
      </Paper>
    )
  }

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <div 
        id="google-map" 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '4px'
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
          maxWidth: 200
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
          label={`${reports.length} Report${reports.length !== 1 ? 's' : ''}`}
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            bgcolor: 'rgba(25, 118, 210, 0.9)',
            color: 'white'
          }}
        />
      )}
    </Box>
  )
}

export default memo(SimpleMapsDashboard)
