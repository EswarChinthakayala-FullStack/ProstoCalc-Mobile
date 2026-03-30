import { useState, useEffect, useCallback } from 'react'
import { getDentistAnalytics } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

export const useDentistAnalytics = (timeframe = '6months', mode = 'full') => {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingRequests: 0,
        treatmentPlans: 0,
        revenue: 0,
        calculations: 0
    })
    const [monthlyData, setMonthlyData] = useState([])
    const [procedures, setProcedures] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchStats = useCallback(async () => {
        if (!user?.id) return

        setIsLoading(true)
        setError(null)
        try {
            const res = await getDentistAnalytics(user.id, timeframe)
            
            if (res.status === 'success' && res.data) {
                setStats(res.data.stats || {
                    totalPatients: 0,
                    pendingRequests: 0,
                    treatmentPlans: 0,
                    revenue: 0,
                    calculations: 0
                })
                setMonthlyData(res.data.monthlyData || [])
                setProcedures(res.data.procedures || [])
            }
        } catch (e) {
            console.error("Failed to fetch analytics summary", e)
            setError(e.message || 'Failed to fetch analytics')
        } finally {
            setIsLoading(false)
        }
    }, [user?.id, timeframe])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        stats,
        monthlyData,
        procedures,
        isLoading,
        error,
        refetch: fetchStats
    }
}
