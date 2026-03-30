import { useState, useEffect, useCallback } from 'react'
import { getDentistDetails, saveDentistFullProfile, getDentistSettings, saveDentistSettings } from '@/services/api'
import { toast } from 'sonner'

export function useDentistProfile(dentistId) {
    const [profileData, setProfileData] = useState(null)
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        if (!dentistId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const [profileRes, settingsRes] = await Promise.all([
                getDentistDetails(dentistId),
                getDentistSettings(dentistId)
            ])

            if (profileRes.status === 'success') {
                setProfileData(profileRes.data)
            } else {
                toast.error(profileRes.message || 'Failed to fetch profile')
            }

            if (settingsRes.status === 'success') {
                setSettings(settingsRes.data)
            }

            setError(null)
        } catch (err) {
            setError(err.message || 'An error occurred')
            toast.error(err.message || 'Error loading data')
        } finally {
            setLoading(false)
        }
    }, [dentistId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const updateProfile = async (data) => {
        if (!dentistId) return false
        setSaving(true)
        try {
            const payload = { ...data, dentist_id: dentistId }
            const response = await saveDentistFullProfile(payload)
            if (response.status === 'success') {
                toast.success('Clinical artifacts updated')
                await fetchData()
                return true
            } else {
                toast.error(response.message || 'Failed to update profile')
                return false
            }
        } catch (err) {
            toast.error(err.message || 'Error updating profile')
            return false
        } finally {
            setSaving(false)
        }
    }

    const updateSettings = async (data) => {
        if (!dentistId) return false
        setSaving(true)
        try {
            const payload = { ...data, dentist_id: dentistId }
            const response = await saveDentistSettings(payload)
            if (response.status === 'success') {
                toast.success('Operational settings synchronized')
                await fetchData()
                return true
            } else {
                toast.error(response.message || 'Failed to update settings')
                return false
            }
        } catch (err) {
            toast.error(err.message || 'Error updating settings')
            return false
        } finally {
            setSaving(false)
        }
    }

    return {
        profileData,
        settings,
        loading,
        saving,
        error,
        updateProfile,
        updateSettings,
        refetch: fetchData
    }
}
