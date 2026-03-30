import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  StickyNote,
  Save,
  Clock,
  ShieldAlert,
  Edit3,
  FileText,
  Loader2,
  Lock,
  CheckCircle2,
  Bell,
  Search,
  Target,
  User,
  Activity,
  Calendar,
  Zap,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getTreatmentPlan, updatePlanNotes } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import ClinicianSidebar from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import UniversalLoader from '@/components/UniversalLoader'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/* ─── Premium Analytics-style Stat Card ─────────────────────────────── */
const AnalyticStatCard = ({ title, value, subtext, icon: Icon, accent }) => {
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-zinc-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-zinc-800', bar: 'bg-teal-500' },
    amber: { bg: 'bg-amber-50 dark:bg-zinc-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-zinc-800', bar: 'bg-amber-500' },
    indigo: { bg: 'bg-indigo-50 dark:bg-zinc-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-zinc-800', bar: 'bg-indigo-500' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-md p-5 sm:p-6 hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1 truncate">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-4">{title}</p>

      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/50 text-[11px] text-slate-500 dark:text-zinc-500 font-medium truncate">
        {subtext}
      </div>
    </div>
  )
}

const MedicalNotes = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const [planData, setPlanData] = useState(null)
  const textRef = useRef(null)

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
          if (res.data.updated_at) setLastSaved(new Date(res.data.updated_at))
        }
      } catch {
        toast.error('Failed to load notes')
      } finally {
        setIsLoading(false)
      }
    }
    if (requestId) fetch()
  }, [requestId])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await updatePlanNotes({ request_id: requestId, notes })
      if (res.status === 'success') {
        toast.success('Notes archived successfully')
        setLastSaved(new Date())
      }
    } catch {
      toast.error('Sync failure: Archive interrupted')
    } finally {
      setIsSaving(false)
    }
  }, [requestId, notes])

  const handleChange = (e) => {
    setNotes(e.target.value)
    setCharCount(e.target.value.length)
  }

  if (isLoading) {
    return <UniversalLoader text="ACCESSING ENCRYPTED NOTES..." variant="dentist" />
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
        {/* ═══ HEADER (Analytics Style) ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0 relative transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-white hover:bg-teal-50 dark:hover:bg-zinc-800 transition-all active:scale-95">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Clinical Journal</h1>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-1 hidden sm:flex items-center gap-2">
                    <span className="text-teal-600 dark:text-zinc-400 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Encrypted Protocol
                    </span>
                    <span className="text-slate-300 dark:text-zinc-800">·</span>
                    <span>Patient Profile: {planData?.patient_name || 'Verified Patient'} (ID-{requestId?.slice(-6).toUpperCase()})</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden md:block w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <Input className="pl-9 h-9 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-md text-sm" placeholder="Search archive..." />
                </div>
                <button onClick={handleSave} disabled={isSaving} className="h-9 px-4 bg-teal-600 dark:bg-white dark:text-black hover:bg-teal-700 dark:hover:bg-zinc-200 text-white font-bold rounded-md shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Archive</span>
                </button>
                <Link to="/dentist/profile" className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-teal-50/30 dark:hover:bg-zinc-900/50 transition-all">
                  <div className="w-8 h-8 bg-slate-900 dark:bg-zinc-100 rounded-md flex items-center justify-center text-teal-400 dark:text-black text-xs font-bold shadow-sm">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-medium text-teal-600 dark:text-zinc-500 mt-0.5">Primary Clinician</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* KPI Stats Mapping */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <AnalyticStatCard
                title="Registry ID" value={`#${requestId?.slice(-6).toUpperCase()}`}
                subtext="Secure Protocol Reference" icon={Lock} accent="teal"
              />
              <AnalyticStatCard
                title="Last Synced" value={lastSaved ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                subtext={lastSaved ? lastSaved.toLocaleDateString() : 'Awaiting sync'} icon={Clock} accent="amber"
              />
              <AnalyticStatCard
                title="Data Density" value={`${charCount}`}
                subtext="Total Clinical Tokens" icon={FileText} accent="indigo"
              />
              <AnalyticStatCard
                title="Grade Status" value={planData?.assessment_grade || 'None'}
                subtext="Verified Diagnostic Grade" icon={Target} accent="teal"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Notebook Interface */}
              <div className="lg:col-span-8">
                <section className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm flex flex-col min-h-[500px] lg:min-h-[600px] relative transition-colors duration-300">
                  <div className="h-[3px] bg-teal-600 dark:bg-teal-500" />

                  {/* Internal Toolbar */}
                  <div className="p-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Clinical Observations</h2>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">Restricted Surgeon Notebook</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-zinc-900 border border-teal-100 dark:border-zinc-800 rounded-md">
                      <Zap className="w-3 h-3 text-teal-600 dark:text-zinc-400" />
                      <span className="text-[9px] font-black text-teal-700 dark:text-zinc-300 uppercase tracking-widest">Active Session</span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 lg:p-10 relative">
                    <textarea
                      ref={textRef}
                      value={notes}
                      onChange={handleChange}
                      placeholder="Type confidential surgical observations, patient tendencies, or dynamic clinical findings here..."
                      className="w-full h-full min-h-[400px] bg-transparent text-slate-700 dark:text-zinc-300 text-sm sm:text-base font-medium leading-relaxed placeholder:text-slate-300 dark:placeholder:text-zinc-800 outline-none resize-none relative z-10"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] dark:opacity-[0.03] pointer-events-none select-none">
                      <StickyNote className="w-64 h-64 lg:w-80 lg:h-80 text-slate-900 dark:text-white" />
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/20 relative z-10 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-md bg-teal-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Secure Handshake: Online</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-300 dark:text-zinc-800 uppercase tracking-tighter">Diagnostic Core v2.4</p>
                  </div>
                </section>
              </div>

              {/* Right Column: Clinical Governance */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-md p-6 relative overflow-hidden transition-colors duration-300">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-900 dark:bg-zinc-700" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-md bg-slate-900 dark:bg-zinc-900 flex items-center justify-center text-teal-400 dark:text-zinc-400 border dark:border-zinc-800">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Governance</h2>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Clinical Handlers</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-md transition-colors duration-300">
                      <h3 className="text-[11px] font-bold text-slate-900 dark:text-zinc-200 mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-zinc-400" /> Storage Protocol
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed italic">
                        These notes are stored separately from the patient's accessible dossier and are encrypted at rest.
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-zinc-900/40 border border-amber-100 dark:border-zinc-800 rounded-md transition-colors duration-300">
                      <h3 className="text-[11px] font-bold text-amber-900 dark:text-amber-500/80 mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <Activity className="w-3.5 h-3.5" /> Utilization
                      </h3>
                      <p className="text-[11px] text-amber-700/80 dark:text-zinc-500 leading-relaxed">
                        Intended for internal clinical governance only. Not visible to the patient during primary consultation sharing.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900 dark:bg-zinc-950 border dark:border-zinc-800 rounded-md p-6 text-white relative overflow-hidden">
                  <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-teal-500/20 dark:bg-zinc-500/10 rounded-md blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-teal-400 dark:text-zinc-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Registry Detail</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-zinc-500">Created:</span>
                        <span className="font-bold text-slate-100 dark:text-zinc-200">{planData?.created_at ? new Date(planData.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-zinc-500">Last Archival:</span>
                        <span className="font-bold text-slate-100 dark:text-zinc-200">{lastSaved ? lastSaved.toLocaleTimeString() : 'Pending'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 dark:text-zinc-500">Assigned To:</span>
                        <span className="font-bold text-slate-100 dark:text-zinc-200 truncate max-w-[120px]">Dr. {user?.full_name?.split(' ')[0]}</span>
                      </div>
                    </div>
                    <button onClick={handleSave} className="w-full mt-6 py-2.5 bg-white/10 dark:bg-white dark:text-black hover:bg-white/20 dark:hover:bg-zinc-200 border border-white/20 dark:border-transparent rounded-md text-[10px] font-bold uppercase tracking-widest transition-all">
                      Manual Sync
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  )
}

export default MedicalNotes
