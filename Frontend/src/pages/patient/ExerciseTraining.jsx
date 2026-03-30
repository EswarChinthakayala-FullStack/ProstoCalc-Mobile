import React, { useState, useEffect, useMemo } from 'react'
import {
  Dumbbell, Play, Timer, Award, ChevronRight, Zap, Info,
  ShieldCheck, ArrowLeft, X, CheckCircle2, RotateCcw, Activity, Pause
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useNavigate } from 'react-router-dom'
import NotificationBell from '@/components/NotificationBell'
import { useAuth } from '@/context/AuthContext'
import { useHealthTrackers } from '@/hooks/useHealthTrackers'
import { cn } from '@/lib/utils'

/* ─── Icon registry ─────────────────────────────────────────────────────────── */
const ICON_MAP = {
  Zap: Zap, Dumbbell: Dumbbell,
  ShieldCheck: ShieldCheck, Timer: Timer, Award: Award,
}

/* ─── Color config ──────────────────────────────────────────────────────────── */
const COLOR = {
  blue: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600', ring: 'text-blue-600' },
  indigo: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600', ring: 'text-blue-600' },
  cyan: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600', ring: 'text-blue-600' },
}

/* ─── Exercise card ─────────────────────────────────────────────────────────── */
const ExerciseCard = ({ exercise, onClick, progress = 0 }) => {
  const { title, level, duration_minutes, icon_name, color_theme } = exercise
  const Icon = ICON_MAP[icon_name] || Zap
  const c = COLOR[color_theme] || COLOR.blue

  return (
    <div
      onClick={onClick}
      className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-5.5 flex items-center justify-between group cursor-pointer hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-600/30 transition-all duration-300 relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${c.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className={cn('w-12 h-12 rounded-[1rem] flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110 duration-500', c.bg, c.border)}>
          <Icon className={cn('w-6 h-6', c.text)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className={cn('text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-[0.2em] border', c.bg, c.text, c.border)}>
              {level}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Timer className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{duration_minutes} min</span>
            </div>
          </div>
          <h3 className="text-sm font-black text-foreground tracking-tight group-hover:text-blue-600 transition-colors truncate uppercase">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {progress > 0 && (
          <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-blue-600/5 rounded-md border border-blue-600/10">
            <p className="text-[8px] font-black text-blue-600/60 uppercase tracking-[0.2em]">Telemetry</p>
            <p className="text-sm font-black text-blue-600 tabular-nums">{progress}×</p>
          </div>
        )}
        <div className="w-11 h-11 bg-secondary border border-border rounded-md flex items-center justify-center text-muted-foreground group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 group-hover:shadow-lg group-hover:shadow-blue-600/20 transition-all active:scale-90">
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const ExerciseTraining = () => {
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { exercises, exerciseProgress, exerciseSettings, logExercise, isLoading } = useHealthTrackers()

  const [activeExercise, setActiveExercise] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const dailyLogs = useMemo(() => exerciseProgress?.daily_logs || [], [exerciseProgress])
  const totalMinutesToday = exerciseProgress?.total_minutes_today ?? dailyLogs.reduce((sum, l) => sum + (parseInt(l.duration_performed || l.duration) || 0), 0)
  const goalMinutes = exerciseSettings?.daily_goal_minutes || 15
  const goalProgress = Math.min(100, Math.round((totalMinutesToday / goalMinutes) * 100))

  const sessionInfo = useMemo(() => {
    if (!exerciseSettings) return null
    const hour = new Date().getHours()
    const mHour = parseInt((exerciseSettings.morning_time || '09:00:00').split(':')[0])
    const eHour = parseInt((exerciseSettings.evening_time || '20:00:00').split(':')[0])
    const mTime = exerciseSettings.morning_time || '09:00'
    const eTime = exerciseSettings.evening_time || '20:00'
    if (hour < mHour) return { label: 'Upcoming: Morning', time: mTime, active: false }
    if (hour >= mHour && hour < 12) return { label: 'Active: Morning', time: mTime, active: true }
    if (hour >= 12 && hour < eHour) return { label: 'Upcoming: Evening', time: eTime, active: false }
    if (hour >= eHour && hour < 23) return { label: 'Active: Evening', time: eTime, active: true }
    return { label: 'Session ends', time: 'Tomorrow', active: false }
  }, [exerciseSettings])

  useEffect(() => {
    let iv = null
    if (isTimerActive && timeLeft > 0) {
      iv = setInterval(() => setTimeLeft(p => p - 1), 1000)
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false)
      handleComplete()
    }
    return () => clearInterval(iv)
  }, [isTimerActive, timeLeft])

  const startExercise = (ex) => {
    setActiveExercise(ex)
    setTimeLeft((ex.duration_minutes || ex.time) * 60)
    setIsTimerActive(true)
    setIsDone(false)
  }

  const handleComplete = async () => {
    setIsDone(true)
    try {
      await logExercise({
        exercise_id: activeExercise.id,
        duration: activeExercise.duration_minutes || activeExercise.time,
        reps: null,
        status: 'completed'
      })
    } catch (e) { console.error('Failed to log exercise', e) }
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const activeColor = COLOR[activeExercise?.color_theme] || COLOR.blue
  const ActiveIcon = ICON_MAP[activeExercise?.icon_name] || Zap
  const totalSecs = (activeExercise?.duration_minutes || activeExercise?.time || 1) * 60
  const circumference = 2 * Math.PI * 60

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      <PatientSidebar />

      <main className={cn(
        'flex-1 flex flex-col min-w-0 relative h-screen transition-all duration-300',
        isDesktop ? (isCollapsed ? 'ml-[100px]' : 'ml-[300px]') : 'ml-0'
      )}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(var(--border) 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

        {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
        <header className="z-40 bg-card/95 backdrop-blur-sm border-b border-border shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-foreground tracking-tighter uppercase">Therapy Training</h1>
                  <p className="text-[10px] text-muted-foreground font-black mt-0.5 hidden sm:flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-blue-600 font-black flex items-center gap-1.5 leading-none">
                      <Activity className="w-3.5 h-3.5" /> Oral Rehabilitation
                    </span>
                    <span className="text-border">·</span>
                    <span className="opacity-60">Neural Protocol</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell color="blue" />
                <div
                  className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-md border border-border bg-card/50 backdrop-blur-xl hover:border-blue-600/30 hover:bg-blue-600/5 transition-all cursor-pointer shadow-sm group"
                  onClick={() => navigate('/patient/profile')}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-black text-foreground leading-none uppercase tracking-tight">{user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-blue-600 mt-1 uppercase tracking-widest opacity-80">Syncing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 space-y-6">

            {/* ── Goal card ── */}
            <div className="bg-zinc-950 rounded-md border border-zinc-900 p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 border border-white/15 rounded-md flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] opacity-80">
                        Protocol Compliance
                      </p>
                      {sessionInfo && (
                        <span className={cn(
                          'px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border',
                          sessionInfo.active
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-white/40 border-white/10'
                        )}>
                          {sessionInfo.label} · {sessionInfo.time}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase">
                      {goalMinutes}-Minute Protocol
                    </h2>
                  </div>
                </div>

                {/* Progress */}
                <div className="sm:text-right space-y-3">
                  <p className="text-[11px] font-black text-white/50 uppercase tracking-widest">
                    {totalMinutesToday}/{goalMinutes} MIN PERFORMED
                  </p>
                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="flex-1 sm:w-40 h-2 bg-white/10 rounded-md overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goalProgress}%` }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-blue-600 rounded-md shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                      />
                    </div>
                    <span className="text-sm font-black text-blue-400 tabular-nums">{goalProgress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section header ── */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">
                Therapy Protocol Nodes
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                <RotateCcw className="w-3 h-3" /> Live Registry
              </div>
            </div>

            {/* ── Exercise list ── */}
            {exercises.length === 0 && !isLoading ? (
              <div className="bg-card border border-dashed border-border rounded-md p-10 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 bg-secondary border border-border rounded-md flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-[12px] font-bold text-muted-foreground">No exercises assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map(ex => {
                  const count = dailyLogs.filter(l => (l.exercise_id || l.id) === ex.id).length
                  return (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      progress={count}
                      onClick={() => startExercise(ex)}
                    />
                  )
                })}
              </div>
            )}

            {/* ── Safety warning ── */}
            <div className="flex items-start gap-5 p-6 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-md relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-amber-600" />
              <div className="w-10 h-10 bg-amber-600/10 border border-amber-600/20 rounded-md flex items-center justify-center shrink-0 shadow-inner">
                <Info className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-[0.2em] mb-1.5 leading-none">
                  Surgical Threshold Warning
                </h3>
                <p className="text-[12px] text-amber-800 dark:text-amber-200/70 font-black uppercase tracking-tight leading-relaxed opacity-80">
                  STOP IMMEDIATELY IF ACUTE PAIN EXCEEDS 4/10. SYSTEM TELEMETRY WILL AUTO-DISPATCH STRESS LOGS TO CLINIC IF THRESHOLDS ARE BREACHED.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ═══ TRAINING MODAL ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeExercise && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isTimerActive && setActiveExercise(null)}
              className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-card/95 backdrop-blur-3xl rounded-md border border-border shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Top bar */}
              <div className={`h-[5px] w-full ${activeColor.bar} shadow-[0_0_20px_var(--blue-600)]`} />

              {/* Modal header */}
              <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-md flex items-center justify-center border shadow-inner', activeColor.bg, activeColor.border)}>
                    <ActiveIcon className={cn('w-6 h-6', activeColor.text)} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground leading-tight uppercase tracking-tighter">{activeExercise.title}</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5 leading-none opacity-80">
                      {activeExercise.level} · {activeExercise.duration_minutes || activeExercise.time} MIN
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveExercise(null)}
                  className="w-10 h-10 rounded-md bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white hover:border-red-600 transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {!isDone ? (
                  <div className="space-y-6">

                    {/* Timer ring */}
                    <div className="flex justify-center py-4">
                      <div className="relative w-52 h-52">
                        <div className="absolute inset-0 bg-blue-600/5 blur-[40px] rounded-md animate-pulse" />
                        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 136 136">
                          <circle cx="68" cy="68" r="62" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
                          <motion.circle
                            cx="68" cy="68" r="62" fill="none"
                            stroke="currentColor" strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset: circumference * (1 - timeLeft / totalSecs) }}
                            className={activeColor.ring}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                          <span className="text-5xl font-black text-foreground font-mono leading-none tracking-tighter tabular-nums">
                            {formatTime(timeLeft)}
                          </span>
                          <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.3em] mt-3 leading-none">
                            Diagnostic Time
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setIsTimerActive(p => !p)}
                        className={cn(
                          'w-full h-14 rounded-md text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-[0.97]',
                          isTimerActive
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                        )}
                      >
                        {isTimerActive
                          ? <><Pause className="w-5 h-5 fill-current" /> Pause Session</>
                          : <><Play className="w-5 h-5 fill-current ml-0.5" /> Resume Protocol</>
                        }
                      </button>
                      <button
                        onClick={handleComplete}
                        className="w-full h-10 rounded-md text-[10px] font-black text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest"
                      >
                        Abort to Registry
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Completion state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-6"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-md" />
                      <div className="relative w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-foreground tracking-tighter uppercase mb-2">Protocol Verified</h4>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed max-w-[280px] mb-8 opacity-70">
                      Your clinical rehabilitation data has been deep-synced with the clinic hub.
                    </p>

                    {/* Summary strip */}
                    <div className="w-full grid grid-cols-2 gap-4 mb-8">
                      {[
                        { label: 'Telemetery', value: `${activeExercise.duration_minutes || activeExercise.time} MIN` },
                        { label: 'Complexity', value: activeExercise.level },
                      ].map(s => (
                        <div key={s.label} className="bg-secondary border border-border rounded-md p-4 text-center shadow-inner">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 opacity-60">{s.label}</p>
                          <p className="text-base font-black text-foreground uppercase tracking-tight tabular-nums">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 w-full">
                      <button
                        onClick={() => startExercise(activeExercise)}
                        className="flex-1 h-12 rounded-md border border-border bg-secondary text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all flex items-center justify-center gap-2.5 active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" /> Repeat
                      </button>
                      <button
                        onClick={() => setActiveExercise(null)}
                        className="flex-1 h-12 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                      >
                        Commit Logs
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExerciseTraining