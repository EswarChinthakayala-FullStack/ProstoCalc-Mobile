import { useState, useEffect, useCallback } from 'react'
import { getTreatmentPlan, getTimeline, getPatientDetails, getDentistDetails } from '@/services/api'
import { toast } from 'sonner'

export const useConsultationData = (requestId) => {
  const [isLoading, setIsLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [patient, setPatient] = useState(null)
  const [dentist, setDentist] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [error, setError] = useState(null)

  const fetchHubData = useCallback(async (showLoading = false) => {
    if (!requestId) return
    
    try {
      if (showLoading) setIsLoading(true)
      setError(null)
      
      // 1. Get Plan & Appointment Info
      const planRes = await getTreatmentPlan({ request_id: requestId })
      if (planRes.status === 'success') {
        const planData = planRes.data
        setPlan(planData)

        // 2. Get Dependent Info in parallel
        const [patientRes, dentistRes, timelineRes] = await Promise.all([
          planData.patient_id ? getPatientDetails(planData.patient_id) : Promise.resolve({ status: 'success', data: null }),
          planData.dentist_id ? getDentistDetails(planData.dentist_id) : Promise.resolve({ status: 'success', data: null }),
          getTimeline(requestId)
        ])

        if (patientRes.status === 'success') setPatient(patientRes.data)
        if (dentistRes.status === 'success') setDentist(dentistRes.data)
        if (timelineRes.status === 'success') setTimeline(timelineRes.data)
      } else {
        setError(planRes.message || "Failed to load plan")
      }
    } catch (err) {
      console.error("Consultation data sync failed:", err)
      // Only show error toast if it's the first load
      if (showLoading) {
        setError(err.message || "Failed to load clinical data")
        toast.error("Cloud synchronization failed")
      }
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    fetchHubData(true)
    
    const intervalId = setInterval(() => {
      fetchHubData(false)
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(intervalId)
  }, [fetchHubData])

  return { isLoading, plan, patient, dentist, timeline, error, refresh: fetchHubData }
}
