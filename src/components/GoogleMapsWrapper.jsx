import { Wrapper, Status } from '@googlemaps/react-wrapper'
import { useRef, useEffect, useState } from 'react'
import { Box, CircularProgress, Alert } from '@mui/material'

const GoogleMapsWrapper = ({ children, ...props }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <Alert severity="error">
        Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.
      </Alert>
    )
  }

  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="400px"
          >
            <CircularProgress />
          </Box>
        )
      case Status.FAILURE:
        return (
          <Alert severity="error">
            Failed to load Google Maps. Please check your API key and internet connection.
          </Alert>
        )
      case Status.SUCCESS:
        return children
      default:
        return null
    }
  }

  return (
    <Wrapper 
      apiKey={apiKey} 
      render={render}
      libraries={['places', 'geometry']}
      {...props}
    >
      {children}
    </Wrapper>
  )
}

export default GoogleMapsWrapper
