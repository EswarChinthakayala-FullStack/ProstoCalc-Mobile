import { useState, useEffect, useCallback } from 'react'
import * as api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export const useHealthTrackers = () => {
    const { user } = useAuth()
    const [analytics, setAnalytics] = useState(null)
    const [mouthHistory, setMouthHistory] = useState([])
    const [medications, setMedications] = useState([])
    const [habitAnalytics, setHabitAnalytics] = useState(null)
    const [exerciseProgress, setExerciseProgress] = useState(null)
    const [exercises, setExercises] = useState([])
    const [exerciseSettings, setExerciseSettings] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchAnalytics = useCallback(async () => {
        if (!user) return
        try {
            const res = await api.getStreakAnalytics(user.id)
            if (res.status === 'success') {
                setAnalytics(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch streak analytics:", error)
        }
    }, [user])

    const fetchMouthOpening = useCallback(async () => {
        if (!user) return
        try {
            const res = await api.getMouthOpeningHistory(user.id)
            if (res.status === 'success') {
                setMouthHistory(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch mouth opening history:", error)
        }
    }, [user])

    const fetchMedications = useCallback(async () => {
        if (!user) return
        try {
            const res = await api.getMedications(user.id)
            if (res.status === 'success') {
                setMedications(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch medications:", error)
        }
    }, [user])

    const fetchHabitAnalytics = useCallback(async () => {
        if (!user) return
        try {
            const res = await api.getHabitAnalytics(user.id)
            if (res.status === 'success') {
                setHabitAnalytics(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch habit analytics:", error)
        }
    }, [user])

    const fetchExerciseProgress = useCallback(async () => {
        if (!user) return
        try {
            const res = await api.getExerciseProgress(user.id)
            if (res.status === 'success') {
                setExerciseProgress(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch exercise progress:", error)
        }
    }, [user])

    const fetchExercises = useCallback(async () => {
        try {
            const res = await api.getExercises()
            if (res.status === 'success') {
                setExercises(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch exercises:", error)
        }
    }, [])

    const fetchExerciseSettings = useCallback(async () => {
        if (!user) return
        try {
            const res = await api.getExerciseSettings(user.id)
            if (res.status === 'success') {
                setExerciseSettings(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch exercise settings:", error)
        }
    }, [user])

    const refreshAll = useCallback(async () => {
        if (!user) return
        setIsLoading(true)
        await Promise.all([
            fetchAnalytics(),
            fetchMouthOpening(),
            fetchMedications(),
            fetchHabitAnalytics(),
            fetchExerciseProgress(),
            fetchExercises(),
            fetchExerciseSettings()
        ])
        setIsLoading(false)
    }, [user, fetchAnalytics, fetchMouthOpening, fetchMedications, fetchHabitAnalytics, fetchExerciseProgress, fetchExercises, fetchExerciseSettings])

    useEffect(() => {
        refreshAll()
    }, [refreshAll])

    const logMouthOpening = async (valueMm) => {
        if (!user) return
        try {
            const res = await api.addMouthOpening({
                patient_id: user.id,
                value_mm: parseFloat(valueMm)
            })
            if (res.status === 'success') {
                toast.success("Mouth opening logged.")
                fetchMouthOpening()
                fetchAnalytics()
            }
        } catch (error) {
            toast.error("Failed to log mouth opening.")
        }
    }

    const logHabitEntry = async (data) => {
        if (!user) return
        try {
            const res = await api.logHabitEntry({
                patient_id: user.id,
                ...data
            })
            if (res.status === 'success') {
                toast.success("Daily habit protocol synchronized.")
                fetchAnalytics()
                fetchHabitAnalytics()
            }
        } catch (error) {
            toast.error("Failed to sync habit node.")
        }
    }

    const logMed = async (medId, status) => {
        try {
            const res = await api.logMedication({ medication_id: medId, status })
            if (res.status === 'success') {
                toast.success(`Medication marked as ${status}.`)
                fetchMedications()
                fetchAnalytics()
            }
        } catch (error) {
            toast.error("Failed to log medication.")
        }
    }

    const addNewMed = async (data) => {
        try {
            const res = await api.addMedication({ ...data, patient_id: user.id })
            if (res.status === 'success') {
                toast.success("Medication added.")
                fetchMedications()
            }
        } catch (error) {
            toast.error("Failed to add medication.")
        }
    }

    const removeMed = async (id) => {
        try {
            const res = await api.deleteMedication(id)
            if (res.status === 'success') {
                toast.success("Medication removed.")
                fetchMedications()
            }
        } catch (error) {
            toast.error("Failed to remove medication.")
        }
    }

    const logExercise = async (data) => {
        if (!user) return
        try {
            const res = await api.logExercise({
                user_id: user.id,
                ...data
            })
            if (res.status === 'success') {
                toast.success("Exercise progress saved.")
                fetchExerciseProgress()
                fetchAnalytics()
            }
        } catch (error) {
            toast.error("Failed to save exercise.")
        }
    }

    const logMeasurement = async (measurement) => {
        if (!user) return
        try {
            const res = await api.logMeasurement({
                user_id: user.id,
                measurement
            })
            if (res.status === 'success') {
                toast.success("Measurement saved.")
            }
        } catch (error) {
            toast.error("Failed to save measurement.")
        }
    }

    return {
        analytics,
        mouthHistory,
        medications,
        habitAnalytics,
        exerciseProgress,
        exercises,
        exerciseSettings,
        isLoading,
        logMouthOpening,
        logHabitEntry,
        logMed,
        addNewMed,
        removeMed,
        logExercise,
        logMeasurement,
        refresh: refreshAll
    }
}
