import { useState, useEffect, useCallback } from 'react'
import { getTreatmentCatalog, updateTreatmentCosts } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export const useTreatmentCatalog = () => {
    const { user } = useAuth()
    const [catalog, setCatalog] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState(null)

    const fetchCatalog = useCallback(async () => {
        if (!user?.id) return

        setIsLoading(true)
        setError(null)
        try {
            const res = await getTreatmentCatalog(user.id)
            if (res.status === 'success') {
                setCatalog(res.data || [])
            } else {
                setError(res.message || 'Failed to load catalog')
            }
        } catch (err) {
            setError(err.message || 'Failed to load treatment catalog')
            console.error("Failed to load catalog", err)
        } finally {
            setIsLoading(false)
        }
    }, [user?.id])

    useEffect(() => {
        fetchCatalog()
    }, [fetchCatalog])

    const saveCatalog = useCallback(async (treatments) => {
        if (!user?.id) return false

        setIsSaving(true)
        try {
            const res = await updateTreatmentCosts({
                dentist_id: user.id,
                treatments
            })
            if (res.status === 'success') {
                toast.success('Treatment catalog updated')
                await fetchCatalog() // Refresh after save
                return true
            } else {
                toast.error(res.message || 'Failed to save catalog')
                return false
            }
        } catch (err) {
            toast.error(err.message || 'Save failed')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [user?.id, fetchCatalog])

    return {
        catalog,
        isLoading,
        isSaving,
        error,
        fetchCatalog,
        saveCatalog
    }
}
