import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ArrowUpRight,
  BrainCircuit,
  FileText,
  History,
  IndianRupee,
  Sparkles,
  Search,
  X,
  Calendar,
  User,
  TrendingUp,
  Hash,
  Activity,
  ShieldCheck,
  MoreVertical,
  Layers,
  Archive,
  Target,
  Zap,
  Lock,
  Loader2,
  ClipboardCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import api from '@/services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import NotificationBell from '@/components/NotificationBell'
import { toast } from 'sonner'
import { useDentistProfile } from '@/hooks/useDentistProfile'

/* ─── Premium Analytics-style Stat Card ─────────────────────────────── */
const AnalyticStatCard = ({ title, value, subtext, icon: Icon, accent, isCurrency = false }) => {
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-zinc-900/40', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-zinc-800', bar: 'bg-teal-500' },
    amber: { bg: 'bg-amber-50 dark:bg-zinc-900/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-zinc-800', bar: 'bg-amber-500' },
    indigo: { bg: 'bg-indigo-50 dark:bg-zinc-900/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-zinc-800', bar: 'bg-indigo-500' },
    blue: { bg: 'bg-blue-50 dark:bg-zinc-900/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-zinc-800', bar: 'bg-blue-500' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md p-5 sm:p-6 hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        {isCurrency && <span className="text-sm font-black text-slate-400 dark:text-zinc-600">₹</span>}
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">{value}</h3>
      </div>
      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-4">{title}</p>

      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/50 text-[11px] text-slate-500 dark:text-zinc-500 font-medium truncate flex items-center gap-2">
        <div className={`w-1 h-1 rounded-md ${t.bar}`} />
        {subtext}
      </div>
    </div>
  )
}

// ─── Detail Record Content (shared between Sheet & inline) ───
const RecordDetail = ({ log, onClose }) => {
  if (!log) return null
  return (
    <div className="flex flex-col h-full bg-white dark:bg-black font-sans">
      {/* Premium Header */}
      <div className="bg-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-teal-500/20 rounded-md blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-indigo-500/10 rounded-md blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500">Registry Detail</p>
                <p className="text-xs font-bold text-slate-400 tracking-wider">PRS-{log.id.toString().padStart(8, '0').toUpperCase()}</p>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1">Estimated Value</p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none">
                <span className="text-sm font-bold text-teal-500 mr-1">₹</span>
                {parseFloat(log.total_estimated_cost).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1">Logged At</p>
              <p className="text-xs font-bold text-slate-300">
                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Patient Profile Section */}
        <section>
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 p-4 rounded-md">
            <div className="w-12 h-12 bg-white dark:bg-zinc-950 rounded-md flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-lg shadow-sm border border-slate-200 dark:border-zinc-800">
              {log.patient_name?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{log.patient_name || 'Quick Assessment'}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Primary Consultation</p>
            </div>
          </div>
        </section>

        {/* Procedures Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-md bg-teal-500" />
              Procedures breakdown
            </h4>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 py-0.5 bg-slate-50 dark:bg-zinc-900 rounded-md border border-slate-100 dark:border-zinc-800">
              {log.items?.length || 0} Items
            </span>
          </div>
          <div className="space-y-2">
            {log.items?.length > 0 ? (
              log.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group p-3.5 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md hover:border-teal-200 dark:hover:border-teal-400 hover:shadow-sm transition-all">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-700 dark:text-zinc-300 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors uppercase tracking-tight">{item.treatment_name}</p>
                    <p className="text-[9px] font-medium text-slate-400 dark:text-zinc-600 mt-0.5">Clinical Standard v2.0</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">₹{parseFloat(item.subtotal).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center bg-slate-50 dark:bg-zinc-900/30 border border-dashed border-slate-200 dark:border-zinc-800 rounded-md">
                <History className="w-6 h-6 text-slate-200 dark:text-zinc-800 mx-auto mb-2" />
                <p className="text-[10px] font-black text-slate-300 dark:text-zinc-700 uppercase tracking-widest">No Line Item Details</p>
              </div>
            )}
          </div>
        </section>

        {/* AI Analysis */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-zinc-800">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Diagnostic Justification</h4>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 p-6 rounded-md relative overflow-hidden group transition-colors">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500/20" />
            <div className="relative z-10 text-[13px] font-medium text-slate-600 dark:text-zinc-400 leading-relaxed prose prose-sm prose-teal dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(log.explanations?.[0]?.explanation_text || log.explanations?.[0]?.explanation || "System unable to retrieve dynamic AI justification for this archive.")
                  .replace(/```markdown/g, '').replace(/```/g, '').trim()}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}

const ClinicalRegistry = () => {
  const { user } = useAuth()
  const { settings } = useDentistProfile(user?.id)
  const isCalcOnly = settings?.consultation_mode === 'CALCULATION_ONLY'
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const [aiLogs, setAiLogs] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState(isCalcOnly ? 'calculator' : 'all')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        const res = await api.get(`/get_ai_cost_logs?dentist_id=${user.id}`)
        if (res.data?.status === 'success') {
          setAiLogs(res.data.data || [])
        }
      } catch (error) {
        console.error("Clinical fetching failure:", error)
      } finally {
        setIsLoading(false)
      }
    }
    if (user?.id) fetchLogs()
  }, [user?.id])

  const filteredLogs = useMemo(() => {
    return aiLogs.filter(log => {
      const matchesSearch = !searchQuery ||
        (log.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id.toString().includes(searchQuery)

      if (isCalcOnly) {
        return matchesSearch && log.mode === 'calculator'
      }

      const matchesFilter = filterMode === 'all' || log.mode === filterMode
      return matchesSearch && matchesFilter
    })
  }, [aiLogs, searchQuery, filterMode, isCalcOnly])

  const stats = useMemo(() => {
    const total = filteredLogs.reduce((sum, log) => sum + (parseFloat(log.total_estimated_cost) || 0), 0)
    const plansCount = aiLogs.filter(l => l.mode === 'approved').length
    const estimatesCount = aiLogs.filter(l => l.mode === 'calculator').length
    return { total, plansCount, estimatesCount }
  }, [aiLogs, filteredLogs])

  const handleSelectLog = (log) => {
    setSelectedLog(log)
    if (window.innerWidth < 1280) {
      setSheetOpen(true)
    }
  }

  const handleCloseSheet = () => {
    setSheetOpen(false)
    setTimeout(() => setSelectedLog(null), 300)
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
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden"
      >
        {/* PREMIUM HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0 transition-colors">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <button onClick={() => navigate('/dashboard/clinician')} className="hidden xl:flex w-9 h-9 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-zinc-800 transition-all active:scale-95">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                    {isCalcOnly ? "Estimation Registry" : "Clinical Registry"}
                  </h1>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-1 hidden sm:flex items-center gap-2">
                    <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {isCalcOnly ? "Private Assessments" : "Secure Archives"}
                    </span>
                    <span className="text-slate-300 dark:text-zinc-800">·</span>
                    <span>{isCalcOnly ? "Calculation Logs" : "Diagnostic Logs"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden md:block w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-600" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-md text-sm dark:text-white"
                    placeholder={isCalcOnly ? "Filter estimations..." : "Search archives..."}
                  />
                </div>
                <NotificationBell />
                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
                <Link to="/dentist/profile" className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 hover:border-teal-200 dark:hover:border-teal-400 transition-all shadow-sm">
                  <div className="w-8 h-8 bg-slate-900 dark:bg-zinc-100 rounded-md flex items-center justify-center text-teal-400 dark:text-black text-xs font-bold shadow-sm">
                    {user?.full_name?.charAt(0)}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 custom-scrollbar transition-colors">
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* KPI STATS */}
            <div className={`grid grid-cols-2 ${isCalcOnly ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4 sm:gap-6`}>
              <AnalyticStatCard
                title="Total Records" value={filteredLogs.length}
                subtext={isCalcOnly ? "Assessment Logs" : "Historical Archives"} icon={Hash} accent="teal"
              />
              <AnalyticStatCard
                title="Portfolio Value" value={stats.total.toLocaleString()}
                subtext="Cumulative Valuation" icon={IndianRupee} accent="amber" isCurrency={true}
              />
              {!isCalcOnly && (
                <>
                  <AnalyticStatCard
                    title="Verified Plans" value={stats.plansCount}
                    subtext="Approved Treatment Phases" icon={Target} accent="indigo"
                  />
                  <AnalyticStatCard
                    title="Quick Assessments" value={stats.estimatesCount}
                    subtext="Diagnostic Estimations" icon={Zap} accent="blue"
                  />
                </>
              )}
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              {/* LIST PANEL */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* Mobile Search/Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {!isCalcOnly && (
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                      {[
                        { id: 'all', label: 'All Records', icon: Activity },
                        { id: 'approved', label: 'Proposals', icon: FileText },
                        { id: 'calculator', label: 'Estimates', icon: IndianRupee },
                        { id: 'quick', label: 'Rapid', icon: Zap },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilterMode(f.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filterMode === f.id
                            ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-black border-slate-900 dark:border-zinc-100 shadow-md translate-y-[-1px]'
                            : 'bg-white dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400'
                            }`}
                        >
                          <f.icon className="w-3.5 h-3.5" />
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={isCalcOnly ? "w-full" : "md:hidden"}>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isCalcOnly ? "Search estimation logs..." : "Search archives..."}
                      className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-md text-sm dark:text-white"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-teal-600 dark:text-teal-400 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Accessing Secure Registry...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="py-24 text-center bg-white dark:bg-zinc-950/20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-md">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-md flex items-center justify-center mx-auto mb-6">
                      <History className="w-8 h-8 text-slate-200 dark:text-zinc-800" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 uppercase italic">No Archives Synchronized</h3>
                    <p className="text-sm text-slate-400 dark:text-zinc-500 max-w-xs mx-auto font-medium">Try refining your search parameters or generate new diagnostic assessments.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredLogs.map((log, idx) => {
                      const isActive = selectedLog?.id === log.id
                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSelectLog(log)}
                          className={`group p-5 rounded-md border cursor-pointer transition-all duration-300 relative overflow-hidden ${isActive
                            ? 'bg-[#134e4a] border-teal-800 text-white shadow-2xl shadow-teal-900/40 ring-2 ring-teal-500/20'
                            : 'bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-900 hover:border-teal-200 dark:hover:border-teal-400 hover:shadow-xl hover:translate-y-[-4px]'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md ${isActive ? 'bg-white/10 text-teal-300' : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-zinc-800'
                              }`}>
                              {log.mode || 'Registry'}
                            </div>
                            <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-teal-400' : 'text-slate-300 dark:text-zinc-700'}`}>
                              #{log.id.toString().padStart(4, '0')}
                            </span>
                          </div>

                          <h3 className={`text-base font-black tracking-tight mb-1 truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                            {isCalcOnly ? "Estimation Assessment" : (log.patient_name || 'Anonymous Assessment')}
                          </h3>
                          <p className={`text-[11px] font-bold uppercase tracking-wider mb-6 ${isActive ? 'text-teal-300/60' : 'text-slate-400 dark:text-zinc-500'}`}>
                            {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>

                          <div className="flex items-end justify-between relative z-10">
                            <div>
                              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-teal-400' : 'text-slate-300 dark:text-zinc-600'}`}>Diagnostic Value</p>
                              <p className="text-xl font-black tabular-nums tracking-tighter">
                                <span className="text-xs font-bold mr-1 italic">₹</span>
                                {parseFloat(log.total_estimated_cost).toLocaleString()}
                              </p>
                            </div>
                            <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${isActive ? 'bg-white/10 text-white' : 'bg-slate-50 dark:bg-zinc-900 text-slate-300 dark:text-zinc-700 group-hover:bg-teal-600 group-hover:text-white group-hover:rotate-12'
                              }`}>
                              {log.mode === 'approved' ? <ClipboardCheck className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                          </div>

                          {isActive && (
                            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-md blur-2xl pointer-events-none" />
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* DESKTOP DETAIL PANEL */}
              <div className="w-[440px] shrink-0 hidden xl:block">
                <div className="sticky top-[100px] h-[calc(100vh-140px)]">
                  <AnimatePresence mode="wait">
                    {selectedLog ? (
                      <motion.div
                        key={selectedLog.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="h-full rounded-md border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden bg-white dark:bg-black"
                      >
                        <RecordDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
                      </motion.div>
                    ) : (
                      <div className="h-full rounded-md border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 flex flex-col items-center justify-center p-12 text-center group">
                        <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-md flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                          <Archive className="w-10 h-10 text-slate-200 dark:text-zinc-800" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 italic">Select Archive</h4>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-relaxed">Choose a diagnostic record from the registry to bridge detailed clinical data.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>
        </main>
      </motion.div>

      {/* MOBILE SHEET */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) handleCloseSheet() }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-[460px] sm:max-w-full p-0 border-0 bg-white dark:bg-black overflow-hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Registry Node PRS-{selectedLog?.id}</SheetTitle>
            <SheetDescription>High-fidelity diagnostic record detail view.</SheetDescription>
          </SheetHeader>
          <RecordDetail log={selectedLog} onClose={handleCloseSheet} />
        </SheetContent>
      </Sheet>

    </div>
  )
}

export default ClinicalRegistry
