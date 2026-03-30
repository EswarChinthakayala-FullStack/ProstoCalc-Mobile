import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getNotifications } from '@/services/api'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0)
      return
    }

    try {
      setLoading(true)
      const res = await getNotifications(user.id, user.role.toUpperCase())
      if (res.status === 'success') {
        const unread = (res.data || []).filter(n => n.is_read === 0).length
        setUnreadCount(unread)
      }
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role, isAuthenticated])

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Poll for updates every 2 minutes (optional, but good for UX)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 120000)

    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUnreadCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications: fetchUnreadCount, loading }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
