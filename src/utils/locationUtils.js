/**
 * Utility functions for handling location and map operations
 */

/**
 * Opens location in Google Maps (mobile app or web)
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} label - Optional label for the location
 */
export const openInGoogleMaps = (latitude, longitude, label = '') => {
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)
  
  if (isNaN(lat) || isNaN(lng)) {
    console.error('Invalid coordinates provided')
    return false
  }

  // For mobile devices, try to open in Google Maps app first
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  let url
  if (isMobile) {
    // Try Google Maps app first, fallback to web
    url = `https://maps.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=17`
    if (label) {
      url = `https://maps.google.com/maps?q=${encodeURIComponent(label)}@${lat},${lng}&ll=${lat},${lng}&z=17`
    }
  } else {
    // Desktop - open in Google Maps web
    url = `https://www.google.com/maps/@${lat},${lng},17z`
    if (label) {
      url = `https://www.google.com/maps/search/${encodeURIComponent(label)}/@${lat},${lng},17z`
    }
  }

  window.open(url, '_blank')
  return true
}

/**
 * Opens location in Google Maps with directions from current location
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} label 
 */
export const getDirectionsToLocation = (latitude, longitude, label = '') => {
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)
  
  if (isNaN(lat) || isNaN(lng)) {
    console.error('Invalid coordinates provided')
    return false
  }

  let destination = `${lat},${lng}`
  if (label) {
    destination = `${encodeURIComponent(label)}, ${lat},${lng}`
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
  window.open(url, '_blank')
  return true
}

/**
 * Copies location information to clipboard
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} address 
 * @param {string} title 
 */
export const copyLocationToClipboard = async (latitude, longitude, address = '', title = '') => {
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)
  
  if (isNaN(lat) || isNaN(lng)) {
    console.error('Invalid coordinates provided')
    return false
  }

  const locationText = `${title ? title + '\n' : ''}${address ? address + '\n' : ''}Coordinates: ${lat}, ${lng}\nGoogle Maps: https://www.google.com/maps/@${lat},${lng},17z`

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(locationText)
      return { success: true, method: 'clipboard' }
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = locationText
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      return { success, method: 'execCommand' }
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Shares location using Web Share API (mobile) or copies to clipboard
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} title 
 * @param {string} address 
 */
export const shareLocation = async (latitude, longitude, title = '', address = '') => {
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)
  
  if (isNaN(lat) || isNaN(lng)) {
    console.error('Invalid coordinates provided')
    return { success: false, error: 'Invalid coordinates' }
  }

  const googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},17z`
  const shareData = {
    title: title || 'Location',
    text: `${title ? title + '\n' : ''}${address ? address + '\n' : ''}Coordinates: ${lat}, ${lng}`,
    url: googleMapsUrl
  }

  // Try Web Share API first (mobile browsers)
  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return { success: true, method: 'native' }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Web Share API failed:', err)
      }
      // Fall back to clipboard
    }
  }

  // Fallback to clipboard
  return await copyLocationToClipboard(latitude, longitude, address, title)
}

/**
 * Gets user's current location
 * @returns {Promise} Promise that resolves with {latitude, longitude} or rejects with error
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        let errorMessage = 'Unknown error occurred'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        reject(new Error(errorMessage))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

/**
 * Calculates distance between two coordinates (in kilometers)
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Formats coordinates for display
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} precision 
 * @returns {string} Formatted coordinates string
 */
export const formatCoordinates = (latitude, longitude, precision = 6) => {
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)
  
  if (isNaN(lat) || isNaN(lng)) {
    return 'Invalid coordinates'
  }

  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}
