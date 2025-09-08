// Debug utility to check report data structure
import { supabase } from '../lib/supabase'

export const debugReports = async () => {
  try {
    console.log('Fetching reports for debugging...')
    
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Error fetching reports:', error)
      return
    }
    
    console.log('Sample reports:', reports)
    
    if (reports && reports.length > 0) {
      const sampleReport = reports[0]
      console.log('Sample report structure:')
      console.log('- id:', sampleReport.id)
      console.log('- title:', sampleReport.title)
      console.log('- category:', sampleReport.category)
      console.log('- priority:', sampleReport.priority)
      console.log('- status:', sampleReport.status)
      console.log('- created_at:', sampleReport.created_at)
      
      // Check for any null/undefined fields
      const priorities = reports.map(r => r.priority).filter(Boolean)
      const categories = reports.map(r => r.category).filter(Boolean)
      
      console.log('Unique priorities:', [...new Set(priorities)])
      console.log('Unique categories:', [...new Set(categories)])
      
      // Count nulls
      const nullPriorities = reports.filter(r => !r.priority).length
      const nullCategories = reports.filter(r => !r.category).length
      
      console.log('Null priorities:', nullPriorities)
      console.log('Null categories:', nullCategories)
    }
    
    return reports
  } catch (err) {
    console.error('Debug error:', err)
  }
}

// Call this function from browser console to debug
if (typeof window !== 'undefined') {
  window.debugReports = debugReports
}
