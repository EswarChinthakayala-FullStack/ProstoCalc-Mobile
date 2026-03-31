import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Activity,
  ClipboardList,
  PlayCircle,
  Star,
  FileText,
  Quote,
  ArrowUpCircle,
  Stethoscope,
  Calendar,
  X,
  ArrowRight,
  Zap,
  ShieldCheck,
  Loader2,
  StickyNote,
  Bell,
  Search,
  MoreVertical,
  Target,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { useConsultationData } from '@/hooks/useConsultationData'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import NotificationBell from '@/components/NotificationBell'
import { useTheme } from '@/context/ThemeContext'

/* ─── Stage Definitions ──────────────────────────────────────────── */
const TIMELINE_STAGES = [
  { id: 'CONSULTATION_APPROVED', label: 'Consultation Approved', icon: CheckCircle2, desc: 'Initial request validated and confirmed.' },
  { id: 'DIAGNOSIS_COMPLETED', label: 'Diagnosis Completed', icon: FileText, desc: 'Clinical assessment finalized.' },
  { id: 'TREATMENT_PLANNED', label: 'Treatment Planned', icon: ClipboardList, desc: 'Procedures mapped and approved.' },
  { id: 'TREATMENT_STARTED', label: 'Treatment Started', icon: PlayCircle, desc: 'First clinical session initiated.' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: Activity, desc: 'Active procedure execution.' },
  { id: 'FOLLOW_UP', label: 'Follow Up', icon: Clock, desc: 'Post-op observation period.' },
  { id: 'COMPLETED', label: 'Completed', icon: Star, desc: 'Case successfully closed.' },
]

const TOTAL = TIMELINE_STAGES.length

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmt = (d) => {
  const dt = new Date(d)
  return {
    date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

/* ─── Animated SVG Connector ─────────────────────────────────────── */
const FlowLine = ({ progressPct }) => (
  <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-[3px] -translate-x-1/2 pointer-events-none z-0">
    <div className="absolute inset-0 rounded-md bg-slate-100 dark:bg-zinc-800/40" />
    <motion.div
      className="absolute top-0 left-0 w-full rounded-md bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
      initial={{ height: "0%" }}
      animate={{ height: `${progressPct}%` }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    />
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-md bg-white dark:bg-black border-[3px] border-blue-600 shadow-2xl shadow-blue-500/50"
      initial={{ top: "0%" }}
      animate={{ top: `${progressPct}%` }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginTop: "-8px" }}
    >
      <div className="absolute inset-x-[-10px] inset-y-[-10px] rounded-md animate-ping bg-blue-500/10" />
    </motion.div>
  </div>
)

/* ─── Single Stage Node ──────────────────────────────────────────── */
const StageNode = ({ stage, entry, isCurrent, isCompleted, isPending, index, total }) => {
  const Icon = stage.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex gap-5 sm:gap-8 group mb-8 sm:mb-10 last:mb-0"
    >
      <div className="relative z-10 flex flex-col items-center shrink-0">
        <div className={`
          w-10 h-10 sm:w-14 sm:h-14 rounded-md flex items-center justify-center transition-all duration-500 relative border-2
          ${isCompleted ? 'bg-blue-600 border-blue-500/20 text-white shadow-xl shadow-blue-500/20' : ''}
          ${isCurrent ? 'bg-foreground border-blue-600 text-background shadow-2xl shadow-foreground/20 ring-4 ring-blue-600/10' : ''}
          ${isPending ? 'bg-secondary border-border text-muted-foreground/30' : ''}
          group-hover:scale-110 duration-300
        `}>
          {isCompleted && !isCurrent ? (
            <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />
          ) : (
            <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
          )}

          {isCurrent && (
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-md border-2 border-white animate-pulse shadow-sm" />
          )}
        </div>
      </div>

      <div className={`
        flex-1 rounded-md p-6 sm:p-9 border transition-all duration-500 relative overflow-hidden group/card backdrop-blur-sm
        ${isPending ? 'bg-slate-50/10 dark:bg-zinc-900/10 border-slate-100 dark:border-zinc-800/30 opacity-40' : 'bg-white/80 dark:bg-zinc-950/80 shadow-md hover:shadow-2xl hover:border-blue-500/40'}
        ${isCurrent ? 'border-blue-600/40 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20' : 'border-slate-100 dark:border-zinc-800/50'}
      `}>
        {/* Accent Bar */}
        <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${isCurrent ? 'bg-blue-600' : isCompleted ? 'bg-blue-500' : 'bg-muted group-hover/card:bg-muted-foreground/20'
          }`} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-lg font-black tracking-tight ${isPending ? 'text-muted-foreground/40' : 'text-foreground'} group-hover/card:text-blue-500 transition-colors uppercase`}>
              {stage.label}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-md ${isCompleted ? 'bg-blue-500' : 'bg-blue-600'} animate-pulse`} />
              Clinical Milestone Node
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCurrent && (
              <span className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-md uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 animate-pulse-subtle">
                <Zap className="w-3 h-3" /> Active Phase
              </span>
            )}
            {isCompleted && !isCurrent && (
              <span className="px-3 py-1.5 bg-blue-600/10 text-blue-500 text-[10px] font-black rounded-md uppercase tracking-widest flex items-center gap-2 border border-blue-600/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Sync Finalized
              </span>
            )}
          </div>
        </div>

        <p className={`text-xs sm:text-[15px] font-medium leading-relaxed ${isPending ? 'text-muted-foreground/30' : 'text-muted-foreground'}`}>
          {stage.desc}
        </p>

        <AnimatePresence>
          {(isCompleted || isCurrent) && entry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-6 border-t border-slate-100 space-y-5"
            >
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {(() => {
                  const f = fmt(entry.updated_at || entry.created_at); return (
                    <>
                      <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] bg-secondary/50 px-3 py-2 rounded-md border border-border">
                        <Calendar className="w-3 h-3 text-blue-500" /> {f.date}
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] bg-secondary/50 px-3 py-2 rounded-md border border-border">
                        <Clock className="w-3 h-3 text-blue-500" /> {f.time}
                      </div>
                    </>
                  )
                })()}
              </div>

              {entry.notes && (
                <div className="bg-secondary/40 border border-border rounded-md p-5 relative group/notes overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-2xl rounded-md -mr-12 -mt-12" />
                  <Quote className="absolute top-4 right-5 w-8 h-8 text-muted-foreground/10 group-hover/notes:text-blue-500/10 transition-colors" />
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNote className="w-3.5 h-3.5 text-blue-500" />
                    <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Physician Telemetry</p>
                  </div>
                  <p className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-relaxed relative z-10 italic">"{entry.notes}"</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}


/* ─── MAIN COMPONENT ───────────────────────────────────────────────── */
const PatientClinicalTimeline = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { timeline, isLoading, refresh } = useConsultationData(requestId)
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme } = useTheme()







  const currentStatusId = useMemo(() => {
    if (!timeline?.length) return TIMELINE_STAGES[0].id
    return timeline[timeline.length - 1].status
  }, [timeline])

  const currentIndex = useMemo(
    () => TIMELINE_STAGES.findIndex((s) => s.id === currentStatusId),
    [currentStatusId],
  )

  const progressPct = useMemo(() => {
    if (currentIndex <= 0) return 3 // minimum height for first stage
    return Math.min((currentIndex / (TOTAL - 1)) * 100, 100)
  }, [currentIndex])

  const currentLabel = TIMELINE_STAGES[currentIndex]?.label ?? currentStatusId





  if (isLoading) {
    return (
      <div className="h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-md animate-spin border-t-blue-600" />
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Authenticating Node</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Bridging Clinical Network...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden text-slate-900 dark:text-white">
      <PatientSidebar />
      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden"
      >
        {/* ═══ HEADER ═══ */}
        <header className="z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              {/* Left: Branding */}
              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <button
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 bg-secondary border border-border rounded-md flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-600/10 transition-all active:scale-95 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-none truncate uppercase">Timeline</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none">Diagnostic ID-{requestId}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5">Progress</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-24 h-1.5 bg-secondary rounded-md overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600 rounded-md shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-foreground tabular-nums">{Math.round(progressPct)}%</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-border mx-2 hidden sm:block" />
                <NotificationBell color="blue" />
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT (Scrollable) ═══ */}
        <div className="flex-1 overflow-y-auto relative overflow-hidden bg-white dark:bg-black">
          <div className="absolute inset-0 opacity-100 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181b' : '#e2e8f0'} 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />
          <main className="max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row overflow-hidden pb-10 relative z-10">

            {/* Timeline Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 lg:py-16 custom-scrollbar">
              <div className="max-w-3xl mx-auto relative pt-4">
                <FlowLine progressPct={progressPct} />
                <div className="relative z-10 space-y-0 items-start">
                  {TIMELINE_STAGES.map((stage, i) => {
                    const entry = [...timeline].reverse().find((t) => t.status === stage.id)
                    const done = i < currentIndex
                    const active = i === currentIndex
                    const pending = i > currentIndex

                    return (
                      <StageNode
                        key={stage.id}
                        stage={stage}
                        entry={entry}
                        isCompleted={done || active}
                        isCurrent={active}
                        isPending={pending}
                        index={i}
                        total={TOTAL}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Intelligence Panel (Sticky/Aside) */}
            <aside className="hidden xl:flex w-[400px] border-l border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 p-10 flex-col shrink-0 overflow-y-auto shadow-2xl">
              <div className="space-y-10">
                <div className="p-10 bg-slate-900 dark:bg-zinc-900 rounded-md text-white relative overflow-hidden shadow-2xl group border border-slate-800 dark:border-zinc-800">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-3xl rounded-md -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Diagnostic Pulse</p>
                  <h2 className="text-2xl font-black tracking-tight leading-tight mb-8 uppercase italic">In {currentLabel}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-white/10 dark:bg-black/20 rounded-md overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[12px] font-black tabular-nums tracking-tighter">{Math.round(progressPct)}%</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-md bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Clinical Roadmap</h3>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/50 rounded-md p-9 space-y-7 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-md -mr-16 -mb-16" />
                    <p className="text-[13px] font-bold text-slate-500 dark:text-zinc-400 leading-relaxed relative z-10">
                      Track your clinical journey in real-time. Each milestone represents a key phase in your treatment protocol as synchronized by your clinician. Each transition is cryptographically logged with a timestamp for patient audit integrity.
                    </p>
                    <div className="pt-7 border-t border-slate-200 dark:border-zinc-800/80 relative z-10">
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                        <span>Diagnostic Unit</span>
                        <span className="text-slate-900 dark:text-white font-black">{user?.id ? String(user.id).slice(0, 8) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </motion.div>
    </div>
  )
}

export default PatientClinicalTimeline
