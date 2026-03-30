import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Clock,
  ShieldAlert,
  FileText,
  Loader2,
  Lock,
  Calendar,
  Zap,
  ShieldCheck,
  Stethoscope,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react'
import { toast } from 'sonner'
import { getTreatmentPlan } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'

import { Badge } from "@/components/ui/badge"

/* ─── Premium Clinical Stat Card ─────────────────────────────────────── */
const StatCard = ({ title, value, subtext, icon: Icon, accent }) => {
  const accents = {
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-600/20 dark:border-zinc-800/50', bar: 'bg-blue-600' },
  }
  const t = accents.blue

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-100 dark:border-zinc-800/50 rounded-md p-6 hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-600/30 transition-all duration-300 group relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${t.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border shadow-inner`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 group-hover:text-blue-600 transition-colors uppercase tabular-nums">{value}</h3>
      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em] mb-4 opacity-70">{title}</p>

      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-black flex items-center gap-2 uppercase tracking-widest opacity-80">
          <span className={`w-2 h-2 rounded-md ${t.bar} shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse`} />
          {subtext}
        </p>
      </div>
    </motion.div>
  )
}

const PatientMedicalNotes = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [charCount, setCharCount] = useState(0)
  const [planData, setPlanData] = useState(null)
  const [isReading, setIsReading] = useState(false)

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const toggleSpeech = () => {
    if (isReading) {
      window.speechSynthesis.cancel()
      setIsReading(false)
      return
    }

    if (!notes) {
      toast.error('Nothing to read')
      return
    }

    const utterance = new SpeechSynthesisUtterance(notes)

    // Attempt to set a professional sounding voice if available
    const voices = window.speechSynthesis.getVoices()
    const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Google US English'))
    if (maleVoice) utterance.voice = maleVoice

    utterance.rate = 0.95 // Slightly slower for clinical clarity
    utterance.pitch = 1

    utterance.onstart = () => setIsReading(true)
    utterance.onend = () => setIsReading(false)
    utterance.onerror = () => {
      setIsReading(false)
      toast.error('Narration failed')
    }

    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true)
        const res = await getTreatmentPlan({ request_id: requestId })
        if (res.status === 'success' && res.data) {
          setPlanData(res.data)
          const n = res.data.clinical_notes || ''
          setNotes(n)
          setCharCount(n.length)
        }
      } catch {
        toast.error('Failed to load clinician notes')
      } finally {
        setIsLoading(false)
      }
    }
    if (requestId) fetch()
  }, [requestId])

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-md animate-pulse" />
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
        </div>
        <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] animate-pulse">Syncing Clinical Registry...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden transition-colors duration-500 text-slate-900 dark:text-white">
      <PatientSidebar />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative h-screen overflow-hidden`}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-100 shadow-inner"
          style={{ backgroundImage: `radial-gradient(var(--border) 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />
        {/* ═══ HEADER ═══ */}
        <header className="z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
            <div className="h-16 sm:h-20 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6 min-w-0">
                <PatientSidebarTrigger />
                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 bg-secondary/50 border border-border rounded-md flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-600/30 transition-all active:scale-95 group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter leading-none uppercase truncate">Clinical <span className="text-blue-600">Journal</span></h1>
                  <div className="text-[10px] text-muted-foreground font-black mt-1.5 hidden lg:flex items-center gap-3 uppercase tracking-widest opacity-60">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Verified by Dr. {planData?.dentist_name?.split(' ')[0] || 'Clinician'}
                    <span className="w-1 h-1 rounded-md bg-border" />
                    Registry ID: {String(requestId || '').slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div className="px-3.5 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-md flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline text-[9px] font-black text-blue-600 uppercase tracking-widest">Registry Locked</span>
                </div>

                <div
                  className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-blue-600/30 hover:bg-blue-600/10 transition-all cursor-pointer group shadow-sm"
                  onClick={() => navigate('/patient/profile')}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">{user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-widest opacity-80">Patient</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {/* Theme-aware grid background decorative element */}
          <div className="absolute inset-0 bg-[grid_var(--border)_24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8 relative z-10">

            {/* KPI Stats Mapping */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Source Entity" value={`DR. ${planData?.dentist_name?.split(' ')[0] || 'CLINICIAN'}`}
                subtext="Primary Surgical Lead" icon={Stethoscope} accent="blue"
              />
              <StatCard
                title="Registry Grade" value={planData?.assessment_grade || 'VERIFIED'}
                subtext="Clinical Accuracy" icon={ShieldAlert} accent="amber"
              />
              <StatCard
                title="Clinical Tokens" value={`${charCount}`}
                subtext="Detailed Observations" icon={FileText} accent="indigo"
              />
              <StatCard
                title="Case State" value={planData?.status || 'FINALIZED'}
                subtext="Latest Protocol Active" icon={Zap} accent="emerald"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Notebook Interface */}
              <div className="lg:col-span-8">
                <section className="bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-100 dark:border-zinc-800/50 rounded-md overflow-hidden shadow-2xl flex flex-col min-h-[500px] lg:min-h-[700px] relative group/note">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] opacity-80 group-hover/note:opacity-100 transition-opacity" />

                  {/* Internal Toolbar */}
                  <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-zinc-800/50 bg-blue-600/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                        <FileText className="w-7 h-7 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">Medical Observations Log</h2>
                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em] mt-1.5 opacity-60 truncate">Doctor: {planData?.dentist_name?.split(' ')[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={toggleSpeech}
                        className={`h-12 px-6 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] rounded-md shadow-xl transition-all active:scale-95 shrink-0 ${isReading
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-card border border-border text-blue-600 hover:bg-blue-600/10'
                          }`}
                      >
                        {isReading ? <VolumeX className="w-4 h-4 shadow-[0_0_10px_rgba(255,255,255,0.4)]" /> : <Volume2 className="w-4 h-4" />}
                        {isReading ? 'STOP NARRATION' : 'READ NARRATED'}
                      </button>
                      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600/10 border border-emerald-600/20 rounded-md text-emerald-600 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">VALIDATED</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-8 lg:p-14 relative overflow-hidden group">
                    {/* Surgical Crosshair Décor */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-border/40 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-border/40 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-border/40 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-border/40 rounded-br-xl" />

                    <textarea
                      readOnly
                      value={notes || 'SYCHRONIZING CLINICAL DATA... NO OBSERVATIONS RECORDED AT THIS TIME.'}
                      className="w-full h-full min-h-[450px] bg-transparent text-foreground text-sm sm:text-lg font-black leading-[2] placeholder:text-muted-foreground/10 outline-none resize-none cursor-default selection:bg-blue-600/20 uppercase tracking-tight"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                      <Stethoscope className="w-64 h-64 lg:w-[480px] lg:h-[480px] text-blue-900 animate-pulse duration-10000" />
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 dark:border-zinc-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/30 relative z-10 transition-colors duration-300">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-md bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest opacity-60">System Integrity Secure</span>
                      </div>
                      <span className="w-1 h-1 rounded-md bg-slate-200 dark:bg-zinc-800" />
                      <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest opacity-60">Registry v4.2.1</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500/30 uppercase tracking-[0.2em] hidden sm:block">Analytical Clinical Log • Protected</p>
                  </div>
                </section>
              </div>

              {/* Right Column: Guidance */}
              <div className="lg:col-span-4 space-y-8">
                <section className="bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-100 dark:border-zinc-800/50 rounded-md p-8 relative overflow-hidden shadow-2xl group/guide">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] opacity-80 group-hover/guide:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Info className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Clinical Clarity</h2>
                      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] opacity-60">Understanding Observations</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/50 rounded-md transition-all hover:border-blue-600/20 group">
                      <h3 className="text-[11px] font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2.5 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                        <Stethoscope className="w-4 h-4" /> Professional Log
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed italic opacity-80">
                        These notes are shared by your clinician to provide clarity on your surgical protocol and diagnostic recovery findings.
                      </p>
                    </div>

                    <div className="p-6 bg-blue-600/5 border border-blue-600/20 rounded-md transition-all hover:bg-blue-600/10 hover:border-blue-600/30">
                      <h3 className="text-[11px] font-black text-blue-600 mb-3 flex items-center gap-2.5 uppercase tracking-widest">
                        <Lock className="w-4 h-4" /> Finalized Document
                      </h3>
                      <p className="text-[11px] text-blue-600/70 leading-relaxed font-black uppercase tracking-tight">
                        TO MAINTAIN CLINICAL INTEGRITY, SHARED NOTES ARE IN READ-ONLY MODE AND CANNOT BE MODIFIED ONCE SYNCHRONIZED.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900 rounded-md border border-slate-800 p-10 text-white relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-md -mr-32 -mt-32 blur-[100px] group-hover:bg-blue-600/20 transition-all duration-700" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Archival Registry</span>
                      </div>
                      <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">V4.0</Badge>
                    </div>

                    <div className="space-y-4 mb-10">
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Clinician</span>
                        <span className="text-xs font-black truncate max-w-[140px] uppercase tracking-tight">Dr. {planData?.dentist_name?.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Shared Date</span>
                        <span className="text-xs font-black uppercase tracking-tight">{planData?.updated_at ? new Date(planData.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol Code</span>
                        <span className="text-xs font-black uppercase tracking-tight">#{String(requestId || '').slice(-6).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/10 w-full text-center">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Registry State</p>
                      <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-md group-hover:bg-blue-600/20 group-hover:border-blue-600/30 transition-all shadow-inner">
                        <div className="w-2 h-2 rounded-md bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)] animate-pulse" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-shadow-glow-blue">Verified Finalized Report</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PatientMedicalNotes
