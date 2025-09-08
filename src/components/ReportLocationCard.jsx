import { useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  LocationOn,
  OpenInNew,
  MyLocation,
  Map as MapIcon,
  Directions
} from '@mui/icons-material'
import GoogleMapsWrapper from './GoogleMapsWrapper'

const GoogleMapComponent = ({ latitude, longitude, report }) => {
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current && window.google) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 16,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      })

      // Add marker for the report location
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: report.title,
        icon: {
          url: getMarkerIcon(report.category),
          scaledSize: new window.google.maps.Size(40, 40),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(20, 40)
        }
      })

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${report.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${report.address || 'No address provided'}</p>
            <p style="margin: 0; font-size: 11px; color: #999;">Status: ${report.status}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      markerRef.current = marker
    }
  }, [latitude, longitude, report])

  const getMarkerIcon = (category) => {
    const iconMap = {
      'pothole': 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      'streetlight': 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      'trash': 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      'water': 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      'traffic': 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
      'vandalism': 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
    }
    return iconMap[category] || 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
  }

  return (
    <Box
      ref={mapRef}
      sx={{
        width: '100%',
        height: '400px',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    />
  )
}

const ReportLocationCard = ({ report }) => {
  const [mapOpen, setMapOpen] = useState(false)

  const { latitude, longitude, address } = report
  
  // Helper function to get location accuracy description
  const getLocationAccuracy = (source) => {
    const accuracyMap = {
      'GPS': { color: 'success', label: 'GPS (High)' },
      'MAP_PICKER': { color: 'primary', label: 'Map Selected' },
      'ADDRESS_INPUT': { color: 'warning', label: 'Address Based' }
    }
    return accuracyMap[source] || { color: 'default', label: 'Unknown' }
  }

  // Open location in Google Maps
  const openInGoogleMaps = () => {
    const url = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16`
    window.open(url, '_blank')
  }

  // Get directions to location
  const getDirections = () => {
    const url = `https://maps.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, '_blank')
  }

  // Open Street View
  const openStreetView = () => {
    const url = `https://maps.google.com/maps?q=${latitude},${longitude}&layer=c&cbll=${latitude},${longitude}`
    window.open(url, '_blank')
  }

  const accuracy = getLocationAccuracy(report.location_source)

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn color="primary" />
            <Typography variant="h6">
              Report Location
            </Typography>
            <Chip 
              label={accuracy.label}
              color={accuracy.color}
              size="small"
            />
          </Box>

          {/* Address Display */}
          <Typography variant="body1" gutterBottom>
            {address || 'No address provided'}
          </Typography>

          {/* Coordinates */}
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Coordinates: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
          </Typography>

          {/* Location Accuracy */}
          {report.location_accuracy && (
            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
              GPS Accuracy: ±{Math.round(report.location_accuracy)}m
            </Typography>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Button
              startIcon={<MapIcon />}
              variant="outlined"
              size="small"
              onClick={() => setMapOpen(true)}
            >
              View on Map
            </Button>
            
            <Button
              startIcon={<OpenInNew />}
              variant="outlined"
              size="small"
              onClick={openInGoogleMaps}
            >
              Google Maps
            </Button>

            <Button
              startIcon={<Directions />}
              variant="outlined"
              size="small"
              onClick={getDirections}
            >
              Directions
            </Button>

            <IconButton
              size="small"
              onClick={openStreetView}
              title="Street View"
            >
              <MyLocation />
            </IconButton>
          </Box>

          {/* Distance from City Center (if available) */}
          {report.metadata?.distance_from_center && (
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
              {report.metadata.distance_from_center} km from city center
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Map Dialog */}
      <Dialog 
        open={mapOpen} 
        onClose={() => setMapOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="primary" />
            Report Location - {report.title}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <GoogleMapsWrapper>
            <GoogleMapComponent 
              latitude={latitude} 
              longitude={longitude} 
              report={report}
            />
          </GoogleMapsWrapper>
        </DialogContent>
        <DialogActions>
          <Button onClick={openInGoogleMaps} startIcon={<OpenInNew />}>
            Open in Google Maps
          </Button>
          <Button onClick={getDirections} startIcon={<Directions />}>
            Get Directions
          </Button>
          <Button onClick={() => setMapOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ReportLocationCard
