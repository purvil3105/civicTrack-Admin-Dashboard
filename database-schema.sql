-- =============================================
-- CivicTrack Database Schema
-- =============================================

-- Enable Row Level Security
ALTER database postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE report_status AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');
CREATE TYPE report_category AS ENUM ('pothole', 'streetlight', 'trash', 'water', 'traffic', 'vandalism', 'other');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'department_head', 'staff');

-- =============================================
-- 1. DEPARTMENTS TABLE
-- =============================================
CREATE TABLE departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default departments
INSERT INTO departments (name, description, contact_email) VALUES
('Public Works', 'Roads, infrastructure, and general maintenance', 'publicworks@city.gov'),
('Utilities', 'Water, electricity, and utility services', 'utilities@city.gov'),
('Sanitation', 'Waste management and cleanliness', 'sanitation@city.gov'),
('Transportation', 'Traffic signals, signs, and transportation', 'transport@city.gov'),
('Parks & Recreation', 'Parks, playgrounds, and recreational facilities', 'parks@city.gov');

-- =============================================
-- 2. USERS TABLE (Citizens)
-- =============================================
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_verified BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. ADMINS TABLE
-- =============================================
CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role admin_role DEFAULT 'admin',
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"read": true, "write": true, "delete": false, "manage_users": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. REPORTS TABLE
-- =============================================
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category report_category NOT NULL,
    priority priority_level DEFAULT 'medium',
    status report_status DEFAULT 'pending',
    
    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    
    -- Assignment
    assigned_department UUID REFERENCES departments(id),
    assigned_to UUID REFERENCES admins(id),
    
    -- Media
    images JSONB DEFAULT '[]', -- Array of image URLs
    attachments JSONB DEFAULT '[]', -- Array of file URLs
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}' -- For extra fields like urgency notes, etc.
);

-- =============================================
-- 5. COMMENTS TABLE
-- =============================================
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal admin comments vs public updates
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. REPORT STATUS HISTORY TABLE
-- =============================================
CREATE TABLE report_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    old_status report_status,
    new_status report_status NOT NULL,
    changed_by UUID REFERENCES admins(id),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_assigned_department ON reports(assigned_department);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);
CREATE INDEX idx_comments_report_id ON comments(report_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_admin_id ON notifications(admin_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION TO CREATE STATUS HISTORY
-- =============================================
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO report_status_history (report_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.assigned_to);
        
        -- Set resolved_at timestamp when status changes to resolved
        IF NEW.status = 'resolved' THEN
            NEW.resolved_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_report_status_changes 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION create_status_history();
