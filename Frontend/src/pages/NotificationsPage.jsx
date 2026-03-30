import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellOff,
  Clock,
  Info,
  AlertTriangle,
  Search,
  Loader2,
  Check,
  Calendar,
  Zap,
  Activity,
  ShieldCheck,
  CheckCheck,
  Bell
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { getNotifications, markNotificationRead } from '@/services/api'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/context/ThemeContext'
import NotificationBell from '@/components/NotificationBell'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim() || !text) return <span>{text || ""}</span>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 rounded-[2px] px-0.5 font-bold no-underline inline-block leading-tight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

const StatCard = ({ title, value, subtext, icon: Icon, accent }) => {
  const accents = {
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-600/20 dark:border-zinc-800/50', bar: 'bg-blue-600' },
    indigo: { bg: 'bg-indigo-600/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-600/20 dark:border-zinc-800/50', bar: 'bg-indigo-600' },
    amber: { bg: 'bg-amber-600/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-600/20 dark:border-zinc-800/50', bar: 'bg-amber-600' },
    rose: { bg: 'bg-rose-600/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-600/20 dark:border-zinc-800/50', bar: 'bg-rose-600' },
  }
  const t = accents[accent] || accents.blue

  return (
    <div className="bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-100 dark:border-zinc-800/50 rounded-md p-6 sm:p-7 hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-600/30 transition-all duration-300 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${t.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none tabular-nums">{value}</h3>
      </div>
      <p className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em] mb-5">{title}</p>
      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-black flex items-center gap-2.5 uppercase tracking-widest leading-none">
          <span className={`w-1.5 h-1.5 rounded-md ${t.bar} animate-pulse`} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

const GridNotificationCard = ({ notif, onMarkRead, accentBase, index, highlight }) => {
  const isRead = notif.is_read === 1
  
  const getMeta = () => {
    const title = notif.title.toLowerCase()
    if (title.includes('appointment')) return { icon: Calendar, label: 'Schedule', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    if (title.includes('message')) return { icon: Info, label: 'Intercom', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
    if (title.includes('alert') || title.includes('critical')) return { icon: AlertTriangle, label: 'Priority', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
    return { icon: Bell, label: 'Feed', color: `text-${accentBase}-500`, bg: `bg-${accentBase}-500/10`, border: `border-${accentBase}-500/20` }
  }

  const meta = getMeta()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => !isRead && onMarkRead(notif.id)}
      className={`bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 sm:p-7 flex flex-col relative overflow-hidden group transition-all duration-300 ${!isRead ? 'cursor-pointer hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-600/30' : 'opacity-60 grayscale-[0.5]'}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${isRead ? 'bg-muted-foreground' : meta.color.replace('text-', 'bg-')} opacity-80`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${meta.bg} ${meta.color} ${meta.border}`}>
          <meta.icon className="w-3.5 h-3.5" />
          {meta.label}
        </div>
        {!isRead && <span className={`w-2 h-2 rounded-md ${meta.color.replace('text-', 'bg-')} animate-pulse shadow-[0_0_8px_${meta.color.replace('text-', 'rgba(')}]`} />}
      </div>

      <h4 className="text-sm sm:text-base font-black text-foreground leading-snug uppercase tracking-tight mb-3">
        <HighlightText text={notif.title} highlight={highlight} />
      </h4>
      <p className="text-[12px] font-bold text-muted-foreground leading-relaxed mb-8 line-clamp-3">
        <HighlightText text={notif.message} highlight={highlight} />
      </p>

      <div className="flex justify-between items-center mt-auto pt-5 border-t border-border/60">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all ${isRead ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-secondary border-border text-muted-foreground'}`}>
          <Check className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  )
}

const NotificationsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const themeColor = user?.role === 'dentist' ? 'teal' : 'blue'
  const accentBase = themeColor === 'teal' ? 'teal' : 'blue'

  const fetchNotifs = async () => {
    try {
      setIsLoading(true)
      const res = await getNotifications(user.id, user.role.toUpperCase())
      if (res.status === 'success') {
        setNotifications(res.data)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) fetchNotifs()
  }, [user?.id])

  const handleMarkRead = async (id) => {
    try {
      const res = await markNotificationRead(id)
      if (res.status === 'success') {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
        toast.success('Notification marked as read')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => n.is_read === 0)
    if (unread.length === 0) return

    try {
      toast.promise(Promise.all(unread.map(n => markNotificationRead(n.id))), {
        loading: 'Marking all as read...',
        success: () => {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
          return 'All notifications marked as read'
        },
        error: 'Failed to update notifications'
      })
    } catch (err) {
      console.error(err)
    }
  }

  const filteredNotifs = notifications.filter(n => {
    const matchesFilter = filter === 'UNREAD' ? n.is_read === 0 : true
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => n.is_read === 0).length,
    critical: notifications.filter(n => n.title.toLowerCase().includes('alert') || n.title.toLowerCase().includes('critical')).length,
    archived: notifications.filter(n => n.is_read === 1).length
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden text-slate-900 dark:text-white transition-colors duration-500">
      {user?.role === 'dentist' ? <ClinicianSidebar /> : <PatientSidebar />}

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative h-screen overflow-hidden`}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-100 shadow-inner"
          style={{ backgroundImage: `radial-gradient(var(--border) 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />

        {/* ═══ HEADER ═══ */}
        <header className="z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user?.role === 'dentist' ? <MobileSidebarTrigger /> : <PatientSidebarTrigger />}
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-black text-foreground tracking-tight leading-none uppercase">Activity Feed</h1>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5 hidden sm:flex items-center gap-2">
                    <span className={`text-${accentBase}-600 flex items-center gap-1.5 leading-none`}>
                      <Activity className="w-3.5 h-3.5" />
                      Neural Protocol
                    </span>
                    <span className="opacity-20">/</span>
                    <span>V-2.4 Live Intelligence</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative hidden md:block w-48 lg:w-64 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 h-10 bg-secondary/50 border border-border rounded-md text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-${accentBase}-600/5 focus:border-${accentBase}-500/50 transition-all outline-none`}
                  />
                </div>
                <NotificationBell color={accentBase} />
                <div 
                  className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-md border border-border bg-secondary/50 hover:bg-${accentBase}-600/10 hover:border-${accentBase}-600/20 transition-all cursor-pointer group`} 
                  onClick={() => navigate(user?.role === 'patient' ? '/patient/profile' : '/dentist/profile')}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 bg-${accentBase}-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-${accentBase}-500/20 group-hover:scale-105 transition-transform`}>
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[11px] font-black text-foreground leading-none uppercase tracking-tight">{user?.full_name?.split(' ')[0]}</p>
                    <p className={`text-[9px] font-black text-${accentBase}-500 mt-1 uppercase tracking-widest opacity-80`}>{user?.role === 'patient' ? 'Verified Node' : 'Command Auth'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto relative bg-background">
          <div className="absolute inset-0 bg-[grid_var(--border)_24px_24px] opacity-[0.03] pointer-events-none" />

          <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 relative z-10">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <StatCard title="Total Signals" value={stats.total} subtext="Full activity cluster" icon={Activity} accent="indigo" />
                <StatCard title="Priority Nodes" value={stats.unread} subtext="Pending interaction" icon={AlertTriangle} accent="amber" />
                <StatCard title="Critical Alerts" value={stats.critical} subtext="System level warnings" icon={Zap} accent="rose" />
                <StatCard title="Verified Data" value={stats.archived} subtext="Historical records" icon={ShieldCheck} accent="blue" />
              </div>

              <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-card/80 backdrop-blur-xl p-5 sm:p-6 rounded-md border border-border shadow-sm">
                <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 no-scrollbar items-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mr-3 hidden sm:block opacity-50">Filter Registry:</p>
                  {['ALL', 'UNREAD'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-6 py-3 rounded-md text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap border ${filter === f
                        ? `bg-${accentBase}-600 text-white border-${accentBase}-500 shadow-xl shadow-${accentBase}-600/30`
                        : 'bg-secondary text-muted-foreground border-border hover:bg-card hover:text-foreground'
                        }`}
                    >
                      {f === 'ALL' ? 'Universal Stack' : 'Priority Stream'}
                    </button>
                  ))}
                </div>

                {stats.unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className={`flex items-center gap-2 px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest text-${accentBase}-600 dark:text-${accentBase}-400 border border-${accentBase}-600/20 hover:bg-${accentBase}-600/5 transition-all group`}
                  >
                    <CheckCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Archive all nodes
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-blue-600 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-[11px] font-bold uppercase tracking-widest">Gathering records...</p>
                </div>
              ) : filteredNotifs.length === 0 ? (
                <div className="bg-card/50 backdrop-blur-md border border-border border-dashed rounded-md py-24 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-8">
                    <div className={`absolute inset-0 bg-${accentBase}-600/20 blur-2xl rounded-md`} />
                    <div className="relative w-20 h-20 bg-secondary border border-border rounded-md flex items-center justify-center">
                      <BellOff className={`w-8 h-8 text-${accentBase}-600`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-3 uppercase tracking-tight">Stream Empty</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground max-w-sm leading-relaxed opacity-60">
                    {searchQuery ? "No clinical signals matched your current query." : "Your activity feed is currently showing no active signals."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifs.map((notif, idx) => (
                      <GridNotificationCard
                        key={notif.id}
                        notif={notif}
                        onMarkRead={handleMarkRead}
                        accentBase={accentBase}
                        index={idx}
                        highlight={searchQuery}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </main>
        </div>
      </main>
    </div>
  )
}

export default NotificationsPage
