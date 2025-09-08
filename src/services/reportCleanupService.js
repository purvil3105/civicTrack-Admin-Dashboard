import { supabase } from '../lib/supabase'

export class ReportCleanupService {
  static CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  static RETENTION_DAYS = 15 // Keep resolved reports for 15 days

  constructor() {
    this.isRunning = false
    this.intervalId = null
  }

  /**
   * Start the automatic cleanup service
   */
  start() {
    if (this.isRunning) {
      console.log('Cleanup service is already running')
      return
    }

    console.log('Starting automatic report cleanup service...')
    this.isRunning = true
    
    // Run cleanup immediately
    this.runCleanup()
    
    // Set up interval for daily cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup()
    }, ReportCleanupService.CLEANUP_INTERVAL)
  }

  /**
   * Stop the automatic cleanup service
   */
  stop() {
    if (!this.isRunning) {
      console.log('Cleanup service is not running')
      return
    }

    console.log('Stopping automatic report cleanup service...')
    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Run the cleanup process
   */
  async runCleanup() {
    try {
      console.log('Running report cleanup process...')
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - ReportCleanupService.RETENTION_DAYS)
      
      // Get resolved reports older than retention period
      const { data: reportsToDelete, error: fetchError } = await supabase
        .from('reports')
        .select('id, title, created_at, updated_at')
        .eq('status', 'resolved')
        .lt('updated_at', cutoffDate.toISOString())

      if (fetchError) {
        console.error('Error fetching reports for cleanup:', fetchError)
        return { success: false, error: fetchError.message }
      }

      if (!reportsToDelete || reportsToDelete.length === 0) {
        console.log('No reports found for cleanup')
        return { success: true, deleted: 0, reports: [] }
      }

      console.log(`Found ${reportsToDelete.length} reports to delete:`)
      reportsToDelete.forEach(report => {
        console.log(`- ID: ${report.id}, Title: ${report.title}, Updated: ${report.updated_at}`)
      })

      // Create cleanup log entry before deletion
      const cleanupLog = {
        cleanup_date: new Date().toISOString(),
        reports_deleted: reportsToDelete.length,
        cutoff_date: cutoffDate.toISOString(),
        deleted_report_ids: reportsToDelete.map(r => r.id),
        deleted_reports_summary: reportsToDelete.map(r => ({
          id: r.id,
          title: r.title,
          created_at: r.created_at,
          updated_at: r.updated_at
        }))
      }

      // Insert cleanup log
      const { error: logError } = await supabase
        .from('cleanup_logs')
        .insert([cleanupLog])

      if (logError) {
        console.error('Error creating cleanup log:', logError)
        // Continue with deletion even if logging fails
      }

      // Delete the reports
      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('status', 'resolved')
        .lt('updated_at', cutoffDate.toISOString())

      if (deleteError) {
        console.error('Error deleting reports:', deleteError)
        return { success: false, error: deleteError.message }
      }

      console.log(`Successfully deleted ${reportsToDelete.length} resolved reports`)
      
      return { 
        success: true, 
        deleted: reportsToDelete.length, 
        reports: reportsToDelete,
        cutoffDate: cutoffDate.toISOString()
      }

    } catch (error) {
      console.error('Unexpected error during cleanup:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Manually trigger cleanup (for admin use)
   */
  async manualCleanup() {
    console.log('Manual cleanup triggered by admin')
    return await this.runCleanup()
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats() {
    try {
      // Get recent cleanup logs
      const { data: logs, error: logsError } = await supabase
        .from('cleanup_logs')
        .select('*')
        .order('cleanup_date', { ascending: false })
        .limit(10)

      if (logsError) {
        console.error('Error fetching cleanup logs:', logsError)
        return { success: false, error: logsError.message }
      }

      // Get current resolved reports count
      const { count: resolvedCount, error: countError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')

      if (countError) {
        console.error('Error counting resolved reports:', countError)
        return { success: false, error: countError.message }
      }

      // Get reports that will be deleted in next cleanup
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - ReportCleanupService.RETENTION_DAYS)

      const { count: pendingDeleteCount, error: pendingError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .lt('updated_at', cutoffDate.toISOString())

      if (pendingError) {
        console.error('Error counting pending deletion reports:', pendingError)
        return { success: false, error: pendingError.message }
      }

      return {
        success: true,
        data: {
          recentLogs: logs || [],
          currentResolvedCount: resolvedCount || 0,
          pendingDeleteCount: pendingDeleteCount || 0,
          retentionDays: ReportCleanupService.RETENTION_DAYS,
          isServiceRunning: this.isRunning,
          nextCleanupIn: this.getNextCleanupTime()
        }
      }

    } catch (error) {
      console.error('Error getting cleanup stats:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get time until next cleanup
   */
  getNextCleanupTime() {
    if (!this.isRunning) return null
    
    const now = new Date()
    const nextMidnight = new Date()
    nextMidnight.setHours(24, 0, 0, 0) // Next midnight
    
    const msUntilNext = nextMidnight.getTime() - now.getTime()
    const hoursUntilNext = Math.floor(msUntilNext / (1000 * 60 * 60))
    const minutesUntilNext = Math.floor((msUntilNext % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hoursUntilNext}h ${minutesUntilNext}m`
  }

  /**
   * Create the cleanup_logs table if it doesn't exist
   */
  async initializeCleanupLogsTable() {
    try {
      const { error } = await supabase.rpc('create_cleanup_logs_table')
      
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating cleanup_logs table:', error)
        return false
      }
      
      console.log('Cleanup logs table initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing cleanup logs table:', error)
      return false
    }
  }
}

// Create a singleton instance
export const reportCleanupService = new ReportCleanupService()

// Auto-start the service when the module is imported
// You can comment this out if you want to start it manually
if (typeof window !== 'undefined') {
  // Only start in browser environment
  setTimeout(() => {
    reportCleanupService.start()
  }, 5000) // Start after 5 seconds to allow app to initialize
}
