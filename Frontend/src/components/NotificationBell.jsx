import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'

const NotificationBell = ({ size = 'md', color = 'teal' }) => {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const handleNavigate = () => {
    const path = user?.role === 'patient'
      ? '/dashboard/patient/notifications'
      : '/dashboard/clinician/notifications'
    navigate(path)
  }

  const sizes = {
    sm: { btn: 'w-8 h-8', icon: 'w-3.5 h-3.5', badge: '-top-1 -right-1 min-w-[14px] h-[14px] text-[7px]' },
    md: { btn: 'w-9 h-9 sm:w-10 sm:h-10', icon: 'w-4 h-4', badge: '-top-1.5 -right-1.5 min-w-[16px] h-[16px] text-[8px]' },
    lg: { btn: 'w-11 h-11', icon: 'w-5 h-5', badge: '-top-1.5 -right-1.5 min-w-[18px] h-[18px] text-[9px]' }
  }

  const s = sizes[size] || sizes.md

  const themes = {
    teal: 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/10',
    blue: 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 shadow-sm',
    slate: 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 shadow-sm'
  }

  const themeClass = themes[color] || themes.blue

  return (
    <button
      onClick={handleNavigate}
      className={`${s.btn} ${themeClass} border rounded-md flex items-center justify-center transition-all relative group active:scale-95`}
    >
      <Bell className={`${s.icon} group-hover:rotate-12 transition-transform`} />
      {unreadCount > 0 && (
        <span className={`absolute ${s.badge} px-1 bg-rose-500 rounded-md border border-white font-black text-white flex items-center justify-center shadow-lg shadow-rose-500/40`}>
          {unreadCount}
          <span className="absolute inset-0 bg-rose-500 rounded-md animate-ping opacity-25 -z-10" />
        </span>
      )}
    </button>
  )
}

export default NotificationBell
