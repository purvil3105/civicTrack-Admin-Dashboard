import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database table names
export const TABLES = {
  REPORTS: 'reports'
}

// Report status constants - Simple 4 states
export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
}

// Report categories
export const REPORT_CATEGORIES = {
  ROADS: "roads",
  LIGHTING: "lighting", 
  WATER_SUPPLY: "water_supply",
  CLEANLINESS: "cleanliness",
  PUBLIC_SAFETY: "public_safety",
  OBSTRUCTIONS: "obstructions",
}
