// =============================================
// Google Maps Implementation for Kotlin Mobile App
// =============================================

// build.gradle.kts (Module: app)
dependencies {
    implementation("com.google.android.gms:play-services-maps:18.2.0")
    implementation("com.google.android.gms:play-services-location:21.0.1")
    implementation("com.google.android.libraries.places:places:3.3.0")
}

// AndroidManifest.xml
/*
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />

<application>
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="YOUR_GOOGLE_MAPS_API_KEY" />
</application>
*/

// =============================================
// LocationManager.kt - Google Maps Integration
// =============================================

import com.google.android.gms.location.*
import com.google.android.gms.maps.model.LatLng
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
import android.location.Geocoder

class GoogleMapsLocationManager(private val context: Context) {
    
    private val fusedLocationClient: FusedLocationProviderClient = 
        LocationServices.getFusedLocationProviderClient(context)
    private val placesClient: PlacesClient
    
    init {
        // Initialize Places API
        if (!Places.isInitialized()) {
            Places.initialize(context, "YOUR_GOOGLE_MAPS_API_KEY")
        }
        placesClient = Places.createClient(context)
    }
    
    data class ReportLocation(
        val latitude: Double,
        val longitude: Double,
        val address: String,
        val formattedAddress: String,
        val city: String?,
        val state: String?,
        val postalCode: String?,
        val placeId: String?, // Google Places ID
        val accuracy: Float?,
        val source: LocationSource
    )
    
    enum class LocationSource {
        GPS, MAP_PICKER, ADDRESS_INPUT, PLACES_AUTOCOMPLETE
    }
    
    // Get current location using GPS
    fun getCurrentLocation(callback: (ReportLocation?) -> Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) 
            == PackageManager.PERMISSION_GRANTED) {
            
            val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000)
                .setWaitForAccurateLocation(false)
                .setMinUpdateIntervalMillis(5000)
                .setMaxUpdateDelayMillis(15000)
                .build()

            val locationCallback = object : LocationCallback() {
                override fun onLocationResult(locationResult: LocationResult) {
                    super.onLocationResult(locationResult)
                    val location = locationResult.lastLocation
                    if (location != null) {
                        // Use Google Geocoding API for reverse geocoding
                        reverseGeocodeWithGoogleAPI(
                            location.latitude, 
                            location.longitude, 
                            location.accuracy
                        ) { reportLocation ->
                            fusedLocationClient.removeLocationUpdates(this)
                            callback(reportLocation)
                        }
                    } else {
                        callback(null)
                    }
                }
            }
            
            fusedLocationClient.requestLocationUpdates(
                locationRequest, 
                locationCallback, 
                Looper.getMainLooper()
            )
        } else {
            callback(null)
        }
    }
    
    // Reverse geocoding using Google Maps Geocoding API
    private fun reverseGeocodeWithGoogleAPI(
        lat: Double, 
        lng: Double, 
        accuracy: Float?,
        callback: (ReportLocation?) -> Unit
    ) {
        val geocoder = Geocoder(context, Locale.getDefault())
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            geocoder.getFromLocation(lat, lng, 1) { addresses ->
                val address = addresses.firstOrNull()
                if (address != null) {
                    val reportLocation = ReportLocation(
                        latitude = lat,
                        longitude = lng,
                        address = address.getAddressLine(0) ?: "Unknown location",
                        formattedAddress = address.getAddressLine(0) ?: "",
                        city = address.locality,
                        state = address.adminArea,
                        postalCode = address.postalCode,
                        placeId = null, // Could be enhanced with Places API
                        accuracy = accuracy,
                        source = LocationSource.GPS
                    )
                    callback(reportLocation)
                } else {
                    callback(null)
                }
            }
        } else {
            try {
                val addresses = geocoder.getFromLocation(lat, lng, 1)
                val address = addresses?.firstOrNull()
                if (address != null) {
                    val reportLocation = ReportLocation(
                        latitude = lat,
                        longitude = lng,
                        address = address.getAddressLine(0) ?: "Unknown location",
                        formattedAddress = address.getAddressLine(0) ?: "",
                        city = address.locality,
                        state = address.adminArea,
                        postalCode = address.postalCode,
                        placeId = null,
                        accuracy = accuracy,
                        source = LocationSource.GPS
                    )
                    callback(reportLocation)
                } else {
                    callback(null)
                }
            } catch (e: Exception) {
                callback(null)
            }
        }
    }
    
    // Search places using Google Places Autocomplete
    fun searchPlaces(query: String, callback: (List<PlacePrediction>) -> Unit) {
        val request = FindAutocompletePredictionsRequest.builder()
            .setQuery(query)
            .build()
            
        placesClient.findAutocompletePredictions(request)
            .addOnSuccessListener { response ->
                val predictions = response.autocompletePredictions.map { prediction ->
                    PlacePrediction(
                        placeId = prediction.placeId,
                        primaryText = prediction.getPrimaryText(null).toString(),
                        secondaryText = prediction.getSecondaryText(null).toString(),
                        fullText = prediction.getFullText(null).toString()
                    )
                }
                callback(predictions)
            }
            .addOnFailureListener { exception ->
                Log.e("GoogleMapsLocation", "Places search failed", exception)
                callback(emptyList())
            }
    }
    
    // Get place details from place ID
    fun getPlaceDetails(placeId: String, callback: (ReportLocation?) -> Unit) {
        val placeFields = listOf(
            Place.Field.ID,
            Place.Field.NAME,
            Place.Field.LAT_LNG,
            Place.Field.ADDRESS,
            Place.Field.ADDRESS_COMPONENTS
        )
        
        val request = FetchPlaceRequest.newInstance(placeId, placeFields)
        
        placesClient.fetchPlace(request)
            .addOnSuccessListener { response ->
                val place = response.place
                val latLng = place.latLng
                
                if (latLng != null) {
                    val reportLocation = ReportLocation(
                        latitude = latLng.latitude,
                        longitude = latLng.longitude,
                        address = place.name ?: "Unknown location",
                        formattedAddress = place.address ?: "",
                        city = extractAddressComponent(place, "locality"),
                        state = extractAddressComponent(place, "administrative_area_level_1"),
                        postalCode = extractAddressComponent(place, "postal_code"),
                        placeId = place.id,
                        accuracy = null,
                        source = LocationSource.PLACES_AUTOCOMPLETE
                    )
                    callback(reportLocation)
                } else {
                    callback(null)
                }
            }
            .addOnFailureListener { exception ->
                Log.e("GoogleMapsLocation", "Place details fetch failed", exception)
                callback(null)
            }
    }
    
    private fun extractAddressComponent(place: Place, type: String): String? {
        return place.addressComponents?.asList()
            ?.find { it.types.contains(type) }
            ?.name
    }
    
    data class PlacePrediction(
        val placeId: String,
        val primaryText: String,
        val secondaryText: String,
        val fullText: String
    )
}

// =============================================
// MapLocationPickerActivity.kt
// =============================================

import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.*

class MapLocationPickerActivity : AppCompatActivity(), OnMapReadyCallback {
    
    private lateinit var googleMap: GoogleMap
    private var selectedLocation: LatLng? = null
    private var locationMarker: Marker? = null
    private lateinit var locationManager: GoogleMapsLocationManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map_location_picker)
        
        locationManager = GoogleMapsLocationManager(this)
        
        // Get current location from intent
        val currentLat = intent.getDoubleExtra("current_lat", 0.0)
        val currentLng = intent.getDoubleExtra("current_lng", 0.0)
        
        if (currentLat != 0.0 && currentLng != 0.0) {
            selectedLocation = LatLng(currentLat, currentLng)
        }
        
        // Initialize map
        val mapFragment = supportFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)
        
        setupUI()
    }
    
    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        
        // Configure map
        googleMap.uiSettings.isZoomControlsEnabled = true
        googleMap.uiSettings.isMyLocationButtonEnabled = true
        
        // Set initial location
        selectedLocation?.let { location ->
            moveToLocation(location)
            addMarker(location)
        } ?: run {
            // Default to city center or current location
            val defaultLocation = LatLng(40.7128, -74.0060) // NYC
            moveToLocation(defaultLocation)
        }
        
        // Handle map clicks
        googleMap.setOnMapClickListener { latLng ->
            selectedLocation = latLng
            addMarker(latLng)
            
            // Reverse geocode the selected location
            locationManager.reverseGeocodeWithGoogleAPI(
                latLng.latitude, 
                latLng.longitude, 
                null
            ) { reportLocation ->
                runOnUiThread {
                    updateAddressDisplay(reportLocation?.formattedAddress ?: "Unknown location")
                }
            }
        }
    }
    
    private fun moveToLocation(latLng: LatLng) {
        googleMap.animateCamera(
            CameraUpdateFactory.newLatLngZoom(latLng, 16f)
        )
    }
    
    private fun addMarker(latLng: LatLng) {
        locationMarker?.remove()
        
        locationMarker = googleMap.addMarker(
            MarkerOptions()
                .position(latLng)
                .title("Selected Location")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED))
        )
    }
    
    private fun setupUI() {
        findViewById<Button>(R.id.btnConfirmLocation).setOnClickListener {
            selectedLocation?.let { location ->
                val intent = Intent().apply {
                    putExtra("latitude", location.latitude)
                    putExtra("longitude", location.longitude)
                    putExtra("source", LocationSource.MAP_PICKER.name)
                }
                setResult(RESULT_OK, intent)
                finish()
            }
        }
        
        findViewById<Button>(R.id.btnCancel).setOnClickListener {
            setResult(RESULT_CANCELED)
            finish()
        }
        
        // Search functionality
        setupPlacesSearch()
    }
    
    private fun setupPlacesSearch() {
        val searchEditText = findViewById<EditText>(R.id.etSearch)
        val searchRecyclerView = findViewById<RecyclerView>(R.id.rvSearchResults)
        
        searchEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                val query = s?.toString()?.trim()
                if (!query.isNullOrEmpty() && query.length > 2) {
                    locationManager.searchPlaces(query) { predictions ->
                        runOnUiThread {
                            // Update search results
                            updateSearchResults(predictions)
                        }
                    }
                }
            }
            
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }
    
    private fun updateSearchResults(predictions: List<GoogleMapsLocationManager.PlacePrediction>) {
        // Update RecyclerView with search results
        // Implementation depends on your adapter
    }
    
    private fun updateAddressDisplay(address: String) {
        findViewById<TextView>(R.id.tvSelectedAddress).text = address
    }
}

// Extension function to format coordinates
fun Double.format(decimals: Int): String = "%.${decimals}f".format(this)

// =============================================
// ReportFormActivity.kt - UI for location selection
// =============================================

class ReportFormActivity : AppCompatActivity() {
    
    private lateinit var locationManager: LocationManager
    private var selectedLocation: ReportLocation? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_report_form)
        
        locationManager = LocationManager(this)
        
        // Auto-detect location when form opens
        detectCurrentLocation()
        
        setupLocationButtons()
    }
    
    private fun detectCurrentLocation() {
        showLocationLoading(true)
        
        locationManager.getCurrentLocation { location ->
            showLocationLoading(false)
            
            if (location != null) {
                selectedLocation = location
                updateLocationDisplay(location)
            } else {
                showLocationError("Unable to detect current location")
            }
        }
    }
    
    private fun setupLocationButtons() {
        // Use current location button
        findViewById<Button>(R.id.btnUseCurrentLocation).setOnClickListener {
            detectCurrentLocation()
        }
        
        // Pick on map button
        findViewById<Button>(R.id.btnPickOnMap).setOnClickListener {
            openMapPicker()
        }
        
        // Enter address button
        findViewById<Button>(R.id.btnEnterAddress).setOnClickListener {
            showAddressDialog()
        }
    }
    
    private fun updateLocationDisplay(location: ReportLocation) {
        findViewById<TextView>(R.id.tvAddress).text = location.address
        
        // Show accuracy indicator
        val accuracyText = when (location.source) {
            LocationSource.GPS -> "GPS (±${location.accuracy?.toInt()}m)"
            LocationSource.MAP_PICKER -> "Map Selected"
            LocationSource.ADDRESS_INPUT -> "Address Based"
        }
        findViewById<TextView>(R.id.tvLocationAccuracy).text = accuracyText
        
        // Show coordinates for debugging (optional)
        findViewById<TextView>(R.id.tvCoordinates).text = 
            "${location.latitude.format(6)}, ${location.longitude.format(6)}"
    }
    
    private fun openMapPicker() {
        val intent = Intent(this, MapLocationPickerActivity::class.java)
        selectedLocation?.let {
            intent.putExtra("current_lat", it.latitude)
            intent.putExtra("current_lng", it.longitude)
        }
        startActivityForResult(intent, REQUEST_MAP_PICKER)
    }
    
    private fun showAddressDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_enter_address, null)
        val editText = dialogView.findViewById<EditText>(R.id.etAddress)
        
        AlertDialog.Builder(this)
            .setTitle("Enter Address")
            .setView(dialogView)
            .setPositiveButton("Locate") { _, _ ->
                val address = editText.text.toString().trim()
                if (address.isNotEmpty()) {
                    geocodeAddress(address)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun geocodeAddress(address: String) {
        showLocationLoading(true)
        
        locationManager.geocodeAddress(address) { location ->
            showLocationLoading(false)
            
            if (location != null) {
                selectedLocation = location
                updateLocationDisplay(location)
            } else {
                showLocationError("Address not found")
            }
        }
    }
    
    private fun submitReport() {
        val location = selectedLocation
        if (location == null) {
            Toast.makeText(this, "Please select a location", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Create report with location data
        val report = Report(
            title = findViewById<EditText>(R.id.etTitle).text.toString(),
            description = findViewById<EditText>(R.id.etDescription).text.toString(),
            category = getSelectedCategory(),
            latitude = location.latitude,
            longitude = location.longitude,
            address = location.address,
            formattedAddress = location.formattedAddress,
            city = location.city,
            state = location.state,
            postalCode = location.postalCode,
            locationSource = location.source.name,
            locationAccuracy = location.accuracy
        )
        
        // Submit to Supabase
        submitReportToSupabase(report)
    }
}

// Extension function to format coordinates
fun Double.format(decimals: Int): String = "%.${decimals}f".format(this)
