import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, TABLES, REPORT_STATUS } from '../lib/supabase'

/**
 * Hook for fetching reports with real-time updates from Supabase via React Query.
 * @param {Object} filters - Optional filters to apply to the query.
 * @param {string} [filters.status] - Filter reports by specific status (e.g., 'pending').
 * @param {string} [filters.category] - Filter reports by specific category.
 * @param {number} [filters.page=0] - Page number for pagination.
 * @param {number} [filters.limit=50] - Number of items per page.
 * @returns {{
 *   reports: Array<Object>,
 *   loading: boolean,
 *   error: string | null,
 *   refetch: Function,
 *   updateReportStatus: Function
 * }} An object containing reports, loading state, error state, and mutators.
 */
export const useReports = (filters = {}) => {
  const queryClient = useQueryClient()
  const { status, category, page = 0, limit = 50 } = filters

  const fetchReports = async () => {
    let query = supabase
      .from(TABLES.REPORTS)
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (status) query = query.eq('status', status)
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data || []
  }

  const {
    data: reports = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['reports', { status, category, page, limit }],
    queryFn: fetchReports
  })

  // Set up real-time subscription to invalidate the cache when DB changes
  useEffect(() => {
    const subscription = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLES.REPORTS },
        (payload) => {
          console.log('Real-time update:', payload)
          // Invalidate all queries matching 'reports' to trigger a background refetch
          queryClient.invalidateQueries({ queryKey: ['reports'] })
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [queryClient])

  // Mutation for updating a report's status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, newStatus }) => {
      const { data, error } = await supabase
        .from(TABLES.REPORTS)
        .update({ status: newStatus })
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data, variables) => {
      console.log(`Status updated to ${variables.newStatus}`)
      // Invalidate queries so the UI updates
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
    },
    onError: (err) => {
      console.error('Update error:', err)
    }
  })

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ reportId, newStatus })
      return { success: true, message: `Status updated to ${newStatus}` }
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: `Failed to update status: ${err.message}`
      }
    }
  }

  const updateMultipleReportsStatus = async (reportIds, newStatus) => {
    try {
      await Promise.all(
        reportIds.map((id) =>
          updateStatusMutation.mutateAsync({ reportId: id, newStatus })
        )
      )
      return {
        success: true,
        message: `Updated ${reportIds.length} reports to ${newStatus}`
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: `Failed to update status: ${err.message}`
      }
    }
  }

  return {
    reports,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    updateReportStatus,
    updateMultipleReportsStatus
  }
}

/**
 * Hook for fetching aggregated dashboard statistics using React Query.
 * Calculates total reports, new reports, and average resolution time.
 * @returns {{
 *   stats: {
 *     totalReports: number,
 *     newReports: number,
 *     inProgressReports: number,
 *     resolvedReports: number,
 *     reportsToday: number,
 *     avgResolutionTime: number
 *   },
 *   loading: boolean,
 *   error: string | null
 * }} An object containing dashboard statistics and state.
 */
export const useDashboardStats = () => {
  const fetchStats = async () => {
    // Note: In an enterprise app, this aggregation should be done via a Postgres RPC or View.
    // For now, we fetch the status/dates and calculate on the client.
    const { data: allReports, error } = await supabase
      .from(TABLES.REPORTS)
      .select('status, created_at, updated_at')

    if (error) throw new Error(error.message)

    const today = new Date().toISOString().split('T')[0]
    const reportsToday =
      allReports?.filter((r) => r.created_at.startsWith(today)).length || 0

    const statusCounts =
      allReports?.reduce((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1
        return acc
      }, {}) || {}

    const resolvedReports =
      allReports?.filter(
        (r) => r.status === REPORT_STATUS.RESOLVED && r.updated_at
      ) || []
    const avgResolutionTime =
      resolvedReports.length > 0
        ? resolvedReports.reduce((sum, r) => {
            const created = new Date(r.created_at)
            const resolved = new Date(r.updated_at)
            return sum + (resolved - created) / (1000 * 60 * 60 * 24)
          }, 0) / resolvedReports.length
        : 0

    return {
      totalReports: allReports?.length || 0,
      newReports: statusCounts[REPORT_STATUS.PENDING] || 0,
      inProgressReports: statusCounts[REPORT_STATUS.IN_PROGRESS] || 0,
      resolvedReports: statusCounts[REPORT_STATUS.RESOLVED] || 0,
      reportsToday,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10
    }
  }

  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchStats,
    initialData: {
      totalReports: 0,
      newReports: 0,
      inProgressReports: 0,
      resolvedReports: 0,
      reportsToday: 0,
      avgResolutionTime: 0
    }
  })

  return { stats, loading: isLoading, error: error?.message || null }
}

/**
 * Hook for fetching reports by category (simplified for current database structure)
 */
export const useReportsByCategory = () => {
  return {
    departments: [],
    loading: false,
    error: null,
    message: 'Departments feature not available with current database structure'
  }
}
