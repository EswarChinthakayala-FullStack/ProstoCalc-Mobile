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
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateTimeline } from '@/services/api'
import { useConsultationData } from '@/hooks/useConsultationData'
import ClinicianSidebar from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAuth } from '@/context/AuthContext'
import UniversalLoader from '@/components/UniversalLoader'
import { Input } from '@/components/ui/input'

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
  <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-[4px] -translate-x-1/2 pointer-events-none z-0">
    <div className="absolute inset-0 rounded-md bg-slate-100 dark:bg-zinc-900" />
    <motion.div
      className="absolute top-0 left-0 w-full rounded-md bg-gradient-to-b from-teal-600 via-teal-400 to-emerald-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
      initial={{ height: '0%' }}
      animate={{ height: `${progressPct}%` }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    />
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-md bg-white border-[3px] border-teal-500 shadow-lg shadow-teal-500/40"
      initial={{ top: '0%' }}
      animate={{ top: `${progressPct}%` }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginTop: '-7px' }}
    >
      <div className="absolute inset-0 rounded-md animate-ping bg-teal-400/30" />
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
      className="relative flex gap-5 sm:gap-6 group mb-6 sm:mb-8 last:mb-0"
    >
      <div className="relative z-10 flex flex-col items-center shrink-0">
        <div className={`
          w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center transition-all duration-500 relative
          ${isCompleted ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : ''}
          ${isCurrent ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-black shadow-xl shadow-slate-900/40 dark:shadow-black/60 ring-4 ring-teal-500/10' : ''}
          ${isPending ? 'bg-white dark:bg-zinc-900 text-slate-300 dark:text-zinc-700 border border-slate-200 dark:border-zinc-800' : ''}
        `}>
          {isCompleted && !isCurrent ? (
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          )}

          {isCurrent && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-md border-2 border-white animate-pulse" />
          )}
        </div>
      </div>

      <div className={`
        flex-1 rounded-md p-5 sm:p-6 border transition-all duration-300 relative overflow-hidden
        ${isPending ? 'bg-slate-50/50 dark:bg-zinc-900/20 border-slate-100 dark:border-zinc-800/50 opacity-60' : 'bg-white dark:bg-zinc-950 shadow-sm'}
        ${isCurrent ? 'border-teal-400/30' : 'border-slate-200/60 dark:border-zinc-800/60'}
      `}>
        {isCurrent && <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600" />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-[13px] sm:text-base font-black tracking-tight ${isPending ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-900 dark:text-white'}`}>
              {stage.label}
            </h3>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Phased Clinical Objective
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCurrent && (
              <span className="px-2.5 py-1 bg-teal-600 text-white text-[9px] font-black rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-teal-600/10">
                <Zap className="w-2.5 h-2.5" /> Active Node
              </span>
            )}
            {isCompleted && !isCurrent && (
              <span className="px-2.5 py-1 bg-teal-50 dark:bg-zinc-900 text-teal-600 dark:text-teal-400 text-[9px] font-black rounded-md uppercase tracking-widest flex items-center gap-1.5 border border-teal-100 dark:border-zinc-800">
                <ShieldCheck className="w-2.5 h-2.5" /> Synchronized
              </span>
            )}
          </div>
        </div>

        <p className={`text-[11px] sm:text-sm font-medium leading-relaxed ${isPending ? 'text-slate-300' : 'text-slate-500'}`}>
          {stage.desc}
        </p>

        <AnimatePresence>
          {(isCompleted || isCurrent) && entry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 pt-5 border-t border-slate-50 dark:border-zinc-900 space-y-4"
            >
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {(() => {
                  const f = fmt(entry.updated_at || entry.created_at); return (
                    <>
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5" /> {f.date}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" /> {f.time}
                      </div>
                    </>
                  )
                })()}
              </div>

              {entry.notes && (
                <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-md p-4 relative">
                  <Quote className="absolute top-3 right-4 w-6 h-6 text-slate-200 dark:text-zinc-800" />
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.15em] mb-2">Physician Telemetry</p>
                  <p className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-zinc-300 leading-relaxed">"{entry.notes}"</p>
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
const ClinicalTimeline = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { timeline, isLoading, refresh } = useConsultationData(requestId)
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const [showPicker, setShowPicker] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const pickStage = useCallback((stage) => {
    setSelected(stage)
    setShowPicker(false)
    setNote('')
    setTimeout(() => setShowNote(true), 120)
  }, [])

  const confirmUpdate = useCallback(async () => {
    if (!selected) return
    try {
      setSubmitting(true)
      const res = await updateTimeline({ request_id: requestId, status: selected.id, notes: note })
      if (res.status === 'success') {
        toast.success('Clinical milestone reached')
        setShowNote(false)
        setSelected(null)
        refresh()
      } else {
        toast.error(res.message || 'Synchronization disruption')
      }
    } catch {
      toast.error('Network logic error')
    } finally {
      setSubmitting(false)
    }
  }, [selected, requestId, note, refresh])

  if (isLoading) {
    return <UniversalLoader text="SYNCING TIMELINE..." variant="dentist" />
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black font-sans overflow-hidden transition-colors duration-500">
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden"
      >
        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0 relative transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              {/* Left: Branding */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-zinc-700 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">Clinical Timeline</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest leading-none">ID-{requestId}</span>
                    <div className="w-1 h-1 rounded-md bg-emerald-500 animate-pulse hidden sm:block" />
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-slate-100 dark:border-zinc-800">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Global Progress</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-zinc-900 rounded-md overflow-hidden">
                        <motion.div
                          className="h-full bg-teal-600 rounded-md"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-zinc-100">{Math.round(progressPct)}%</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPicker(true)}
                  className="bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest h-9 sm:h-10 px-3 sm:px-6 rounded-md shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20 gap-2 transition-all active:scale-95 shrink-0"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden xs:inline">Advance Stage</span>
                  <span className="xs:hidden">Advance</span>
                </Button>

                <Link to="/dentist/profile" className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 hover:border-teal-200 dark:hover:border-teal-400 transition-all shrink-0 hidden md:flex">
                  <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-medium text-teal-600 mt-0.5">Verifier</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row overflow-hidden">

          {/* Timeline Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 lg:py-12 custom-scrollbar">
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
          <aside className="hidden xl:flex w-[400px] border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-10 flex-col shrink-0 overflow-y-auto relative transition-colors duration-300">
            <div className="space-y-10">
              <div className="p-8 bg-slate-900 dark:bg-zinc-950 rounded-md text-white relative overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/60 border border-transparent dark:border-zinc-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-3xl rounded-md -mr-16 -mt-16" />
                <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-4">Current Pulse</p>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-4">{currentLabel}</h2>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/10 dark:bg-zinc-900 rounded-md overflow-hidden">
                    <motion.div
                      className="h-full bg-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-black tabular-nums">{Math.round(progressPct)}%</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-teal-600" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Active Verification</h3>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800 rounded-md p-6 space-y-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 leading-relaxed">
                    Please verify all diagnostic telemetries before advancing to the next clinical phase. Each transition is cryptographically logged with a timestamp for patient audit integrity.
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                      <span>Verifier ID</span>
                      <span className="text-slate-900 dark:text-zinc-100">{user?.id ? String(user.id).slice(0, 8) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </motion.div>

      {/* ═══ STAGE PICKER ═══ */}
      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPicker(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-md shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-transparent dark:border-zinc-800"
            >
              <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight">Advance Milestone</h3>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Select Clinical Stage</p>
                </div>
                <button onClick={() => setShowPicker(false)} className="w-10 h-10 bg-slate-50 dark:bg-zinc-900 rounded-md flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:bg-zinc-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-3 custom-scrollbar">
                {TIMELINE_STAGES.filter(s => s.id !== currentStatusId).map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => pickStage(stage)}
                    className="w-full p-5 bg-slate-50 dark:bg-zinc-900/50 hover:bg-teal-50 dark:hover:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-md flex items-center gap-4 transition-all group group-active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-md shadow-sm flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:text-teal-600 transition-colors">
                      <stage.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-zinc-100 leading-none">{stage.label}</p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1 line-clamp-1">{stage.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ NOTE EDITOR ═══ */}
      <AnimatePresence>
        {showNote && selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNote(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-md shadow-2xl relative z-10 overflow-hidden p-10 font-sans border border-transparent dark:border-zinc-800"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-md flex items-center justify-center shadow-xl shadow-teal-600/20">
                  <selected.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{selected.label}</h3>
                  <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-2 px-2 py-0.5 bg-teal-50 dark:bg-zinc-900 rounded-md inline-block">Milestone Entry</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] ml-2">Clinical Observations</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-32 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-md p-6 text-sm font-bold text-slate-800 dark:text-zinc-100 placeholder:text-slate-200 dark:placeholder:text-zinc-800 focus:ring-4 focus:ring-teal-500/5 focus:bg-white dark:focus:bg-zinc-900 focus:border-teal-300 transition-all outline-none resize-none"
                  placeholder="Record physiological metrics or observations..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="ghost" onClick={() => setShowNote(false)} className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 dark:text-zinc-600 hover:text-slate-600">Abort</Button>
                <Button
                  onClick={confirmUpdate}
                  disabled={submitting}
                  className="h-14 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-black uppercase text-[10px] tracking-widest rounded-md shadow-xl shadow-slate-900/10 dark:shadow-teal-900/30"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Synchronization'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ClinicalTimeline
