import { useState, useCallback } from 'react'
import { getDentistSchedule, getCalendarEvents, manageScheduleSlots, updateVisitStatus } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export const useDentistSchedule = () => {
    const { user } = useAuth()
    const dentistId = user?.id

    const [appointments, setAppointments] = useState([])
    const [slots, setSlots] = useState([])
    const [monthEvents, setMonthEvents] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Fetch day schedule
    const loadDaySchedule = useCallback(async (date) => {
        if (!dentistId) return
        setIsLoading(true)
        try {
            const moment = (await import('moment')).default
            const dateStr = moment(date).format('YYYY-MM-DD')
            const res = await getDentistSchedule(dentistId, dateStr)
            if (res.status === 'success') {
                setAppointments(res.data.appointments || [])
                setSlots(res.data.slots || [])
            }
        } catch (error) {
            toast.error('Failed to load schedule')
        } finally {
            setIsLoading(false)
        }
    }, [dentistId])

    // Fetch month events for calendar view
    const loadMonthEvents = useCallback(async (date) => {
        if (!dentistId) return
        try {
            const moment = (await import('moment')).default
            const month = date.getMonth() + 1
            const year = date.getFullYear()
            const res = await getCalendarEvents('DENTIST', dentistId, month, year)
            if (res.status === 'success') {
                const evts = res.data.map(item => {
                    const baseTime = item.scheduled_time || '09:00:00'
                    const startTime = new Date(`${item.event_date}T${baseTime}`)

                    let endTime
                    if (item.event_type === 'SLOT' && item.end_time) {
                        endTime = new Date(`${item.event_date}T${item.end_time}`)
                    } else {
                        endTime = moment(startTime).add(item.duration_minutes || 45, 'minutes').toDate()
                    }

                    return {
                        id: `${item.event_type.toLowerCase()}-${item.id || item.request_id}`,
                        title: item.event_type === 'SLOT' ? item.slot_label : `Visit: ${item.patient_name}`,
                        start: startTime,
                        end: endTime,
                        resource: item,
                        type: item.event_type.toLowerCase(),
                        status: item.visit_status,
                        color: item.color_tag
                    }
                })
                setMonthEvents(evts)
            }
        } catch (err) {
            console.error("Month fetch error:", err)
        }
    }, [dentistId])

    // Add a new schedule slot
    const addSlot = useCallback(async (slotData) => {
        if (!dentistId) return false
        setSubmitting(true)
        try {
            await manageScheduleSlots({
                dentist_id: dentistId,
                action: 'add',
                ...slotData
            })
            toast.success('Clinical Slot Allocated')
            return true
        } catch (error) {
            toast.error(error.message || 'Failed to add slot')
            return false
        } finally {
            setSubmitting(false)
        }
    }, [dentistId])

    // Update slot status (remove, block, unblock)
    const updateSlotStatus = useCallback(async (slotId, action) => {
        if (!dentistId) return false
        
        // Optimistic Update
        const previousSlots = [...slots];
        const prevMonthEvts = [...monthEvents];
        const sid = `slot-${slotId}`;

        if (action === 'remove') {
            setSlots(prev => prev.filter(s => s.id !== slotId));
            setMonthEvents(prev => prev.filter(e => e.id !== sid));
        } else {
            const newStatus = action === 'block' ? 'blocked' : 'available';
            setSlots(prev => prev.map(s => s.id === slotId ? { ...s, slot_status: newStatus } : s));
            setMonthEvents(prev => prev.map(e => e.id === sid ? { ...e, status: newStatus } : e));
        }

        try {
            await manageScheduleSlots({
                dentist_id: dentistId,
                action: action,
                slot_id: slotId
            })
            toast.success(`Slot ${action === 'remove' ? 'Removed' : 'Updated'}`)
            return true
        } catch (error) {
            setSlots(previousSlots);
            setMonthEvents(prevMonthEvts);
            toast.error('Operation failed')
            return false
        }
    }, [dentistId, slots, monthEvents])

    // Update appointment visit status
    const updateApptStatus = useCallback(async (appointmentId, newStatus, extraData = {}) => {
        setSubmitting(true)
        const previousAppts = [...appointments];
        const prevMonthEvts = [...monthEvents];
        const aid = `appointment-${appointmentId}`;

        // 1. Optimistic Updates
        setAppointments(prev => prev.map(app => 
            app.id === appointmentId ? { ...app, visit_status: newStatus } : app
        ));
        setMonthEvents(prev => prev.map(e => 
            e.id === aid ? { ...e, status: newStatus } : e
        ));

        try {
            await updateVisitStatus({
                appointment_id: appointmentId,
                new_status: newStatus,
                ...extraData
            })
            toast.success(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`)
            return true
        } catch (error) {
            setAppointments(previousAppts);
            setMonthEvents(prevMonthEvts);
            toast.error('Failed to update status')
            return false
        } finally {
            setSubmitting(false)
        }
    }, [appointments, monthEvents])

    // Postpone appointment
    const postponeAppointment = useCallback(async (appointmentId, reason, newDate, newTime) => {
        setSubmitting(true)
        const previousAppts = [...appointments];
        const prevMonthEvts = [...monthEvents];
        const aid = `appointment-${appointmentId}`;

        setAppointments(prev => prev.map(app => 
            app.id === appointmentId ? { ...app, visit_status: 'postponed' } : app
        ));
        setMonthEvents(prev => prev.map(e => 
            e.id === aid ? { ...e, status: 'postponed' } : e
        ));

        try {
            await updateVisitStatus({
                appointment_id: appointmentId,
                new_status: 'postponed',
                reason,
                new_date: newDate,
                new_time: newTime
            })
            toast.success('Visit Postponed & Rescheduled')
            return true
        } catch (error) {
            setAppointments(previousAppts);
            setMonthEvents(prevMonthEvts);
            toast.error('Reschedule failed')
            return false
        } finally {
            setSubmitting(false)
        }
    }, [appointments, monthEvents])

    return {
        appointments,
        slots,
        monthEvents,
        isLoading,
        submitting,
        dentistId,
        loadDaySchedule,
        loadMonthEvents,
        addSlot,
        updateSlotStatus,
        updateApptStatus,
        postponeAppointment
    }
}
