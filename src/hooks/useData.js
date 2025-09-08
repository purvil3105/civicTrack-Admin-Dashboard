import { useState, useEffect, useCallback } from 'react'
import { supabase, TABLES, REPORT_STATUS } from '../lib/supabase'

/**
 * Hook for fetching reports with real-time updates
 */
export const useReports = (filters = {}) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from(TABLES.REPORTS)
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query

      if (error) throw error

      setReports(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.category]) // Only depend on specific filter properties

  useEffect(() => {
    fetchReports()

    // Set up real-time subscription
    const subscription = supabase
      .channel('reports_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.REPORTS
      }, (payload) => {
        console.log('Real-time update:', payload)
        fetchReports() // Refetch data on changes
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [fetchReports])

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      console.log(`Updating report ${reportId} to ${newStatus}`)
      
      // Simple direct update
      const { error } = await supabase
        .from(TABLES.REPORTS)
        .update({ status: newStatus })
        .eq('id', reportId)

      if (error) {
        console.error('Update error:', error)
        throw error
      }

      console.log('Status updated successfully')
      
      // Refresh reports
      await fetchReports()
      
      return { 
        success: true,
        message: `Status updated to ${newStatus}` 
      }
    } catch (err) {
      console.error('Error:', err)
      return { 
        success: false, 
        error: err.message,
        message: `Failed to update status: ${err.message}`
      }
    }
  }

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    updateReportStatus
  }
}

/**
 * Hook for fetching dashboard statistics
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalReports: 0,
    newReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    reportsToday: 0,
    avgResolutionTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch basic counts
        const { data: allReports, error: reportsError } = await supabase
          .from(TABLES.REPORTS)
          .select('status, created_at, updated_at')

        if (reportsError) throw reportsError

        const today = new Date().toISOString().split('T')[0]
        const reportsToday = allReports?.filter(report => 
          report.created_at.startsWith(today)
        ).length || 0

        const statusCounts = allReports?.reduce((acc, report) => {
          acc[report.status] = (acc[report.status] || 0) + 1
          return acc
        }, {}) || {}

        // Calculate average resolution time for resolved reports
        const resolvedReports = allReports?.filter(report => 
          report.status === REPORT_STATUS.RESOLVED && report.updated_at
        ) || []

        const avgResolutionTime = resolvedReports.length > 0 
          ? resolvedReports.reduce((sum, report) => {
              const created = new Date(report.created_at)
              const resolved = new Date(report.updated_at)
              return sum + (resolved - created) / (1000 * 60 * 60 * 24) // days
            }, 0) / resolvedReports.length
          : 0

        setStats({
          totalReports: allReports?.length || 0,
          newReports: statusCounts[REPORT_STATUS.PENDING] || 0,
          inProgressReports: statusCounts[REPORT_STATUS.IN_PROGRESS] || 0,
          resolvedReports: statusCounts[REPORT_STATUS.RESOLVED] || 0,
          reportsToday,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10
        })

        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

/**
 * Hook for fetching reports by category (simplified for current database structure)
 */
export const useReportsByCategory = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Since we don't have a departments table, return empty data
  useEffect(() => {
    setLoading(false)
  }, [])

  return { 
    departments: [], 
    loading, 
    error,
    message: 'Departments feature not available with current database structure'
  }
}
