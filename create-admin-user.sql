-- =============================================
-- CREATE ADMIN USER AND PROFILE
-- =============================================

-- First, you need to create the admin user in Supabase Auth
-- This can be done through the Supabase Dashboard or programmatically

-- After creating the auth user, run this to create the admin profile
-- Replace 'USER_ID_FROM_AUTH' with the actual UUID from auth.users

-- Example admin user creation (you'll get the actual user_id from Supabase Auth)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     'your-user-id-here',
--     'admin@civictrack.com',
--     crypt('admin123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW()
-- );

-- Create admin profile (run this after creating the auth user)
INSERT INTO admins (
    user_id,
    full_name,
    role,
    department_id,
    is_active,
    permissions
) VALUES (
    '3c58f7bc-4078-488b-a615-132ced9dcf4b', -- Replace with actual user ID from auth.users
    'CivicTrack Administrator',
    'super_admin',
    (SELECT id FROM departments WHERE name = 'Public Works' LIMIT 1),
    true,
    '{
        "read": true,
        "write": true,
        "delete": true,
        "manage_users": true,
        "manage_departments": true,
        "view_analytics": true,
        "export_data": true
    }'
);

-- Create a regular user profile (optional - for testing citizen reports)
-- This will be created automatically when citizens register through your mobile app
-- INSERT INTO users (
--     id,
--     full_name,
--     phone,
--     is_verified
-- ) VALUES (
--     'CITIZEN_USER_ID_FROM_AUTH',
--     'Test Citizen',
--     '+1234567890',
--     true
-- );

-- =============================================
-- CREATE SAMPLE DATA (OPTIONAL)
-- =============================================

-- Sample reports for testing (uncomment if needed)
-- INSERT INTO reports (
--     user_id,
--     title,
--     description,
--     category,
--     priority,
--     status,
--     latitude,
--     longitude,
--     address,
--     assigned_department
-- ) VALUES
-- (
--     'CITIZEN_USER_ID_FROM_AUTH',
--     'Large pothole on Main Street',
--     'There is a significant pothole near the intersection of Main St and 5th Ave that is causing damage to vehicles.',
--     'pothole',
--     'high',
--     'pending',
--     40.7128,
--     -74.0060,
--     '123 Main St, New York, NY 10001',
--     (SELECT id FROM departments WHERE name = 'Public Works' LIMIT 1)
-- ),
-- (
--     'CITIZEN_USER_ID_FROM_AUTH',
--     'Broken streetlight',
--     'The streetlight at the corner of Oak Ave and Elm St has been out for several days.',
--     'streetlight',
--     'medium',
--     'in_progress',
--     40.7589,
--     -73.9851,
--     '456 Oak Ave, New York, NY 10002',
--     (SELECT id FROM departments WHERE name = 'Utilities' LIMIT 1)
-- );

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify departments were created
SELECT * FROM departments;

-- Verify admin was created (run after inserting with actual user_id)
-- SELECT 
--     a.*,
--     d.name as department_name,
--     u.email
-- FROM admins a
-- LEFT JOIN departments d ON a.department_id = d.id
-- LEFT JOIN auth.users u ON a.user_id = u.id;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
