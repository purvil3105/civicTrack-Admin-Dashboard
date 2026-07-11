import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Divider,
  TextField,
  Button,
  Grid
} from '@mui/material'
import { Save } from '@mui/icons-material'
import { usePreferences } from '../hooks/usePreferences'

const SettingsPage = () => {
  const { slaWarningDays, setSlaWarningDays, slaBreachDays, setSlaBreachDays } =
    usePreferences()

  // Local state for the form so it only saves on submit
  const [warningInput, setWarningInput] = useState(slaWarningDays)
  const [breachInput, setBreachInput] = useState(slaBreachDays)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')

    const warning = parseInt(warningInput)
    const breach = parseInt(breachInput)

    if (isNaN(warning) || isNaN(breach) || warning <= 0 || breach <= 0) {
      setErrorMsg('Values must be positive numbers.')
      return
    }

    if (warning >= breach) {
      setErrorMsg('Warning threshold must be less than Breach threshold.')
      return
    }

    setSlaWarningDays(warning)
    setSlaBreachDays(breach)
    setSuccessMsg('SLA configurations saved successfully.')
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Service Level Agreements (SLA) Tracking
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure the number of days a report can remain open before
          triggering visual warnings on the dashboard. (These settings are saved
          locally in your browser).
        </Typography>

        {errorMsg && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setErrorMsg('')}
          >
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccessMsg('')}
          >
            {successMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSave} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Warning Threshold (Days)"
                type="number"
                fullWidth
                value={warningInput}
                onChange={(e) => setWarningInput(e.target.value)}
                helperText="Reports older than this will be highlighted yellow."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Breach Threshold (Days)"
                type="number"
                fullWidth
                value={breachInput}
                onChange={(e) => setBreachInput(e.target.value)}
                helperText="Reports older than this will be highlighted red."
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button variant="contained" type="submit" startIcon={<Save />}>
              Save Preferences
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default SettingsPage
