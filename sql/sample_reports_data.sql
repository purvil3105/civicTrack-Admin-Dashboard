-- Sample data for testing priority distribution and category filters
-- Run this in Supabase SQL Editor to add test data

-- First, let's see what data exists
SELECT id, title, category, priority, status, created_at 
FROM reports 
LIMIT 10;

-- Add some sample reports with proper categories and priorities
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
  created_at
) VALUES 
-- Pothole reports
('00000000-0000-0000-0000-000000000000', 'Large pothole on Main Street', 'There is a large pothole causing damage to vehicles', 'pothole', 'high', 'pending', 40.7128, -74.0060, '123 Main Street, New York, NY', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', 'Small pothole near school', 'Small but growing pothole near elementary school', 'pothole', 'medium', 'in_progress', 40.7580, -73.9855, '456 School Ave, New York, NY', NOW() - INTERVAL '1 day'),

-- Streetlight issues
('00000000-0000-0000-0000-000000000000', 'Broken streetlight', 'Streetlight has been out for weeks', 'streetlight', 'medium', 'pending', 40.7414, -74.0055, '789 Dark Street, New York, NY', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', 'Flickering streetlight', 'Light keeps flickering, safety concern', 'streetlight', 'high', 'resolved', 40.7505, -73.9934, '321 Bright Ave, New York, NY', NOW() - INTERVAL '5 days'),

-- Water issues
('00000000-0000-0000-0000-000000000000', 'Water main break', 'Major water leak flooding the street', 'water', 'urgent', 'in_progress', 40.7589, -73.9851, '555 Flood St, New York, NY', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000000', 'Low water pressure', 'Water pressure very low in building', 'water', 'low', 'pending', 40.7282, -74.0776, '777 Dry Lane, New York, NY', NOW() - INTERVAL '4 days'),

-- Trash/cleanliness
('00000000-0000-0000-0000-000000000000', 'Overflowing garbage bins', 'All bins are overflowing, attracting pests', 'trash', 'medium', 'pending', 40.7488, -73.9857, '999 Messy Ave, New York, NY', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', 'Illegal dumping', 'Large furniture dumped on sidewalk', 'trash', 'high', 'resolved', 40.7614, -73.9776, '111 Clean St, New York, NY', NOW() - INTERVAL '6 days'),

-- Traffic issues
('00000000-0000-0000-0000-000000000000', 'Broken traffic light', 'Traffic light stuck on red', 'traffic', 'urgent', 'in_progress', 40.7505, -73.9934, '222 Busy Intersection, New York, NY', NOW() - INTERVAL '6 hours'),
('00000000-0000-0000-0000-000000000000', 'Missing stop sign', 'Stop sign was knocked down by accident', 'traffic', 'high', 'pending', 40.7282, -74.0776, '333 Stop Ave, New York, NY', NOW() - INTERVAL '1 day'),

-- Vandalism
('00000000-0000-0000-0000-000000000000', 'Graffiti on building', 'Large graffiti tag on public building', 'vandalism', 'low', 'pending', 40.7128, -74.0060, '444 Art Street, New York, NY', NOW() - INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000000', 'Broken bus stop', 'Bus stop shelter was vandalized', 'vandalism', 'medium', 'resolved', 40.7580, -73.9855, '555 Transit Ave, New York, NY', NOW() - INTERVAL '10 days'),

-- Other issues
('00000000-0000-0000-0000-000000000000', 'Fallen tree blocking path', 'Large tree fell and is blocking pedestrian path', 'other', 'high', 'in_progress', 40.7414, -74.0055, '666 Nature Walk, New York, NY', NOW() - INTERVAL '3 hours'),
('00000000-0000-0000-0000-000000000000', 'Playground equipment broken', 'Swing set is broken and unsafe', 'other', 'medium', 'pending', 40.7589, -73.9851, '777 Kids Park, New York, NY', NOW() - INTERVAL '5 days');

-- Verify the data was inserted
SELECT 
  category,
  priority,
  status,
  COUNT(*) as count
FROM reports 
GROUP BY category, priority, status
ORDER BY category, priority;

-- Check priority distribution
SELECT 
  priority,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reports), 2) as percentage
FROM reports 
GROUP BY priority
ORDER BY 
  CASE priority 
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2  
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- Check category distribution  
SELECT 
  category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reports), 2) as percentage
FROM reports 
GROUP BY category
ORDER BY count DESC;
