import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Calendar, ClipboardList, History,
  ShieldCheck, ChevronRight, CalendarDays, Stethoscope,
  Clock, ArrowUpRight, MessageSquare, Flame, Zap, Brain,
  CheckCircle, Sun, Moon
} from 'lucide-react'
import { toast } from 'sonner'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import NotificationBell from '@/components/NotificationBell'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import UniversalLoader from '@/components/UniversalLoader'
import { useSidebar } from '@/context/SidebarContext'
import { useHealthTrackers } from '@/hooks/useHealthTrackers'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

/* ─── StatCard ───────────────────────────────────────────────────────────────── */
const StatCard = ({ title, value, subtext, icon: Icon, accent, onClick }) => {
  const A = {
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-600/20 dark:border-zinc-800/50', bar: 'bg-blue-600', glow: 'shadow-blue-500/5 dark:shadow-blue-900/10' },
  }
  const t = A.blue
  return (
    <div onClick={onClick} className={cn(
      'bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-100 dark:border-zinc-800/50 rounded-md p-5 sm:p-7 relative overflow-hidden transition-all duration-300 group',
      t.glow, 'hover:shadow-2xl hover:shadow-blue-600/10 hover:-translate-y-1 hover:border-blue-600/30',
      onClick && 'cursor-pointer'
    )}>
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${t.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start justify-between mb-5">
        <div className={`w-12 h-12 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1.5 tabular-nums">{value}</h3>
      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em] mb-5">{title}</p>
      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-black flex items-center justify-between uppercase tracking-widest">
          <span className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-md ${t.bar} animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]`} />{subtext}
          </span>
          {onClick && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 group-hover:translate-x-1 transition-transform" />}
        </p>
      </div>
    </div>
  )
}

/* ─── Card header ────────────────────────────────────────────────────────────── */
const CardHeader = ({ icon: Icon, label, action, accent = 'blue' }) => {
  const C = { blue: 'text-blue-500', indigo: 'text-indigo-500', amber: 'text-amber-500', slate: 'text-slate-400' }
  return (
    <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/30">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
          <Icon className={`w-3.5 h-3.5 ${C[accent] || C.blue}`} />
        </div>
        <span className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-[0.25em]">{label}</span>
      </div>
      {action}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════════ */
const PatientDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const { habitAnalytics, exerciseProgress, exerciseSettings, isLoading: trackersLoading } = useHealthTrackers()
  const { theme, toggleTheme } = useTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [medicalData, setMedicalData] = useState({
    appointments: [], streak: null, activePlan: null,
    careTeam: [], medications: [], habitStats: null,
    summary: { total_requests: 0, active_plans: 0, upcoming_appointments: 0, care_team_count: 0 },
    chartData: []
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const apptRes = await api.get(`/get_consultation_requests?role=PATIENT&id=${user.id}`)
        const allReqs = apptRes.data?.data || []
        const upcoming = allReqs.filter(r => r.status === 'APPROVED' || r.status === 'PENDING')
        const streakRes = await api.get(`/web/get_streak_analytics?patient_id=${user.id}`)
        const streakData = streakRes.data?.data || {}
        const medRes = await api.get(`/web/get_medications?patient_id=${user.id}`)
        const meds = medRes.data?.data || []

        const activePlans = allReqs.filter(r => r.status === 'APPROVED' || r.status === 'IN_PROGRESS').length
        const upcomingCount = upcoming.filter(r => r.status === 'APPROVED' && r.scheduled_date && new Date(r.scheduled_date) >= new Date().setHours(0, 0, 0, 0)).length
        const careSet = new Set(); allReqs.forEach(r => r.dentist_id && careSet.add(r.dentist_id))

        let activePlan = null
        if (allReqs.length > 0) {
          const latest = allReqs.find(r => r.status === 'APPROVED' || r.status === 'IN_PROGRESS') || allReqs[0]
          const planRes = await api.get(`/web/get_treatment_plan?request_id=${latest.id}`)
          if (planRes.data?.status === 'success') activePlan = planRes.data.data
        }

        const seen = new Set()
        const dentists = []
        allReqs.forEach(r => {
          if (r.dentist_id && !seen.has(r.dentist_id)) {
            seen.add(r.dentist_id)
            dentists.push({ id: r.dentist_id, name: r.dentist_name, clinic: r.clinic_name })
          }
        })

        setMedicalData({
          summary: { total_requests: allReqs.length, active_plans: activePlans, upcoming_appointments: upcomingCount, care_team_count: careSet.size },
          appointments: upcoming,
          streak: streakData,
          activePlan,
          careTeam: dentists,
          medications: meds.slice(0, 3),
          habitStats: streakData,
          chartData: [
            { name: 'Req', value: allReqs.length },
            { name: 'Apr', value: allReqs.filter(r => r.status === 'APPROVED').length },
            { name: 'Pen', value: allReqs.filter(r => r.status === 'PENDING').length },
            { name: 'Com', value: allReqs.filter(r => r.status === 'COMPLETED').length },
          ]
        })
      } catch (err) {
        console.error(err); toast.error('Failed to load dashboard')
      } finally { setIsLoading(false) }
    }
    if (user?.id) fetchData()
  }, [user?.id])

  const getProgress = () => {
    // 1. Calculate Daily Compliance (0-100)
    let dailyCompliance = 0
    let complianceFactors = 0

    if (exerciseSettings) {
      const goal = exerciseSettings.daily_goal_minutes || 15
      const current = exerciseProgress?.total_minutes_today || 0
      dailyCompliance += Math.min(100, (current / goal) * 100)
      complianceFactors++
    }

    if (medicalData.medications && medicalData.medications.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const total = medicalData.medications.length
      const taken = medicalData.medications.filter(m => 
        m.logs?.some(l => l.log_date === today && l.status === 'taken')
      ).length
      dailyCompliance += (taken / total) * 100
      complianceFactors++
    }

    const avgCompliance = complianceFactors > 0 ? dailyCompliance / complianceFactors : 100

    // 2. Base Stage Progress
    const s = medicalData.activePlan?.visit_status
    let baseProgress = 15
    if (s === 'visited' || s === 'COMPLETED') baseProgress = 100
    else if (s === 'in_progress') baseProgress = 65
    else if (s === 'arrived') baseProgress = 35
    else if (medicalData.activePlan) baseProgress = 20

    // 3. Overall Progress (Weighted: Stage is 80%, Daily is 20%)
    // This prevents the 0% drop when factors exist but aren't logged yet today
    if (complianceFactors > 0) {
      // If stage is 100%, we still show near-100% but weighted by compliance
      return Math.round((baseProgress * 0.8) + (avgCompliance * 0.2))
    }

    return baseProgress
  }

  if (isLoading || trackersLoading) return <UniversalLoader text="Loading dashboard…" />

  const progress = getProgress()

  return (
    <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden transition-colors duration-500 text-slate-900 dark:text-white">
      <PatientSidebar />

      <main className={cn(
        'flex-1 transition-all duration-300',
        isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]',
        'flex flex-col h-screen relative z-10 min-w-0 overflow-hidden'
      )}>
        {/* Dot grid */}
      
        {/* ══ HEADER ════════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">Dashboard</h1>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 hidden sm:flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                      <img src="/logo.svg" alt="" className="w-3 h-3 object-contain" /> Patient Portal
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span>{new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-md animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Systems optimal</span>
                </div>
                <NotificationBell color="blue" />
                <div
                  onClick={() => navigate('/patient/profile')}
                  className="hidden sm:flex items-center gap-3 pl-1 pr-3 py-1 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-blue-600/30 hover:bg-blue-600/10 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">{user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-widest opacity-80">Unit-X01</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ══ CONTENT ═══════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 space-y-6">

            {/* KPI */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
            >
              <StatCard title="Consultations" value={medicalData.summary.total_requests} subtext="Total clinical requests" icon={MessageSquare} accent="blue" onClick={() => navigate('/patient/consultations')} />
              <StatCard title="Active protocols" value={medicalData.summary.active_plans} subtext="Live treatment plans" icon={ClipboardList} accent="blue" onClick={() => navigate('/patient/journey')} />
              <StatCard title="Upcoming visits" value={medicalData.summary.upcoming_appointments} subtext="Scheduled clinic visits" icon={Calendar} accent="blue" onClick={() => navigate('/patient/radar')} />
              <StatCard title="Care team" value={medicalData.summary.care_team_count} subtext="Verified clinical experts" icon={ShieldCheck} accent="blue" />
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

              {/* ── LEFT (8 cols) ── */}
              <div className="xl:col-span-8 space-y-5">

                {/* Progress card */}
                <div className="bg-slate-900 dark:bg-zinc-950 rounded-md border border-slate-800 dark:border-zinc-800 p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-md -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="flex-1 space-y-5">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 text-[9px] font-bold uppercase tracking-[0.15em] border border-blue-500/20 mb-3">
                          <Activity className="w-3 h-3" />
                          {medicalData.activePlan?.visit_status?.toLowerCase() || 'Diagnostic phase'}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">Treatment progress</h2>
                        <p className="text-[13px] text-slate-400 font-medium mt-2 leading-relaxed max-w-lg">
                          Your therapeutic progress is{' '}
                          <span className="text-blue-400 font-bold">{progress}% complete</span>.
                          {' '}Continue protocol adherence to reach full{' '}
                          <span className="text-emerald-400 font-bold">recovery</span>.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                          <span>Started</span><span>{progress}%</span><span>Complete</span>
                        </div>
                        <div className="h-2 w-full bg-white/[0.06] rounded-md overflow-hidden border border-white/[0.04]">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.4, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400 rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 bg-white/[0.05] border border-white/10 rounded-md p-5 text-center min-w-[130px] space-y-5">
                      {(() => {
                        const stats = medicalData.habitStats || {}
                        const bestStreakKey = Object.keys(stats).sort((a, b) => 
                          (stats[b]?.consistency_score || 0) - (stats[a]?.consistency_score || 0)
                        )[0] || 'tobacco_free'
                        
                        const activeStreak = stats[bestStreakKey] || { consistency_score: 0, current_streak: 0 }
                        const label = bestStreakKey.replace(/_/g, ' ').toUpperCase()

                        return (
                          <>
                            <div>
                              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.15em] mb-1">{label} Consistency</p>
                              <p className="text-2xl font-extrabold">{activeStreak.consistency_score || 0}%</p>
                            </div>
                            <div className="w-full h-px bg-white/10" />
                            <div>
                              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-[0.15em] mb-1">Streak</p>
                              <div className="flex items-center justify-center gap-1.5">
                                <Flame className="w-4 h-4 text-amber-500" />
                                <p className="text-xl font-extrabold">{activeStreak.current_streak || 0}d</p>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Status Visualization Chart */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md p-6 hover:shadow-2xl hover:border-blue-600/20 transition-all duration-500 relative overflow-hidden h-[240px] group">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)] opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <img src="/logo.svg" alt="" className="w-3.5 h-3.5 object-contain" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Consultation radar</span>
                    </div>
                    <div className="flex gap-3">
                      {['Req', 'Apr', 'Pen', 'Com'].map((tag, i) => (
                        <div key={tag} className="flex items-center gap-1">
                          <div className={cn("w-1.5 h-1.5 rounded-md", ["bg-blue-400", "bg-emerald-400", "bg-amber-400", "bg-slate-400"][i])} />
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={medicalData.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}
                          itemStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorVal)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Appointments */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md overflow-hidden hover:shadow-2xl hover:border-blue-600/20 transition-all duration-500 relative">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)] opacity-80" />
                  <CardHeader
                    icon={CalendarDays} label="Upcoming appointments" accent="blue"
                    action={
                      <button
                        onClick={() => navigate('/patient/radar')}
                        className="h-7 px-3 rounded-md bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
                      >
                        Schedule
                      </button>
                    }
                  />

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {medicalData.appointments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white">No upcoming visits</p>
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">Schedule a consultation to get started</p>
                        </div>
                      </div>
                    ) : (
                      medicalData.appointments.map((app, i) => (
                        <motion.div
                          key={app.id || i}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          onClick={() => navigate('/patient/journey')}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group/app relative"
                        >
                          <div className={cn('absolute left-0 top-0 bottom-0 w-0.5', app.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500')} />
                          <div className="flex items-center gap-4 pl-3">
                            <div className="text-center min-w-[48px] py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md shrink-0">
                              <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                                {app.scheduled_date ? new Date(app.scheduled_date).getDate() : '--'}
                              </p>
                              <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase mt-0.5 tracking-wider">
                                {app.scheduled_date ? new Date(app.scheduled_date).toLocaleString('en-US', { month: 'short' }) : '---'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[13px] font-bold text-slate-900 dark:text-slate-200 group-hover/app:text-blue-600 dark:group-hover/app:text-blue-400 transition-colors leading-tight">
                                {app.request_type || 'Clinical Assessment'}
                              </p>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                  <Clock className="w-3 h-3 text-blue-400" />{app.scheduled_time || 'Unscheduled'}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                  <Stethoscope className="w-3 h-3 text-indigo-400" />Dr. {app.dentist_name || 'Assigning…'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:justify-end pl-3 sm:pl-0">
                            <div className="text-right">
                              <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border',
                                app.status === 'APPROVED'
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                                  : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                              )}>
                                {app.status}
                              </span>
                              <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-1">{app.clinic_name || 'Central Clinic'}</p>
                            </div>
                            <div className="w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover/app:bg-blue-600 group-hover/app:text-white group-hover/app:border-blue-600 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                    <button onClick={() => navigate('/patient/journey')}
                      className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-wider transition-colors flex items-center gap-1.5">
                      View full history <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── RIGHT (4 cols) ── */}
              <div className="xl:col-span-4 space-y-5">

                {/* Medications */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md overflow-hidden hover:shadow-2xl hover:border-blue-600/20 transition-all duration-500 relative">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)] opacity-80" />
                  <CardHeader icon={History} label="Medication log" accent="indigo" />
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {medicalData.medications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-center px-5">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md flex items-center justify-center">
                          <History className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">No active prescriptions</p>
                      </div>
                    ) : (
                      medicalData.medications.map((med, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/med">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400 rounded-md flex items-center justify-center shrink-0">
                              <Zap className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold text-slate-900 dark:text-slate-200 leading-tight">{med.name}</p>
                              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{med.dosage} · {med.scheduled_time}</p>
                            </div>
                          </div>
                          <CheckCircle className={cn(
                            "w-4 h-4 transition-colors",
                            med.logs?.some(l => l.log_date === new Date().toISOString().split('T')[0] && l.status === 'taken')
                              ? "text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                              : "text-slate-200 dark:text-slate-700"
                          )} />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                    <button onClick={() => navigate('/patient/medication')}
                      className="w-full h-9 rounded-md text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
                      Manage medication log
                    </button>
                  </div>
                </div>

                {/* Care team */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md overflow-hidden hover:shadow-2xl hover:border-blue-600/20 transition-all duration-500 relative">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)] opacity-80" />
                  <CardHeader icon={ShieldCheck} label="Clinical team" accent="blue" />
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {medicalData.careTeam.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Team assignment pending</p>
                      </div>
                    ) : (
                      medicalData.careTeam.map((dentist, i) => (
                        <div key={dentist.id || i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/team">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 shrink-0">
                              <div className="w-9 h-9 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 text-[12px] font-extrabold shadow-inner">
                                {dentist.name?.charAt(0)}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-md" />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold text-slate-900 dark:text-slate-200 leading-tight">Dr. {dentist.name}</p>
                              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">Surgeon · {dentist.clinic}</p>
                            </div>
                          </div>
                          <button className="w-7 h-7 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-100 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                    {/* AI row */}
                    <div className="flex items-center gap-3 px-5 py-3.5 opacity-50">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-md flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">AI</div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-900 dark:text-slate-200">Neural assistant</p>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Protocol monitor</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                    <button onClick={() => navigate('/patient/ai-chat')}
                      className="w-full h-9 rounded-md text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all">
                      Open AI chat
                    </button>
                  </div>
                </div>

                {/* Therapy promo */}
                <div className="bg-slate-900 rounded-md border border-slate-800 p-8 text-white relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                  <div className="relative z-10 space-y-3">
                    <div className="w-8 h-8 bg-indigo-500/15 border border-indigo-500/20 rounded-md flex items-center justify-center">
                      <Brain className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold tracking-tight">Therapy AI</h4>
                      <p className="text-[12px] text-slate-400 font-medium leading-relaxed mt-1">
                        Guided neuromuscular exercises with real-time biometric feedback.
                      </p>
                    </div>
                    <button onClick={() => navigate('/patient/therapy')}
                      className="flex items-center gap-1.5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider hover:text-indigo-300 transition-all group/btn">
                      Start program <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PatientDashboard