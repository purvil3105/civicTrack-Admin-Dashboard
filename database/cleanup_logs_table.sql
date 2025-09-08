-- Create cleanup_logs table for tracking automatic report cleanup
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS cleanup_logs (
  id SERIAL PRIMARY KEY,
  cleanup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reports_deleted INTEGER NOT NULL DEFAULT 0,
  cutoff_date TIMESTAMPTZ NOT NULL,
  deleted_report_ids INTEGER[] DEFAULT '{}',
  deleted_reports_summary JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_cleanup_date 
ON cleanup_logs(cleanup_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin access)
CREATE POLICY "Enable read access for authenticated users" 
ON cleanup_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON cleanup_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create a function to manually trigger cleanup (optional)
CREATE OR REPLACE FUNCTION create_cleanup_logs_table()
RETURNS void
LANGUAGE sql
AS $$
  -- This function is used by the cleanup service to ensure the table exists
  -- It's safe to call multiple times
  SELECT 1;
$$;

-- Comment on table
COMMENT ON TABLE cleanup_logs IS 'Tracks automatic cleanup of resolved reports older than retention period';
COMMENT ON COLUMN cleanup_logs.cleanup_date IS 'When the cleanup was performed';
COMMENT ON COLUMN cleanup_logs.reports_deleted IS 'Number of reports deleted in this cleanup';
COMMENT ON COLUMN cleanup_logs.cutoff_date IS 'Reports older than this date were deleted';
COMMENT ON COLUMN cleanup_logs.deleted_report_ids IS 'Array of report IDs that were deleted';
COMMENT ON COLUMN cleanup_logs.deleted_reports_summary IS 'JSON summary of deleted reports for audit trail';
