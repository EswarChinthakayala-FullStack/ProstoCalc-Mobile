import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export const useMedications = () => {
    const { user } = useAuth()
    const [medications, setMedications] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [lastFetchTime, setLastFetchTime] = useState(null)
    const fetchInProgress = useRef(false)

    const fetchMedications = useCallback(async (force = false) => {
        if (!user) return
        
        // Prevent concurrent fetches
        if (fetchInProgress.current && !force) {
            console.log('[useMedications] Fetch already in progress, skipping...')
            return
        }
        
        try {
            fetchInProgress.current = true
            setIsLoading(true)
            console.log('[useMedications] Fetching medications for patient:', user.id)
            
            const res = await api.get(`/get_medications?patient_id=${user.id}`)
            console.log('[useMedications] Response received:', res.data)
            
            if (res.data?.status === 'success') {
                setMedications(res.data.data || [])
                setLastFetchTime(new Date())
                console.log('[useMedications] Medications updated:', res.data.data?.length || 0)
            } else {
                console.error('[useMedications] Error in response:', res.data)
            }
        } catch (error) {
            console.error('[useMedications] Failed to fetch medications:', error)
            toast.error("Could not load medication schedule.")
        } finally {
            setIsLoading(false)
            fetchInProgress.current = false
        }
    }, [user])

    useEffect(() => {
        if (user) fetchMedications()
    }, [user, fetchMedications])

    const addMedication = async (medData) => {
        try {
            console.log('[useMedications] Adding medication:', medData)
            const res = await api.post('/add_medication', {
                patient_id: user.id,
                ...medData
            })
            console.log('[useMedications] Add response:', res.data)
            if (res.data?.status === 'success') {
                toast.success("Medication node added to schedule.")
                // Force fresh fetch after adding
                await fetchMedications(true)
                return true
            }
            return false
        } catch (error) {
            console.error('[useMedications] Failed to add medication:', error)
            toast.error("Failed to add medication.")
            return false
        }
    }

    const logIntake = async (medicationId, status = 'taken', date = null) => {
        try {
            console.log('[useMedications] Logging intake - ID:', medicationId, 'Status:', status, 'Date:', date)
            const payload = {
                medication_id: medicationId,
                status
            }
            if (date) payload.date = date
            
            const res = await api.post('/log_medication', payload)
            console.log('[useMedications] Log response:', res.data)
            if (res.data?.status === 'success') {
                toast.success(`Protocol ${status === 'taken' ? 'completed' : 'updated'}.`)
                // Force fresh fetch after logging
                await fetchMedications(true)
                return true
            }
            return false
        } catch (error) {
            console.error('[useMedications] Failed to log intake:', error)
            toast.error("Failed to log intake.")
            return false
        }
    }

    const deleteMedication = async (id) => {
        try {
            console.log('[useMedications] Deleting medication - ID:', id)
            const res = await api.post('/delete_medication', { id })
            console.log('[useMedications] Delete response:', res.data)
            if (res.data?.status === 'success') {
                toast.success("Medication de-scheduled.")
                // Force fresh fetch after deletion
                await fetchMedications(true)
                return true
            }
            return false
        } catch (error) {
            console.error('[useMedications] Failed to delete medication:', error)
            toast.error("Failed to delete medication.")
            return false
        }
    }

    return {
        medications,
        isLoading,
        addMedication,
        logIntake,
        deleteMedication,
        refresh: fetchMedications
    }
}
