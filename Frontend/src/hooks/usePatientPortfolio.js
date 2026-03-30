import { useState, useEffect, useCallback } from 'react'
import { getPatientPortfolio } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export const usePatientPortfolio = (patientId) => {
    const { user } = useAuth()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchPortfolio = useCallback(async () => {
        if (!patientId || !user?.id) return

        setLoading(true)
        setError(null)
        try {
            const res = await getPatientPortfolio(patientId, user.id)
            if (res.status === 'success') {
                setData(res.data)
            } else {
                setError(res.message || 'Failed to load portfolio')
                toast.error(res.message || 'Failed to load portfolio')
            }
        } catch (err) {
            setError(err.message || 'Failed to load patient portfolio')
            toast.error("Failed to load patient portfolio")
        } finally {
            setLoading(false)
        }
    }, [patientId, user?.id])

    useEffect(() => {
        fetchPortfolio()
    }, [fetchPortfolio])

    return {
        data,
        loading,
        error,
        refetch: fetchPortfolio
    }
}
