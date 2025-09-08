// Script to create admin user in Supabase Auth
// Run this in Node.js environment with Supabase admin credentials

import { createClient } from '@supabase/supabase-js'

// You need to use your service role key (not anon key) for admin operations
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseServiceRoleKey = 'YOUR_SERVICE_ROLE_KEY' // Found in Settings > API

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@civictrack.com',
      password: 'admin123',
      email_confirm: true // Auto-confirm email
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('Auth user created:', authUser.user.id)

    // Create admin profile record
    const { data: profileData, error: profileError } = await supabase
      .from('admin_profiles')
      .insert({
        user_id: authUser.user.id,
        email: 'admin@civictrack.com',
        full_name: 'System Administrator',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating admin profile:', profileError)
      return
    }

    console.log('Admin user created successfully!')
    console.log('User ID:', authUser.user.id)
    console.log('Email:', authUser.user.email)

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createAdminUser()
