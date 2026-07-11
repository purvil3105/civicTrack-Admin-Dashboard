import { useState, useEffect } from 'react'

export const usePreferences = () => {
  const [slaWarningDays, setSlaWarningDays] = useState(
    () => parseInt(localStorage.getItem('sla_warning')) || 3
  )
  const [slaBreachDays, setSlaBreachDays] = useState(
    () => parseInt(localStorage.getItem('sla_breach')) || 7
  )

  useEffect(() => {
    localStorage.setItem('sla_warning', slaWarningDays.toString())
    localStorage.setItem('sla_breach', slaBreachDays.toString())
  }, [slaWarningDays, slaBreachDays])

  return {
    slaWarningDays,
    setSlaWarningDays,
    slaBreachDays,
    setSlaBreachDays
  }
}
