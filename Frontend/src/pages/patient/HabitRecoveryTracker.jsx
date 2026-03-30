import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Flame, TrendingUp, Brain, CheckCircle,
  Zap, Wind, Activity, History, Info, Loader2, Sparkles,
  Smile, ChevronRight, Clock, Calendar, X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { useHealthTrackers } from '@/hooks/useHealthTrackers'
import * as api from '@/services/api'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import NotificationBell from '@/components/NotificationBell'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { cn } from '@/lib/utils'

/* ─── Design tokens (matches PatientConsultations) ─────────────────────────── */
const ACCENTS = {
  amber: { bg: 'bg-amber-600/10', text: 'text-amber-600', border: 'border-amber-600/20', bar: 'bg-amber-600' },
  rose: { bg: 'bg-rose-600/10', text: 'text-rose-600', border: 'border-rose-600/20', bar: 'bg-rose-600' },
  emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-600', border: 'border-emerald-600/20', bar: 'bg-emerald-600' },
  indigo: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600' },
  blue: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600' },
}

/* ─── StatCard — exact pattern from Consultations ───────────────────────────── */
const StatCard = ({ title, value, subtext, icon: Icon, accent }) => {
  const t = ACCENTS[accent] || ACCENTS.amber
  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 hover:shadow-2xl hover:shadow-primary/10 hover:border-blue-600/30 transition-all duration-300 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${t.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start justify-between mb-6">
        <div className={cn('w-12 h-12 rounded-[1rem] flex items-center justify-center border transition-transform group-hover:scale-110 duration-500', t.bg, t.text, t.border)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none tabular-nums">{value}</h3>
      </div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-5 opacity-60">{title}</p>
      <div className="pt-4 border-t border-border/50">
        <p className="text-[11px] text-muted-foreground font-black flex items-center gap-2.5 uppercase tracking-widest opacity-80">
          <span className={`w-2 h-2 rounded-md ${t.bar} shadow-[0_0_8px_var(--blue-600)]`} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

/* ─── Section header — consistent with card headers ─────────────────────────── */
const CardHeader = ({ icon: Icon, label, action, accent = 'amber' }) => (
  <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-secondary/20 backdrop-blur-sm">
    <div className="flex items-center gap-2.5">
      <Icon className={`w-4 h-4 ${ACCENTS[accent]?.text || 'text-blue-600'}`} />
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">{label}</span>
    </div>
    {action}
  </div>
)

/* ─── Label ─────────────────────────────────────────────────────────────────── */
const FieldLabel = ({ children }) => (
  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2 ml-0.5">{children}</p>
)

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const HabitRecoveryTracker = () => {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const navigate = useNavigate()
  const { analytics, habitAnalytics, logHabitEntry, isLoading, refresh } = useHealthTrackers()

  const [isSaving, setIsSaving] = useState(false)
  const [isSettingBaseline, setIsSettingBaseline] = useState(false)
  const [formData, setFormData] = useState({
    tobacco_count: '', areca_count: '',
    craving_level: '3', mood_score: '5', trigger_type: 'Stress'
  })
  const [baselineData, setBaselineData] = useState({
    tobacco_baseline: '10', areca_baseline: '5'
  })

  const stats = habitAnalytics?.stats || { current_avg: 0, reduction_percent: 0 }
  const streaks = analytics?.tobacco_free || { current_streak: 0, longest_streak: 0, consistency_score: 0 }
  const dailyLogs = habitAnalytics?.daily_logs || []
  const history = habitAnalytics?.interactions || []
  const hasBaseline = habitAnalytics?.has_baseline

  const chartData = useMemo(() =>
    dailyLogs.slice(-14).map(d => ({
      date: new Date(d.log_date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      tobacco: parseInt(d.tobacco) || 0,
      areca: parseInt(d.areca) || 0,
    })),
    [dailyLogs])

  const handleLog = async () => {
    if (!formData.tobacco_count && !formData.areca_count) {
      toast.error('Please enter usage counts (even if 0)')
      return
    }
    setIsSaving(true)
    try {
      await logHabitEntry({
        tobacco_count: parseInt(formData.tobacco_count) || 0,
        areca_count: parseInt(formData.areca_count) || 0,
        craving_level: parseInt(formData.craving_level),
        mood_score: parseInt(formData.mood_score),
        trigger_type: formData.trigger_type,
      })
      setFormData({ ...formData, tobacco_count: '', areca_count: '' })
      toast.success('Recovery log saved.')
    } catch { toast.error('Failed to save log') }
    finally { setIsSaving(false) }
  }

  const handleSetBaseline = async () => {
    setIsSaving(true)
    try {
      await api.setBehaviorBaseline({
        patient_id: user.id,
        tobacco_baseline: parseInt(baselineData.tobacco_baseline) || 0,
        areca_baseline: parseInt(baselineData.areca_baseline) || 0,
      })
      toast.success('Baseline saved.')
      setIsSettingBaseline(false)
      refresh()
    } catch { toast.error('Failed to set baseline') }
    finally { setIsSaving(false) }
  }

  const now = new Date()
  const todayLog = (habitAnalytics?.daily_logs || []).find(l => {
    const lDate = new Date(l.log_date)
    return lDate.getFullYear() === now.getFullYear() &&
      lDate.getMonth() === now.getMonth() &&
      lDate.getDate() === now.getDate()
  })

  const dailyUsage = todayLog
    ? (parseInt(todayLog.tobacco || 0) + parseInt(todayLog.areca || 0))
    : (parseInt(habitAnalytics?.daily?.tobacco || 0) + parseInt(habitAnalytics?.daily?.areca || 0))

  /* ── Loading ── */
  if (isLoading && !analytics) {
    return (
      <div className="flex h-screen bg-background overflow-hidden text-foreground">
        <PatientSidebar />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col items-center justify-center gap-4`}>
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Loading clinical data…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      <PatientSidebar />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative overflow-y-auto h-screen`}>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

        {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-[100] bg-card/95 backdrop-blur-sm border-b border-border shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">

              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-foreground tracking-tighter uppercase">Habit Recovery</h1>
                  <p className="text-[10px] text-muted-foreground font-black mt-0.5 hidden sm:flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-blue-600 font-black flex items-center gap-1.5 leading-none">
                      <Activity className="w-3.5 h-3.5" /> Protocol Monitoring
                    </span>
                    <span className="text-border">·</span>
                    <span className="opacity-60">Neural Registry</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Recovery status pill */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-md animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Improving</span>
                </div>
                <NotificationBell color="amber" />
                <div
                  className="hidden sm:flex items-center gap-3 pl-1 pr-3 py-1 rounded-md border border-border bg-card/50 backdrop-blur-xl hover:border-blue-600/30 hover:bg-blue-600/5 transition-all cursor-pointer group shadow-sm"
                  onClick={() => navigate('/patient/profile')}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-amber-600/20 group-hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-black text-foreground leading-none uppercase tracking-tight">{user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-amber-600 mt-1 uppercase tracking-widest opacity-80">Patient Hub</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ CONTENT ══════════════════════════════════════════════════════ */}
        <div className="relative flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 space-y-6">

          {/* ── Baseline banner ── */}
          {!hasBaseline && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-primary/20 rounded-md p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary border border-border text-primary rounded-md flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Set your recovery baseline</p>
                  <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                    We need your average usage before the protocol to track reduction.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingBaseline(true)}
                className="px-4 h-9 rounded-md bg-amber-500 text-white text-[12px] font-bold hover:bg-amber-600 transition-all shrink-0 shadow-sm shadow-amber-500/20"
              >
                Set baseline
              </button>
            </motion.div>
          )}

          {/* ── Baseline modal ── */}
          <AnimatePresence>
            {isSettingBaseline && (
              <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setIsSettingBaseline(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-card rounded-md border border-border w-full max-w-md shadow-2xl overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
                  <div className="px-5 py-4 border-b border-border flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary border border-border text-primary rounded-md flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-foreground">Configure baseline</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Average daily usage before recovery</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSettingBaseline(false)}
                      className="w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Daily cigarettes</FieldLabel>
                        <input
                          type="number"
                          value={baselineData.tobacco_baseline}
                          onChange={e => setBaselineData({ ...baselineData, tobacco_baseline: e.target.value })}
                          className="w-full h-10 px-3.5 rounded-md text-[14px] font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10 transition-all"
                        />
                      </div>
                      <div>
                        <FieldLabel>Daily areca</FieldLabel>
                        <input
                          type="number"
                          value={baselineData.areca_baseline}
                          onChange={e => setBaselineData({ ...baselineData, areca_baseline: e.target.value })}
                          className="w-full h-10 px-3.5 rounded-md text-[14px] font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 flex gap-2.5">
                    <button
                      onClick={() => setIsSettingBaseline(false)}
                      className="flex-1 h-9 rounded-md text-[12px] font-semibold text-muted-foreground bg-secondary border border-border hover:bg-secondary/80 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSetBaseline}
                      disabled={isSaving}
                      className="flex-1 h-9 rounded-md text-[12px] font-bold text-white bg-amber-500 hover:bg-amber-600 border border-amber-400 shadow-sm shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save protocol
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── KPI Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            <StatCard title="Daily Usage" value={`${dailyUsage}`} subtext="Units in last 24h" icon={Flame} accent="rose" />
            <StatCard title="Reduction" value={`${stats.reduction_percent}%`} subtext="vs. baseline" icon={TrendingUp} accent="emerald" />
            <StatCard title="Current Streak" value={`${streaks.current_streak || 0}d`} subtext="Consecutive clean logs" icon={Zap} accent="amber" />
            <StatCard title="Consistency" value={`${streaks.consistency_score || 0}%`} subtext="Protocol adherence" icon={Brain} accent="indigo" />
          </motion.div>

          {/* Mastery highlight card — we keep amber/zinc style but update background */}
          <div className="bg-zinc-950 rounded-md border border-zinc-900 p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[5px] bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-black uppercase tracking-[0.3em] border border-amber-500/20">
                  <Flame className="w-3.5 h-3.5" /> Recovery Mastery Protocol
                </span>
                <div>
                  <h3 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-none">
                    CONSISTENCY: {streaks.consistency_score}%
                  </h3>
                  <p className="text-white/40 text-[14px] font-black uppercase tracking-widest mt-4 leading-relaxed max-w-xl">
                    YOU HAVE MAINTAINED ZERO USAGE FOR{' '}
                    <span className="text-amber-400 font-black">{streaks.current_streak} DAYS</span>.
                    YOUR ADHERENCE TO THE CLINICAL PROTOCOL IS{' '}
                    <span className="text-emerald-400 font-black">OPTIMAL</span>.
                  </p>
                </div>
                <div className="flex items-center gap-10 pt-4">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Personal Best</p>
                    <p className="text-2xl font-black tabular-nums">{streaks.longest_streak} DAYS</p>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Clinic Baseline</p>
                    <p className="text-2xl font-black text-amber-400 tabular-nums">{habitAnalytics?.baseline?.tobacco_baseline || 10} UNITS/D</p>
                  </div>
                </div>
              </div>

              {/* Progress ring */}
              <div className="shrink-0 relative w-44 h-44">
                <div className="absolute inset-0 bg-amber-500/10 blur-[50px] rounded-md animate-pulse" />
                <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                  <motion.circle
                    cx="64" cy="64" r="58" fill="none"
                    stroke="#F59E0B" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={364.4}
                    initial={{ strokeDashoffset: 364.4 }}
                    animate={{ strokeDashoffset: 364.4 - (364.4 * (streaks.consistency_score / 100)) }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-20">
                  <Flame className="w-10 h-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                  <span className="text-base font-black text-white tabular-nums">{streaks.consistency_score}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Log + chart grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* Log form */}
            <div className="xl:col-span-5">
              <div className="bg-card border border-border rounded-md overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200 relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
                <CardHeader icon={Zap} label="Log today's progress" accent="amber"
                  action={<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString([], { weekday: 'long' })}</span>}
                />

                <div className="p-6 space-y-6">
                  {/* Cigarettes + Areca */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'tobacco_count', label: 'Cigarettes', icon: Wind, accent: 'amber' },
                      { key: 'areca_count', label: 'Areca Nut', icon: Activity, accent: 'blue' },
                    ].map(({ key, label, icon: Icon, accent }) => (
                      <div key={key}>
                        <FieldLabel>{label}</FieldLabel>
                        <div className="relative group/inp">
                          <input
                            type="number"
                            value={formData[key]}
                            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                            placeholder="0"
                            className={cn(
                              'w-full h-16 px-4 pr-12 rounded-md text-3xl font-black text-foreground tabular-nums',
                              'bg-secondary border border-border',
                              'focus:outline-none transition-all',
                              accent === 'amber'
                                ? 'focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                                : 'focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                            )}
                          />
                          <div className={cn(
                            'absolute right-4 top-1/2 -translate-y-1/2 transition-colors',
                            accent === 'amber'
                              ? 'text-muted-foreground group-focus-within/inp:text-amber-500'
                              : 'text-muted-foreground group-focus-within/inp:text-blue-600'
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border/50" />

                  {/* Craving slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel>Craving intensity</FieldLabel>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md uppercase">
                        {formData.craving_level}/10
                      </span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={formData.craving_level}
                      onChange={e => setFormData({ ...formData, craving_level: e.target.value })}
                      className="w-full accent-primary h-1.5 rounded-md appearance-none cursor-pointer bg-secondary"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Stable</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Intense</span>
                    </div>
                  </div>

                  {/* Trigger + Mood */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'trigger_type', label: 'Primary trigger', options: ['Stress', 'Social', 'Routine', 'Boredom'], accent: 'amber' },
                      {
                        key: 'mood_score', label: 'Mood level', accent: 'blue',
                        options: [
                          { value: '1', label: 'Depressed' },
                          { value: '3', label: 'Anxious' },
                          { value: '5', label: 'Neutral' },
                          { value: '7', label: 'Good' },
                          { value: '10', label: 'Excellent' },
                        ]
                      },
                    ].map(({ key, label, options, accent }) => (
                      <div key={key}>
                        <FieldLabel>{label}</FieldLabel>
                        <select
                          value={formData[key]}
                          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                          className={cn(
                            'w-full h-10 px-3 rounded-md text-[12px] font-semibold text-foreground',
                            'bg-secondary border border-border',
                            'focus:outline-none transition-all',
                            accent === 'amber'
                              ? 'focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10'
                              : 'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10'
                          )}
                        >
                          {options.map(o =>
                            typeof o === 'string'
                              ? <option key={o} value={o}>{o}</option>
                              : <option key={o.value} value={o.value}>{o.label}</option>
                          )}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleLog}
                    disabled={isSaving}
                    className={cn(
                      'w-full h-14 rounded-md text-xs font-black text-white uppercase tracking-[0.25em]',
                      'bg-amber-600 hover:bg-amber-500',
                      'shadow-2xl shadow-amber-600/30',
                      'disabled:opacity-50 disabled:pointer-events-none',
                      'transition-all duration-300 active:scale-[0.97]',
                      'flex items-center justify-center gap-3'
                    )}
                  >
                    {isSaving
                      ? <><Loader2 className="w-5 h-5 animate-spin" />Syncing Registry…</>
                      : <><CheckCircle className="w-5 h-5" />Commit Recovery Log</>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Chart + timeline */}
            <div className="xl:col-span-7 space-y-5">

              {/* Bar chart */}
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-blue-600/30 transition-all duration-300 relative">
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600/80" />
                <CardHeader icon={TrendingUp} label="Clinical Usage Telemetry" accent="blue"
                  action={<span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Last 14 Nodes</span>}
                />
                <div className="p-6">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barGap={6}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false}
                          tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }} dy={12} />
                        <YAxis axisLine={false} tickLine={false}
                          tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }} />
                        <Tooltip
                          cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                          contentStyle={{
                            background: 'var(--card)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: '1.25rem',
                            border: '1px solid var(--border)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            padding: '12px 16px'
                          }}
                          itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          labelStyle={{ fontSize: '11px', fontWeight: 900, marginBottom: '8px', color: 'var(--blue-600)' }}
                        />
                        <Bar dataKey="tobacco" name="Cigarettes" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={24} />
                        <Bar dataKey="areca" name="Areca Nut" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Interaction timeline */}
              <div className="bg-card border border-border rounded-md overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200 relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-400 dark:bg-zinc-500" />
                <CardHeader icon={History} label="Interaction timeline" accent="blue"
                  action={
                    <span className="px-2 py-0.5 rounded-md bg-foreground text-background text-[9px] font-bold uppercase tracking-wider">
                      {history.length} entries
                    </span>
                  }
                />

                <div className="divide-y divide-border">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                      <div className="w-12 h-12 bg-secondary border border-border rounded-md flex items-center justify-center">
                        <History className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-foreground">No entries yet</p>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Your first log will appear here</p>
                      </div>
                    </div>
                  ) : (
                    history.slice(0, 6).map((h, i) => {
                      const hasUsage = parseInt(h.tobacco) > 0
                      return (
                        <div key={i} className="flex items-center justify-between px-5 py-3.5 group hover:bg-secondary transition-colors cursor-default relative">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-9 h-9 rounded-md flex items-center justify-center shrink-0 border',
                              hasUsage
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            )}>
                              {hasUsage ? <Zap className="w-4 h-4" /> : <Smile className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-900 leading-tight">
                                {hasUsage ? `${h.tobacco} cigarette${parseInt(h.tobacco) > 1 ? 's' : ''} logged` : 'Zero usage — clean day'}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-2">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {new Date(h.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="text-slate-300">·</span>
                                <Calendar className="w-3 h-3 text-blue-400" />
                                {new Date(h.log_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Craving</p>
                              <p className="text-[12px] font-bold text-slate-700">{h.craving_level || 3}/10</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                              {h.trigger_type || 'Stress'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HabitRecoveryTracker