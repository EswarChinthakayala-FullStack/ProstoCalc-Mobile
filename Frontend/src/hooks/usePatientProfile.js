import { useState, useEffect } from 'react'
import { getPatientDetails, savePatientFullProfile } from '@/services/api'
import { toast } from 'sonner'

export const usePatientProfile = (userId) => {
    const [profileData, setProfileData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const fetchProfile = async () => {
        if (!userId) return
        
        try {
            setLoading(true)
            const response = await getPatientDetails(userId)
            if (response.status === 'success') {
                setProfileData(response.data)
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err)
            setError(err)
            toast.error("Could not load full profile data")
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async (formData) => {
        if (!userId) return false

        try {
            setSaving(true)
            const response = await savePatientFullProfile({
                patient_id: userId,
                ...formData
            })

            if (response.status === 'success') {
                toast.success('Profile updated successfully')
                // Refresh data to ensure we have the latest server state
                await fetchProfile()
                return true
            } else {
                toast.error(response.message || 'Failed to update profile')
                return false
            }
        } catch (err) {
            console.error("Failed to update profile:", err)
            toast.error(err.message || 'An error occurred while saving')
            return false
        } finally {
            setSaving(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchProfile()
    }, [userId])

    return {
        profileData,
        loading,
        saving,
        error,
        refetch: fetchProfile,
        updateProfile
    }
}
