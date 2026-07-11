import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Skeleton,
  Alert
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'in_progress':
      return 'info'
    case 'resolved':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'default'
  }
}

const AuditLogsPage = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const {
    data: logs,
    isLoading,
    error
  } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_status_history')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // If the table doesn't exist yet, fail gracefully and return an empty array
        if (
          error.message.includes('Could not find the table') ||
          error.code === '42P01'
        ) {
          console.warn(
            'Audit logs table not found. Returning empty list until database is updated.'
          )
          return []
        }
        throw new Error(error.message)
      }
      return data || []
    }
  })

  const handleChangePage = (event, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedLogs = (logs || []).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Failed to load audit logs: {error.message}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4, width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ color: '#1976d2' }}
        >
          Audit Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track all status changes made by administrators.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Report ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Previous Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>New Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Changed By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={80} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={150} />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No audit logs found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {log.report_id?.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.old_status?.replace('_', ' ') || 'N/A'}
                        color={getStatusColor(log.old_status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.new_status?.replace('_', ' ') || 'N/A'}
                        color={getStatusColor(log.new_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {log.changed_by || 'System'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && logs?.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={logs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
    </Box>
  )
}

export default AuditLogsPage
