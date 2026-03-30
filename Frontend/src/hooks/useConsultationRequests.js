import { useState, useEffect, useCallback } from 'react'
import { getConsultationRequests, respondToRequest } from '@/services/api'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

export const useConsultationRequests = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const res = await getConsultationRequests('DENTIST', user.id)
      if (res.status === 'success') {
        setRequests(res.data)
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error)
      toast.error("Failed to load requests")
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const respond = async (requestId, status, scheduleData = null) => {
    try {
      const payload = {
        request_id: requestId,
        status,
        ...scheduleData
      }
      
      const res = await respondToRequest(payload)
      if (res.status === 'success') {
        toast.success(`Request ${status.toLowerCase()} successfully`)
        fetchRequests() // Refresh list
        return true
      } else {
        toast.error(res.message || "Action failed")
        return false
      }
    } catch (error) {
      console.error("Response error:", error)
      toast.error("Action failed")
      return false
    }
  }

  return {
    requests,
    isLoading,
    fetchRequests,
    respond
  }
}
