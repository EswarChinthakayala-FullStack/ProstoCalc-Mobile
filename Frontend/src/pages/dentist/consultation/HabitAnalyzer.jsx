import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Activity,
  Brain,
  Flame,
  Stethoscope,
  AlertTriangle,
  ChevronRight,
  Info,
  History as HistoryIcon,
  Wind,
  Droplets,
  Zap,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Target,
  MoreVertical,
  Bell,
  Search,
  Scale,
  Loader2,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { analyzeHabitRisk, getHabitRiskHistory, getTreatmentPlan, explainCostPuter } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import ClinicianSidebar from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import UniversalLoader from '@/components/UniversalLoader'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ─── Premium Analytics-style Stat Card ─────────────────────────────── */
const AnalyticStatCard = ({ title, value, subtext, icon: Icon, accent, trend }) => {
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-zinc-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-zinc-800', bar: 'bg-teal-500' },
    amber: { bg: 'bg-amber-50 dark:bg-zinc-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-zinc-800', bar: 'bg-amber-500' },
    rose: { bg: 'bg-rose-50 dark:bg-zinc-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-zinc-800', bar: 'bg-rose-500' },
    indigo: { bg: 'bg-indigo-50 dark:bg-zinc-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-zinc-800', bar: 'bg-indigo-500' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className="bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-md p-5 sm:p-6 hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-0.5 rounded-md border ${trend > 0 ? 'border-emerald-100' : 'border-rose-100'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-4">{title}</p>

      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/50 text-[11px] text-slate-500 dark:text-zinc-500 font-medium truncate">
        {subtext}
      </div>
    </div>
  )
}

const HabitAnalyzer = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const [formData, setFormData] = useState({
    tobacco_per_day: 0,
    tobacco_years: 0,
    areca_per_day: 0,
    areca_years: 0,
    alcohol: false,
    mouth_opening_mm: 36,
    current_grade: 'Grade I'
  })

  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [planData, setPlanData] = useState(null)

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [aiExplanation, setAiExplanation] = useState(null)
  const [isAiExplaining, setIsAiExplaining] = useState(false)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        const planRes = await getTreatmentPlan({ request_id: requestId })
        if (planRes.status === 'success' && planRes.data) {
          setPlanData(planRes.data)
          if (planRes.data.patient_id) {
            const histRes = await getHabitRiskHistory(planRes.data.patient_id, planRes.data.dentist_id)
            if (histRes.status === 'success') setHistory(histRes.data)
          }
        }
      } catch (e) {
        console.error("Fetch error", e)
      } finally {
        setIsLoading(false)
      }
    }
    if (requestId) fetchInitialData()
  }, [requestId])

  const handleAnalyze = async () => {
    if (!planData?.patient_id) return toast.error("Patient context not found")
    setIsAnalyzing(true)
    setAiExplanation(null)
    try {
      const res = await analyzeHabitRisk({
        ...formData,
        request_id: requestId,
        patient_id: planData.patient_id,
        dentist_id: planData.dentist_id || user.id
      })
      if (res.status === 'success') {
        setResults(res.data)
        toast.success("Risk computation complete")
        const histRes = await getHabitRiskHistory(planData.patient_id, planData.dentist_id || user.id)
        if (histRes.status === 'success') setHistory(histRes.data)
      }
    } catch {
      toast.error("Network disruption")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExplainAI = async () => {
    if (!results) return;
    setIsAiExplaining(true);
    setAiExplanation(null);
    try {
      const prompt = `Clinician context: Tobacco (${formData.tobacco_per_day}x, ${formData.tobacco_years}y), Areca (${formData.areca_per_day}x, ${formData.areca_years}y). Multiplier: ${results.calculated_risk_multiplier || results.risk_multiplier}x. Explain the clinical significance in 2 sentences. Professional only.`;
      const res = await explainCostPuter(prompt);
      if (res.status === 'success' && res.data?.explanation) {
        setAiExplanation(res.data.explanation.content || res.data.explanation);
        toast.success("AI Insight Logged");
      }
    } catch {
      toast.error("AI service failure")
    } finally {
      setIsAiExplaining(false)
    }
  }

  if (isLoading) {
    return <UniversalLoader text="SYNCING DIAGNOSTIC CORE..." variant="dentist" />
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
                <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Habit Analysis</h1>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-1 hidden sm:flex items-center gap-2">
                    <span className="text-teal-600 dark:text-teal-500 font-semibold flex items-center gap-1">
                      <Target className="w-3 h-3" /> OSMF Risk
                    </span>
                    <span className="text-slate-300 dark:text-zinc-800">·</span>
                    <span>Patient Profile: {planData?.patient_name || 'Verified Patient'} (ID-{requestId?.slice(-6).toUpperCase()})</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden md:block w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <Input className="pl-9 h-9 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-md text-sm" placeholder="Search parameters..." />
                </div>
                <button onClick={() => setIsHistoryOpen(true)} className="w-9 h-9 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all relative shadow-sm">
                  <HistoryIcon className="w-4 h-4" />
                </button>
                <Link to="/dentist/profile" className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 hover:border-teal-200 dark:hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                  <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-medium text-teal-600 dark:text-zinc-500 mt-0.5">Analyst</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* KPI Stat Row (Appears after analysis) */}
            <AnimatePresence>
              {results && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <AnalyticStatCard
                    title="Risk Multiplier" value={`${Number(results.calculated_risk_multiplier || results.risk_multiplier || 1).toFixed(2)}x`}
                    subtext="Habit-synergistic projection" icon={AlertTriangle} accent="amber"
                  />
                  <AnalyticStatCard
                    title="Fibrosis Risk" value={`${Number(results.fibrosis_risk_percent).toFixed(1)}%`}
                    subtext="Transformation potential" icon={Activity} accent="rose"
                  />
                  <AnalyticStatCard
                    title="Mouth Opening" value={`${formData.mouth_opening_mm}mm`}
                    subtext="Clinical biometric scale" icon={Scale} accent="teal"
                  />
                  <AnalyticStatCard
                    title="Status" value={results.counseling_level}
                    subtext="Clinical protocol phase" icon={Target} accent="indigo"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Input Panel */}
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-md p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-teal-600" />
                  <div className="mb-8 relative z-10">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Exposure Matrix</h2>
                    <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">Configure clinical habit markers</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                    {/* Tobacco Section */}
                    <div className="space-y-8 relative z-10">
                      <div className="space-y-5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                          <span className="flex items-center gap-2"><Wind className="w-4 h-4 text-teal-600" /> Tobacco Intensity</span>
                          <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-3 py-1 rounded-md text-slate-900 dark:text-white">{formData.tobacco_per_day} units</span>
                        </div>
                        <Slider value={[formData.tobacco_per_day]} max={40} onValueChange={(v) => setFormData({ ...formData, tobacco_per_day: v[0] })} />
                      </div>
                      <div className="space-y-5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                          <span>Temporal Duration (Years)</span>
                          <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-3 py-1 rounded-md text-slate-900 dark:text-white">{formData.tobacco_years} yrs</span>
                        </div>
                        <Slider value={[formData.tobacco_years]} max={60} onValueChange={(v) => setFormData({ ...formData, tobacco_years: v[0] })} />
                      </div>
                    </div>

                    {/* Areca Section */}
                    <div className="space-y-8 relative z-10">
                      <div className="space-y-5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                          <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" /> Areca Consumption</span>
                          <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-3 py-1 rounded-md text-slate-900 dark:text-white">{formData.areca_per_day} units</span>
                        </div>
                        <Slider value={[formData.areca_per_day]} max={40} onValueChange={(v) => setFormData({ ...formData, areca_per_day: v[0] })} />
                      </div>
                      <div className="space-y-5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                          <span>Temporal Duration (Years)</span>
                          <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-3 py-1 rounded-md text-slate-900 dark:text-white">{formData.areca_years} yrs</span>
                        </div>
                        <Slider value={[formData.areca_years]} max={60} onValueChange={(v) => setFormData({ ...formData, areca_years: v[0] })} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end relative z-10">
                    <div className="space-y-5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                        <span className="flex items-center gap-2"><Scale className="w-4 h-4 text-teal-600" /> Max Mouth Opening</span>
                        <span className="bg-teal-50 dark:bg-zinc-900 text-teal-700 dark:text-zinc-200 px-3 py-1 rounded-md border border-teal-100 dark:border-zinc-800">{formData.mouth_opening_mm} mm</span>
                      </div>
                      <Slider value={[formData.mouth_opening_mm]} min={5} max={50} onValueChange={(v) => setFormData({ ...formData, mouth_opening_mm: v[0] })} />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" /> Clinical Grade
                      </label>
                      <Select
                        value={formData.current_grade}
                        onValueChange={(v) => setFormData({ ...formData, current_grade: v })}
                      >
                        <SelectTrigger className="w-full h-12 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-md text-xs font-bold text-slate-700 dark:text-white">
                          <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent className="z-[100] dark:bg-zinc-950 dark:border-zinc-800">
                          {['Grade I', 'Grade II', 'Grade III', 'Grade IV'].map(grade => (
                            <SelectItem key={grade} value={grade} className="text-xs font-bold">{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-md p-5 border border-slate-200 dark:border-zinc-800 flex items-center justify-between col-span-1 md:col-span-2 lg:col-span-1 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none">Alcohol Synergism</p>
                          <p className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-widest">Co-toxicity check</p>
                        </div>
                      </div>
                      <Switch checked={formData.alcohol} onCheckedChange={(v) => setFormData({ ...formData, alcohol: v })} />
                    </div>
                  </div>

                  <Button
                    onClick={handleAnalyze} disabled={isAnalyzing}
                    className="w-full h-12 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold uppercase text-[10px] tracking-widest rounded-md mt-10 transition-all active:scale-95 shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Synthesize Risk Profile"}
                  </Button>
                </section>

                {/* Simulation Panel */}
                {results && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-md p-6 sm:p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Prognostic Simulators</h2>
                        <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">Projections for habit reduction scenarios</p>
                      </div>
                    </div>
                    <div className="space-y-8">
                      {results.simulations?.map((sim, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                            <span>{sim.label}</span>
                            <span className={sim.fibrosis_risk_percent < 30 ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}>{Number(sim.fibrosis_risk_percent).toFixed(1)}% Risk</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-zinc-900 rounded-md overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${sim.fibrosis_risk_percent}%` }} className={`h-full rounded-md ${sim.fibrosis_risk_percent < 30 ? 'bg-emerald-500' : 'bg-amber-500'}`} transition={{ duration: 1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column: AI & Recommendations */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-md p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-900 dark:bg-zinc-800" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-md bg-slate-900 dark:bg-teal-600 flex items-center justify-center text-teal-400 dark:text-white">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Prosto AI Insight</h2>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Neural Assessment</p>
                    </div>
                  </div>

                  {results ? (
                    <div className="space-y-6">
                      {aiExplanation ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-md p-4 italic text-slate-600 dark:text-zinc-400 text-xs leading-relaxed font-medium relative z-10">
                          "{aiExplanation}"
                        </motion.div>
                      ) : (
                        <div className="py-2">
                          <Button onClick={handleExplainAI} disabled={isAiExplaining} className="w-full bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-400 h-9 font-bold text-[10px] uppercase tracking-widest border border-teal-200 dark:border-zinc-800 rounded-md">
                            {isAiExplaining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Compute AI Intelligence"}
                          </Button>
                        </div>
                      )}

                      <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 relative z-10 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                          <Stethoscope className="w-3.5 h-3.5" /> Clinical Directives
                        </h3>
                        <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-md">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 mb-1">{results.counseling_level} Phase Recommended</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">System-generated protocol based on neural exposure vectors. Professional judgment is final.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-zinc-800/50 rounded-md">
                      <Brain className="w-8 h-8 text-slate-200 dark:text-zinc-800 mb-4" />
                      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Awaiting synthesization to generate clinical insights</p>
                    </div>
                  )}
                </section>

                {/* Patient Audit History (Small version) */}
                <section className="bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-md p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Audit History</h2>
                    <button onClick={() => setIsHistoryOpen(true)} className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="space-y-3 relative z-10">
                    {history.slice(0, 3).map((h, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-zinc-900/40 rounded-md border border-slate-100 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-600">{new Date(h.created_at).toLocaleDateString()}</span>
                          <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase">{h.counseling_level}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">{Number(h.fibrosis_risk_percent).toFixed(1)}% Risk</p>
                      </div>
                    ))}
                    {history.length === 0 && <p className="text-[11px] text-slate-400 dark:text-zinc-600 italic text-center py-4">No records found</p>}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </motion.div>

      {/* ═══ AUDIT REPOSITORY FULL SLIDE ═══ */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-w-[480px] bg-white dark:bg-black relative z-10 flex flex-col h-full shadow-2xl border-l border-transparent dark:border-zinc-800">
              <div className="px-8 h-20 flex flex-col justify-center border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HistoryIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Patient Diagnostic Audit</h2>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Historic Neural Logs</p>
                    </div>
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} className="w-10 h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4 custom-scrollbar">
                {history.map((h, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-md p-5 hover:border-teal-300 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 flex items-center gap-2 uppercase tracking-widest"><Calendar className="w-3 h-3" /> {new Date(h.created_at).toLocaleString()}</span>
                      <span className="px-2 py-0.5 bg-teal-50 dark:bg-zinc-900 text-teal-600 dark:text-teal-400 rounded-md text-[9px] font-black uppercase border border-teal-100 dark:border-zinc-800/50">{h.counseling_level}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Risk Multiplier</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{(h.calculated_risk_multiplier || h.risk_multiplier) ? `${Number(h.calculated_risk_multiplier || h.risk_multiplier).toFixed(2)}x` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Fibrosis Risk</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{Number(h.fibrosis_risk_percent).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HabitAnalyzer
