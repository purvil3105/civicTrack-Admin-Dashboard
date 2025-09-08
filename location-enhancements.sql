-- =============================================
-- LOCATION ENHANCEMENT FOR REPORTS TABLE
-- =============================================

-- Add location source enum
CREATE TYPE location_source AS ENUM ('GPS', 'MAP_PICKER', 'ADDRESS_INPUT');

-- Add location-related columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS location_source location_source DEFAULT 'GPS';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8,2); -- GPS accuracy in meters
ALTER TABLE reports ADD COLUMN IF NOT EXISTS formatted_address TEXT; -- Full formatted address
ALTER TABLE reports ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'USA';

-- Add spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_reports_location_spatial ON reports USING gist (
    ll_to_earth(latitude, longitude)
);

-- Add function to calculate distance from city center
CREATE OR REPLACE FUNCTION calculate_distance_from_center(lat DECIMAL, lng DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    city_center_lat DECIMAL := 40.7128; -- Replace with your city's center
    city_center_lng DECIMAL := -74.0060; -- Replace with your city's center
    distance DECIMAL;
BEGIN
    -- Calculate distance using Haversine formula (returns km)
    SELECT earth_distance(
        ll_to_earth(city_center_lat, city_center_lng),
        ll_to_earth(lat, lng)
    ) / 1000 INTO distance;
    
    RETURN ROUND(distance, 2);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-calculate distance when report is inserted/updated
CREATE OR REPLACE FUNCTION update_location_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate distance from city center if coordinates are provided
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.metadata = COALESCE(NEW.metadata, '{}'::jsonb) || 
                      jsonb_build_object('distance_from_center', 
                                       calculate_distance_from_center(NEW.latitude, NEW.longitude));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_location_data
    BEFORE INSERT OR UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_location_data();

-- Sample data with different location sources
INSERT INTO reports (
    user_id,
    title,
    description,
    category,
    priority,
    status,
    latitude,
    longitude,
    address,
    formatted_address,
    city,
    state,
    postal_code,
    location_source,
    location_accuracy
) VALUES (
    -- GPS-based report (high accuracy)
    '3c58f7bc-4078-488b-a615-132ced9dcf4b', -- Replace with actual user ID
    'Pothole on Main Street',
    'Large pothole causing vehicle damage',
    'pothole',
    'high',
    'pending',
    40.712776,
    -74.005974,
    'Main St & 5th Ave',
    '123 Main St, New York, NY 10001, USA',
    'New York',
    'NY',
    '10001',
    'GPS',
    3.5
), (
    -- Map-picked location
    '3c58f7bc-4078-488b-a615-132ced9dcf4b',
    'Broken streetlight',
    'Streetlight not working at intersection',
    'streetlight',
    'medium',
    'pending',
    40.758896,
    -73.985130,
    'Broadway & 42nd St',
    'Broadway & 42nd St, New York, NY 10036, USA',
    'New York',
    'NY',
    '10036',
    'MAP_PICKER',
    NULL
), (
    -- Address-based location
    '3c58f7bc-4078-488b-a615-132ced9dcf4b',
    'Overflowing trash bin',
    'Trash bin has been overflowing for days',
    'trash',
    'medium',
    'pending',
    40.748817,
    -73.985428,
    'Empire State Building area',
    '350 5th Ave, New York, NY 10118, USA',
    'New York',
    'NY',
    '10118',
    'ADDRESS_INPUT',
    NULL
);

-- Query to find reports within a certain radius (e.g., 1km from a point)
-- SELECT r.*, 
--        earth_distance(ll_to_earth(40.7128, -74.0060), ll_to_earth(r.latitude, r.longitude)) / 1000 as distance_km
-- FROM reports r
-- WHERE earth_box(ll_to_earth(40.7128, -74.0060), 1000) @> ll_to_earth(r.latitude, r.longitude)
-- ORDER BY distance_km;
