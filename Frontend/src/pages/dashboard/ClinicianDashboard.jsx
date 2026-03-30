import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Settings,
  Plus,
  Users,
  FileText,
  Calendar,
  Activity,
  Search,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  ClipboardList,
  IndianRupee,
  History,
  LogOut,
  Moon,
  Sun,
  MoreVertical,
  Filter,
  ArrowUpRight,
  BrainCircuit,
  Layers,
  Stethoscope,
  Clock,
  CheckCircle2,
  CalendarCheck,
  User,
  Mail,
  TrendingUp,
  ArrowRight,
  Zap,
  X,
  Fingerprint
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import api, { getConsultationRequests, getPatientPortfolio } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useDentistProfile } from '@/hooks/useDentistProfile'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import UniversalLoader from '@/components/UniversalLoader'
import { useSidebar } from '@/context/SidebarContext'
import { useNotifications } from '@/context/NotificationContext'
import NotificationBell from '@/components/NotificationBell'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════
   UI UTILITIES
   ═══════════════════════════════════════════════════════════════════ */
const HighlightText = ({ text, highlight }) => {
  if (!highlight?.trim() || !text) return <span>{text || ""}</span>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-[2px] px-0.5 font-bold no-underline inline-block leading-tight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════ */
const StatCard = ({ title, value, subtext, icon: Icon, accent, hidden = false, isCurrency = false }) => {
  if (hidden) return null
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-800', bar: 'bg-teal-600', glow: 'shadow-teal-200/50 dark:shadow-teal-950/20' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-800', bar: 'bg-amber-600', glow: 'shadow-amber-200/50 dark:shadow-amber-950/20' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-800', bar: 'bg-indigo-600', glow: 'shadow-indigo-200/50 dark:shadow-indigo-950/20' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800', bar: 'bg-emerald-600', glow: 'shadow-emerald-200/50 dark:shadow-emerald-950/20' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className={cn(
      "bg-white dark:bg-zinc-950/20 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-md p-5 sm:p-6 transition-all duration-300 group relative overflow-hidden",
      "hover:shadow-2xl hover:-translate-y-1 hover:border-teal-200 dark:hover:border-zinc-700"
    )}>
      {/* Accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
        <div className="flex flex-col items-end">
          <span className={`w-2 h-2 rounded-md ${t.bar} opacity-60 animate-pulse`} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1.5">
        {isCurrency && <span className="text-base font-black text-slate-400 dark:text-zinc-600/70">₹</span>}
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{value}</h3>
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500/70 uppercase tracking-[0.2em] mb-4">{title}</p>

      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/50">
        <p className="text-[11px] text-slate-500 dark:text-teal-400 font-bold flex items-center gap-2 uppercase tracking-wide">
          <TrendingUp className="w-3 h-3 opacity-50" />
          {subtext}
        </p>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════
   MINI CALENDAR
   ═══════════════════════════════════════════════════════════════════ */
const MiniCalendar = ({ selectedDate, onSelectDate, onMonthChange, monthEvents }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const { theme } = useTheme();

  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentMonth);
    }
  }, [currentMonth.getMonth(), currentMonth.getFullYear()]);

  const generateCalendarDays = () => {
    const m = currentMonth.getMonth();
    const y = currentMonth.getFullYear();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(y, m, i));
    return days;
  };

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const hasEvent = (date) => {
    if (!date) return false;
    const dateStr = date.toLocaleDateString('en-CA');
    return monthEvents.some(e => {
      if (e.event_date && e.event_date.startsWith(dateStr)) return true;
      if (e.scheduled_date && e.scheduled_date.startsWith(dateStr)) return true;
      return false;
    });
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const days = generateCalendarDays();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-md p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-600/50" />
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-black text-slate-900 dark:text-zinc-100 uppercase tracking-[0.2em]">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1.5 focus-within:ring-0">
          <button onClick={handlePrevMonth} className="w-8 h-8 rounded-md bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-center hover:bg-teal-50 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-teal-600 transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNextMonth} className="w-8 h-8 rounded-md bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-center hover:bg-teal-50 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-teal-600 transition-all active:scale-95">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map(d => (
          <div key={d} className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => (
          <button
            key={i}
            onClick={() => date && onSelectDate(date)}
            disabled={!date}
            className={`
              relative h-10 w-full rounded-md flex flex-col items-center justify-center text-xs font-black transition-all
              ${!date ? 'opacity-0 cursor-default' : 'cursor-pointer'}
              ${isSelected(date) ? 'bg-teal-600 text-white shadow-lg scale-105' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60'}
              ${isToday(date) && !isSelected(date) ? 'border-2 border-teal-500/50 text-teal-600 dark:text-teal-400 bg-teal-50/20' : ''}
            `}
          >
            <span className="relative z-10">{date && date.getDate()}</span>
            {date && hasEvent(date) && (
              <div className={`absolute bottom-2 w-1 h-1 rounded-md ${isSelected(date) ? 'bg-white' : 'bg-teal-500'} shadow-sm`} />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 dark:text-zinc-600 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-md bg-teal-500 shadow-sm" /> NODE
          </span>
          <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 dark:text-zinc-600 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-md bg-slate-200 dark:bg-zinc-800 shadow-sm" /> NULL
          </span>
        </div>
        <Button
          onClick={() => setCurrentMonth(new Date())}
          variant="ghost"
          className="h-7 px-3 text-[9px] font-black text-teal-600 dark:text-zinc-400 uppercase tracking-[0.2em] hover:bg-teal-50 dark:hover:bg-zinc-900 rounded-md transition-all"
        >
          Synchronize
        </Button>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
const ClinicianDashboard = () => {
  const { user, logout } = useAuth()
  const { settings } = useDentistProfile(user?.id)
  const isCalcOnly = settings?.consultation_mode === 'CALCULATION_ONLY'
  const navigate = useNavigate()

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [slots, setSlots] = useState([])
  const [dayRequests, setDayRequests] = useState([])
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingRequests: 0,
    treatmentPlans: 0,
    revenue: 0
  })
  const { unreadCount } = useNotifications()

  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, newest
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab) setActiveTab(tab)
  }, [location])
  const [recentRequests, setRecentRequests] = useState([])

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [monthEvents, setMonthEvents] = useState([])

  const fetchMonthEvents = async (date) => {
    try {
      if (!user?.id) return;
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const res = await api.get(`/get_calendar_events?role=DENTIST&user_id=${user.id}&month=${m}&year=${y}`)
      if (res.data?.status === 'success') {
        setMonthEvents(res.data.data || []);
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchDaySchedule = async (date) => {
    try {
      if (!user?.id) return;
      const dateStr = date.toLocaleDateString('en-CA');
      const appointmentsRes = await api.get(`/get_dentist_schedule?dentist_id=${user.id}&date=${dateStr}`)
      setAppointments(appointmentsRes.data?.data?.appointments || [])
      setSlots(appointmentsRes.data?.data?.slots || [])
      setDayRequests(appointmentsRes.data?.data?.requests || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const [patientsRes, requestsRes] = await Promise.all([
          api.get(`/list_patients?dentist_id=${user.id}`),
          getConsultationRequests('DENTIST', user.id)
        ])

        const patientData = Array.isArray(patientsRes.data) ? patientsRes.data : []
        setPatients(patientData)

        const allRequests = requestsRes.data || []

        // Compute summary stats from existing data
        const pendingCount = allRequests.filter(r => r.status === 'PENDING').length
        const plansCount = allRequests.filter(r => r.estimated_cost != null || r.treatment_name).length
        const totalRevenue = allRequests.reduce((sum, r) => sum + (parseFloat(r.estimated_cost) || 0), 0)

        setStats({
          totalPatients: patientData.length,
          pendingRequests: pendingCount,
          treatmentPlans: plansCount,
          revenue: totalRevenue
        })

        const statusPriority = { 'PENDING': 1, 'COMPLETED': 2, 'APPROVED': 3, 'REJECTED': 4 };
        const sortedRequests = [...allRequests].sort((a, b) => {
          const priorityA = statusPriority[a.status] || 99;
          const priorityB = statusPriority[b.status] || 99;
          if (priorityA !== priorityB) return priorityA - priorityB;
          return new Date(b.requested_at) - new Date(a.requested_at);
        });

        setRecentRequests(sortedRequests.slice(0, 5))
      } catch (error) {
        // handle
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      fetchData()
      fetchMonthEvents(selectedDate)
      fetchDaySchedule(selectedDate)
    }
  }, [user?.id])

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchDaySchedule(date);
    if (date.getMonth() !== selectedDate.getMonth() || date.getFullYear() !== selectedDate.getFullYear()) {
      fetchMonthEvents(date);
    }
  }

  const timelineItems = [
    ...appointments.map(a => ({ ...a, type: 'appointment', time: a.scheduled_time })),
    ...slots.map(s => ({ ...s, type: 'slot', time: s.start_time })),
    ...dayRequests.map(r => ({ ...r, type: 'request', time: r.requested_at.includes('T') ? r.requested_at.split('T')[1].slice(0, 5) : '00:00' }))
  ].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const filteredPatients = patients
    .filter(p =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toString().includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.full_name?.localeCompare(b.full_name)
      if (sortBy === 'newest') return b.id - a.id
      return 0
    })

  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme, toggleTheme } = useTheme()

  if (isLoading) return <UniversalLoader text="SYNCHRONIZING PROVIDER HUB..." variant="dentist" />

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black font-sans overflow-hidden transition-colors duration-300">
      <ClinicianSidebar activeTab={activeTab} />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative"
      >
        <div className="absolute inset-0 bg-[grid_#1e293b_24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] dark:opacity-[0.1] pointer-events-none" />

        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              {/* Left: Branding */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <div className="w-10 h-10 bg-teal-600 rounded-md flex items-center justify-center text-white shadow-lg shadow-teal-600/20 shrink-0 hidden sm:flex rotate-[-2deg]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase">Provider Hub</h1>
                  <div className="flex items-center gap-2 mt-1 hidden sm:flex">
                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-[0.2em]">Operational Console</span>
                    <div className="w-1.5 h-1.5 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden xl:block w-72 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
                  <Input
                    className="pl-11 h-10 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-md text-[13px] font-bold focus:ring-4 focus:ring-teal-500/5 transition-all outline-none"
                    placeholder="SCAN REPOSITORY..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 hidden sm:block mx-1" />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-md bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-zinc-900 transition-all w-10 h-10 active:scale-95"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>

                <NotificationBell />

                <Link to="/dentist/profile" className="flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
                  <div className="w-9 h-9 bg-teal-600 rounded-md flex items-center justify-center text-white text-sm font-black shadow-md shadow-teal-600/20">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[12px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-teal-600 dark:text-zinc-500 mt-1 uppercase tracking-widest">Master Auth</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24">

          {/* KPI Stats */}
          <div className={cn("grid grid-cols-2 gap-4 sm:gap-6 mb-10", isCalcOnly ? 'lg:grid-cols-2' : 'lg:grid-cols-4')}>
            <StatCard hidden={isCalcOnly} title="Registry Load" value={stats.totalPatients} subtext="Active networked patients" icon={Users} accent="teal" />
            {!isCalcOnly && (
              <div className="cursor-pointer" onClick={() => navigate('/dashboard/clinician/requests')}>
                <StatCard title="Request Stack" value={stats.pendingRequests} subtext="Awaiting verification" icon={ClipboardList} accent="amber" />
              </div>
            )}
            <StatCard title="Active Plans" value={stats.treatmentPlans} subtext="Validated treatments" icon={FileText} accent="indigo" />
            <StatCard title="Revenue Flow" value={`${(stats.revenue / 1000).toFixed(1)}K`} subtext="Projected accruals" icon={IndianRupee} accent="emerald" isCurrency={true} />
          </div>

          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

              {/* Left Column */}
              <div className="xl:col-span-2 space-y-8">

                {/* Recent Requests */}
                {!isCalcOnly && (
                  <div className="bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm relative group">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500/50" />
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-[14px] font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-widest">
                          <Clock className="w-4.5 h-4.5 text-amber-500" />
                          Priority Request Stream
                        </h2>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-1">Pending clinical verification</p>
                      </div>
                      <Link to="/dashboard/clinician/requests">
                        <Button variant="outline" size="sm" className="rounded-md border-slate-200 dark:border-teal-800 text-[10px] font-black uppercase tracking-widest hover:bg-teal-50 dark:hover:bg-teal-900/60 gap-1.5 h-9 transition-all active:scale-95 shadow-sm">
                          Access All <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-zinc-800/30">
                      {recentRequests.filter(req => !searchQuery || req.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div className="text-center py-16 px-6">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-teal-900/30 rounded-md mx-auto flex items-center justify-center mb-4 border border-slate-100 dark:border-teal-800/50">
                            <CheckCircle2 className="w-8 h-8 text-teal-600/30" />
                          </div>
                          <p className="text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                            {searchQuery ? 'Search parameter yielded null' : 'Request stack cleared'}
                          </p>
                        </div>
                      ) : (
                        recentRequests.filter(req => !searchQuery || req.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((req, i) => (
                          <div
                            key={req.id || i}
                            className="flex items-center gap-5 px-6 py-5 hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-all cursor-pointer group/item"
                            onClick={() => {
                              if (req.status === 'APPROVED' || req.status === 'COMPLETED') { navigate(`/dashboard/clinician/consultation/${req.id}`) }
                              else { navigate('/dashboard/clinician/requests') }
                            }}
                          >
                            <div className="w-12 h-12 rounded-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-base shrink-0 group-hover/item:border-teal-400 dark:group-hover/item:border-zinc-700 shadow-sm transition-all rotate-[-2deg] group-hover/item:rotate-0">
                              {req.patient_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-800 dark:text-white truncate uppercase tracking-tight group-hover/item:text-teal-600 dark:group-hover/item:text-teal-400 transition-colors">
                                <HighlightText text={req.patient_name} highlight={searchQuery} />
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                                  {new Date(req.requested_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${req.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-900/40' :
                                req.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500 border-rose-100 dark:border-rose-900/40' :
                                  req.status === 'COMPLETED' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-500 border-teal-100 dark:border-teal-900/40' :
                                    'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-900/40'
                                }`}>
                                {req.status}
                              </span>
                              <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-300 dark:text-teal-800 group-hover/item:text-teal-500 group-hover/item:bg-teal-50 dark:group-hover/item:bg-teal-900 transition-all rounded-md">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Calendar */}
                {!isCalcOnly && (
                  <MiniCalendar
                    selectedDate={selectedDate}
                    onSelectDate={handleDateSelect}
                    onMonthChange={fetchMonthEvents}
                    monthEvents={monthEvents}
                  />
                )}

                {isCalcOnly && (
                  <div className="bg-white dark:bg-zinc-950/20 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-md p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-600/30" />
                    <div className="w-20 h-20 bg-teal-600 rounded-md flex items-center justify-center text-white mb-8 shadow-2xl shadow-teal-600/30 rotate-[-4deg] group-hover:rotate-0 transition-transform duration-500">
                      <Sparkles className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">Satellite Console Only</h3>
                    <p className="text-slate-500 dark:text-zinc-500/70 text-sm max-w-sm font-bold leading-relaxed uppercase tracking-wide">
                      Clinical telemetry and identity registries are encrypted in this operational mode to prevent unauthorized data exfiltration.
                    </p>
                    <Link to="/dashboard/clinician/estimator" className="mt-10">
                      <Button className="bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-black rounded-md h-12 px-10 text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 transition-all active:scale-95">
                        Launch Calculator
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-8">

                {/* AI Assistant Card */}
                <div className="bg-slate-900 dark:bg-teal-900/20 rounded-md p-8 text-white relative overflow-hidden border border-slate-800 dark:border-teal-800 shadow-2xl group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BrainCircuit className="w-24 h-24 text-teal-400 rotate-12" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <BrainCircuit className="w-6.5 h-6.5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Neural Copilot</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-md bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                          <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.2em]">Diagnostic Live</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8 uppercase tracking-wide">
                      Process predictive clinical diagnostics and generate algorithmic procedural models.
                    </p>

                    <Link to="/dashboard/clinician/ai-chat" className="block mt-auto">
                      <Button className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-black rounded-md h-11 text-[11px] uppercase tracking-[0.2em] transition-all group/btn shadow-lg shadow-teal-500/20 active:scale-95">
                        <span className="flex items-center gap-3">
                          INTERFACE <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Schedule Timeline */}
                {!isCalcOnly && (
                  <div className="bg-white dark:bg-black/40 border border-slate-200 dark:border-teal-900 rounded-md overflow-hidden shadow-sm relative group">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500/50" />
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-teal-900/50 flex items-center justify-between">
                      <div>
                        <h2 className="text-[14px] font-black text-slate-900 dark:text-teal-50 uppercase tracking-widest">Chronometry</h2>
                        <span className="text-[9px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-[0.15em] mt-1 block">Scheduled Events</span>
                      </div>
                      <div className="px-3 py-1 bg-teal-50 dark:bg-teal-900/40 rounded-md border border-teal-100 dark:border-teal-800 text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                        {selectedDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>

                    <div className="p-6 space-y-6 max-h-[480px] overflow-y-auto custom-scrollbar">
                      {timelineItems.filter(item => {
                        const name = (item.type === 'appointment' || item.type === 'request') ? item.patient_name : item.slot_label;
                        return !searchQuery || name?.toLowerCase().includes(searchQuery.toLowerCase());
                      }).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900/30 border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-md flex items-center justify-center mb-4">
                            <CalendarCheck className="w-8 h-8 text-teal-600/20" />
                          </div>
                          <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                            Null Timeline Detected
                          </p>
                        </div>
                      ) : (
                        timelineItems.filter(item => {
                          const name = (item.type === 'appointment' || item.type === 'request') ? item.patient_name : item.slot_label;
                          return !searchQuery || name?.toLowerCase().includes(searchQuery.toLowerCase());
                        }).map((item, i) => {
                          const isAppt = item.type === 'appointment';
                          const isRequest = item.type === 'request';
                          const timeString = (isAppt || isRequest) ? item.time || item.scheduled_time : item.start_time;
                          const patientName = (isAppt || isRequest) ? item.patient_name : item.slot_label;
                          const typeLabel = isAppt ? 'Authenticated Visit' : isRequest ? 'Inquiry' : 'Reserved Slot';
                          const isArrived = isAppt && item.visit_status === 'arrived';
                          const isComplete = isAppt && item.visit_status === 'visited';

                          let dotColor = 'bg-slate-300 dark:bg-zinc-800';
                          if (isAppt) {
                            if (isComplete) dotColor = 'bg-slate-400 dark:bg-zinc-900';
                            else if (isArrived) dotColor = 'bg-emerald-500';
                            else dotColor = 'bg-amber-500';
                          } else if (isRequest) {
                            dotColor = 'bg-rose-500';
                          } else {
                            dotColor = 'bg-indigo-500';
                          }

                          return (
                            <div
                              key={i}
                              className={`flex gap-4 group/tl cursor-pointer transition-all ${isComplete ? 'opacity-40 grayscale-[0.5]' : ''}`}
                              onClick={() => {
                                if ((isAppt || isRequest) && item.patient_id) {
                                  navigate(`/dashboard/clinician/patient/${item.patient_id}`);
                                } else {
                                  navigate('/dashboard/clinician/schedule');
                                }
                              }}
                            >
                              <div className="flex flex-col items-center pt-2">
                                <div className={`w-2.5 h-2.5 rounded-md ${dotColor} shrink-0 shadow-[0_0_8px_currentColor] relative z-10`} />
                                {i !== timelineItems.length - 1 && <div className="w-px flex-1 bg-slate-100 dark:bg-zinc-800 mt-2" />}
                              </div>
                              <div className="flex-1 pb-2 min-w-0">
                                <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md p-4 group-hover/tl:bg-white dark:group-hover/tl:bg-zinc-900 group-hover/tl:border-teal-400/30 transition-all shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-zinc-500 shrink-0" />
                                    <span className="text-[10px] font-black text-slate-500 dark:text-zinc-600 uppercase tracking-widest">
                                      {timeString?.slice(0, 5) || 'TBA'} {item.end_time ? `— ${item.end_time.slice(0, 5)}` : ''}
                                    </span>
                                  </div>
                                  <p className="text-[13px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight group-hover/tl:text-teal-600 dark:group-hover/tl:text-teal-400 transition-colors">
                                    <HighlightText text={patientName || 'Reserved Node'} highlight={searchQuery} />
                                  </p>
                                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold mt-1 uppercase tracking-widest">{typeLabel}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-black/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard/clinician/schedule')}
                        className="w-full text-[10px] font-black text-teal-600 dark:text-zinc-500 uppercase tracking-widest hover:bg-teal-100/30 dark:hover:bg-zinc-900 rounded-md h-10 gap-2 shadow-sm"
                      >
                        Global Timeline <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patient Directory Tab */}
          {activeTab === 'Patients' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-zinc-950 rounded-md p-6 sm:p-8 shadow-sm relative overflow-hidden border border-slate-200 dark:border-zinc-800/50">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-600 dark:bg-teal-500" />
                <div className="relative z-10">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Clinical Patient Directory</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Active networked patient registries: {filteredPatients.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[200px] h-11 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-md text-[11px] font-black text-slate-700 dark:text-zinc-100 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none uppercase tracking-widest px-4">
                        <SelectValue placeholder="Sort Protocol" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800 bg-white">
                        <SelectItem value="name" className="text-[11px] font-bold uppercase py-2.5">Indentity (A-Z)</SelectItem>
                        <SelectItem value="newest" className="text-[11px] font-bold uppercase py-2.5">Latest Sync</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => navigate(`/dashboard/clinician/patient/${patient.id}`)}
                      className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-md p-6 hover:border-teal-400 dark:hover:border-zinc-700 hover:shadow-2xl hover:shadow-teal-600/5 transition-all group flex flex-col cursor-pointer relative overflow-hidden shadow-sm"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <Fingerprint className="w-16 h-16 text-teal-600 rotate-12" />
                      </div>

                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-14 h-14 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-md flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-lg group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-400 Transition-all duration-300 rotate-[-2deg] group-hover:rotate-0 shadow-sm">
                          {patient.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            <HighlightText text={patient.full_name} highlight={searchQuery} />
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">ID: #{patient.id.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 dark:text-teal-400 bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-md border border-slate-100 dark:border-zinc-800 mb-6 flex-1 relative z-10">
                        <Mail className="w-4 h-4 text-slate-400 dark:text-teal-600 shrink-0" />
                        <span className="text-[11px] font-bold truncate">
                          <HighlightText text={patient.email} highlight={searchQuery} />
                        </span>
                      </div>

                      <Button variant="outline" className="w-full rounded-md border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-zinc-100 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white hover:border-teal-500 dark:hover:border-teal-500 h-11 transition-all shadow-sm active:scale-95 group/btn">
                        Portfolio Access
                        <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center bg-white dark:bg-zinc-950 border-4 border-dashed border-slate-100 dark:border-zinc-800 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-50/50 dark:bg-zinc-900/5 opacity-50" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900 rounded-md mx-auto flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-zinc-800 rotate-[-4deg]">
                        <Search className="w-10 h-10 text-slate-200 dark:text-zinc-800" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Null Search Protocol</h3>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Identity registry yielded zero matches for current search parameters.</p>
                      <Button variant="ghost" className="mt-8 text-[10px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-widest hover:bg-teal-50 dark:hover:bg-teal-900 rounded-md px-6 h-10" onClick={() => setSearchQuery('')}>
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </motion.div>
    </div>
  )
}

export default ClinicianDashboard
