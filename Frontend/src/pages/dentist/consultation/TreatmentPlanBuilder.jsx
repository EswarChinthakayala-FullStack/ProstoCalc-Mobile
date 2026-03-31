import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, Plus, Trash2, Sparkles, ShieldCheck, Save, Search,
    IndianRupee, Activity, Zap, CheckCircle2, StickyNote, X, Loader2,
    Hash, Cpu, ChevronRight, CloudLightning, ArrowUpRight, BarChart3,
    Target, RefreshCw, AlertTriangle, TrendingUp, Minus, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    getTreatmentCatalog, getTreatmentPlan, createTreatmentPlan,
    explainCostAI, saveCostEstimation, analyzeTreatmentCostAI
} from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import ClinicianSidebar from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
    estimateCost, buildAIPrompt,
    COMPLEXITY_OPTIONS, MATERIAL_OPTIONS, TREATMENT_TYPES
} from '@/utils/costEstimator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import UniversalLoader from '@/components/UniversalLoader'

/* ================================================================
 SUB-COMPONENTS
 ================================================================ */

/* ── Procedure Card ─────────────────────────────────────────────── */
const ProcedureCard = ({ item, onUpdate, onRemove }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="bg-white dark:bg-zinc-900/40 p-4 sm:p-5 lg:p-6 rounded-md sm:rounded-md border border-slate-100 dark:border-zinc-800 shadow-sm relative group hover:shadow-md transition-all duration-300"
        style={{ borderLeft: `4px solid ${item.color_tag || '#134e4a'}`, borderColor: `${item.color_tag || '#134e4a'}15` }}
    >
        <button
            onClick={() => onRemove(item.id)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-slate-200 dark:text-zinc-800 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md opacity-0 group-hover:opacity-100 transition-all"
        >
            <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color_tag || '#134e4a'}10`, color: item.color_tag || '#134e4a' }}
            >
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-100 leading-tight truncate">{item.name}</h3>
                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {item.treatment_id === 0 ? 'AI Projected Data' : 'Catalog Registered'}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
                <label className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" /> Tooth
                </label>
                <input
                    value={item.tooth_number}
                    onChange={(e) => onUpdate(item.id, 'tooth_number', e.target.value)}
                    placeholder="00"
                    className="w-full h-9 sm:h-10 bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 rounded-md sm:rounded-md px-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-zinc-900 focus:border-teal-200 outline-none transition-all"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <IndianRupee className="w-2.5 h-2.5" /> Cost
                </label>
                <input
                    type="number"
                    value={item.cost}
                    onChange={(e) => onUpdate(item.id, 'cost', e.target.value)}
                    className="w-full h-9 sm:h-10 bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 rounded-md sm:rounded-md px-3 text-xs sm:text-sm font-bold text-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-zinc-900 focus:border-teal-200 outline-none transition-all"
                />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Sessions</label>
                <input
                    type="number" min={1}
                    value={item.sessions}
                    onChange={(e) => onUpdate(item.id, 'sessions', parseInt(e.target.value) || 1)}
                    className="w-full h-9 sm:h-10 bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 rounded-md sm:rounded-md px-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-zinc-900 focus:border-teal-200 outline-none transition-all"
                />
            </div>
        </div>
    </motion.div>
)

/* ── Segmented Control ──────────────────────────────────────────── */
const SegmentedControl = ({ options, value, onChange }) => (
    <div className="flex bg-slate-100 dark:bg-zinc-950 rounded-md p-0.5 sm:p-1 gap-0.5 border border-transparent dark:border-zinc-900">
        {options.map((o) => (
            <button
                key={o.value}
                onClick={() => onChange(o.value)}
                className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-md text-[10px] sm:text-xs font-bold transition-all ${value === o.value
                    ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400'
                    }`}
            >
                {o.label}
            </button>
        ))}
    </div>
)

/* ── Stepper Input ──────────────────────────────────────────────── */
const StepperInput = ({ label, value, onChange, min = 1, max = 32 }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
        <span className="text-xs sm:text-sm font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
            <button
                onClick={() => onChange(Math.max(min, value - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-slate-100 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-600 hover:bg-teal-50 dark:hover:bg-zinc-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
            >
                <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm sm:text-base font-extrabold text-teal-600 tabular-nums">{value}</span>
            <button
                onClick={() => onChange(Math.min(max, value + 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-slate-100 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-600 hover:bg-teal-50 dark:hover:bg-zinc-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
            >
                <Plus className="w-3 h-3" />
            </button>
        </div>
    </div>
)

/* ════════════════════════════════════════════════════════════════════
 MAIN COMPONENT
 ════════════════════════════════════════════════════════════════════ */
const TreatmentPlanBuilder = () => {
    const { requestId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const { isCollapsed } = useSidebar()
    const isDesktop = useMediaQuery('(min-width: 1280px)')

    /* ── state ── */
    const [catalog, setCatalog] = useState([])
    const [selectedItems, setSelectedItems] = useState([])
    const [clinicalNotes, setClinicalNotes] = useState('')
    const [shareCosts, setShareCosts] = useState(true)
    const [shareAI, setShareAI] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showCatalog, setShowCatalog] = useState(false)
    const [showAIEstimator, setShowAIEstimator] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [patientId, setPatientId] = useState(null)

    /* AI Hybrid Estimator state (mirrors Swift AIHybridCostEstimatorView) */
    const [aiTreatmentType, setAiTreatmentType] = useState('Extraction')
    const [aiTeethCount, setAiTeethCount] = useState(1)
    const [aiSessions, setAiSessions] = useState(1)
    const [aiComplexity, setAiComplexity] = useState('Medium')
    const [aiMaterial, setAiMaterial] = useState('Standard')

    /* AI Explanation state */
    const [aiExplanation, setAiExplanation] = useState('')
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)

    /* Cloud Prediction state */
    const [isPredictingCloud, setIsPredictingCloud] = useState(false)
    const [cloudResult, setCloudResult] = useState(null)

    /* ── load data ── */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const [catRes, planRes] = await Promise.all([
                    getTreatmentCatalog(user.id),
                    getTreatmentPlan({ request_id: requestId }),
                ])
                if (catRes.status === 'success') {
                    const catData = catRes.data || []
                    setCatalog(catData)
                    if (catData.length > 0) setAiTreatmentType(catData[0].name)
                }
                if (planRes.status === 'success' && planRes.data) {
                    const p = planRes.data
                    setClinicalNotes(p.clinical_notes || '')
                    setShareCosts(p.share_cost_details === 1 || p.share_cost_details === true)
                    setShareAI(p.share_ai_explanation === 1 || p.share_ai_explanation === true)
                    if (p.ai_explanation) setAiExplanation(p.ai_explanation)
                    if (p.patient_id) setPatientId(p.patient_id)
                    if (p.items) {
                        setSelectedItems(p.items.map((i) => ({
                            id: i.id || Math.random(),
                            treatment_id: i.treatment_id,
                            name: i.name,
                            cost: i.cost,
                            color_tag: i.color_tag || '#134e4a',
                            tooth_number: i.tooth_number || '',
                            sessions: i.sessions_estimate || 1,
                        })))
                    }
                }
            } catch {
                toast.error('Failed to load data')
            } finally {
                setIsLoading(false)
            }
        }
        if (requestId && user.id) fetchData()
    }, [requestId, user.id])

    /* ── derived values ── */
    const totalCost = useMemo(
        () => selectedItems.reduce((s, i) => s + parseFloat(i.cost || 0), 0),
        [selectedItems],
    )
    const totalSessions = useMemo(
        () => selectedItems.reduce((s, i) => s + (i.sessions || 1), 0),
        [selectedItems],
    )

    // Build custom price map from catalog for estimator
    const customPriceMap = useMemo(() => {
        const map = {}
        catalog.forEach((c) => { if (c.name && c.effective_cost) map[c.name] = c.effective_cost })
        return map
    }, [catalog])

    // On-device SLM estimation (mirrors CoreMLCostEstimator)
    const aiEstimation = useMemo(
        () => estimateCost(aiTreatmentType, aiTeethCount, aiSessions, aiComplexity, aiMaterial, customPriceMap),
        [aiTreatmentType, aiTeethCount, aiSessions, aiComplexity, aiMaterial, customPriceMap],
    )

    /* ── actions ── */
    const addToPlan = useCallback((item) => {
        setSelectedItems((p) => [...p, {
            id: Math.random(),
            treatment_id: item.id || item.treatment_id || 0,
            name: item.name,
            cost: item.effective_cost ?? item.cost ?? 0,
            color_tag: item.color_tag || '#134e4a',
            tooth_number: '',
            sessions: 1,
        }])
        toast.success(`Added: ${item.name}`)
    }, [])

    const removeItem = useCallback(
        (id) => setSelectedItems((p) => p.filter((i) => i.id !== id)),
        [],
    )
    const updateItem = useCallback((id, field, value) => {
        setSelectedItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
    }, [])

    /* Inject AI estimation into the plan (matches Swift onAddPlan callback) */
    const injectAIEstimate = useCallback(() => {
        const catalogMatch = catalog.find(c => c.name === aiTreatmentType)
        const finalCost = cloudResult ? cloudResult.total_cost : aiEstimation.baseCost

        setSelectedItems((prev) => [...prev, {
            id: Math.random(),
            treatment_id: catalogMatch ? catalogMatch.id : 0,
            name: `AI: ${aiTreatmentType}${cloudResult ? ' (Clinical)' : ''}`,
            cost: finalCost,
            color_tag: '#134e4a',
            tooth_number: '',
            sessions: aiSessions,
        }])
        setShowAIEstimator(false)
        setCloudResult(null)
        toast.success(`AI Estimate injected: ₹${finalCost.toLocaleString()}`)
    }, [aiTreatmentType, aiEstimation, aiSessions, catalog, cloudResult])

    const handlePredictCloud = async () => {
        setIsPredictingCloud(true)
        try {
            const res = await analyzeTreatmentCostAI({
                treatment_type: aiTreatmentType,
                dentist_id: user.id,
                complexity: aiComplexity,
                material: aiMaterial,
                teeth_count: aiTeethCount,
                sessions: aiSessions
            })
            if (res.status === 'success') {
                setCloudResult(res.data)
                toast.success(`Clinical Grade Prediction Received: ${res.data.engine_version}`)
            }
        } catch (e) {
            toast.error('Cloud prediction failed. Using local engine.')
        } finally {
            setIsPredictingCloud(false)
        }
    }

    /* Generate AI Clinical Justification (matches Swift generateAIExplanation) */
    const generateAIExplanation = useCallback(async () => {
        if (!selectedItems.length) {
            toast.error('Add procedures first')
            return
        }
        setIsGeneratingAI(true)
        try {
            const prompt = buildAIPrompt(selectedItems, totalCost)
            const res = await explainCostAI(prompt)
            if (res.status === 'success' && res.data?.explanation) {
                setAiExplanation(res.data.explanation)
                toast.success('AI Analysis generated')
            }
        } catch {
            // Fallback: static on-device simulation (matches Swift offline fallback)
            setAiExplanation(
                `Based on the proposed treatment architecture of ${selectedItems.length} procedure(s) with a total investment of ₹${totalCost.toLocaleString()}, ` +
                `the clinical framework demonstrates a balanced approach between functional restoration and long-term biological stability. ` +
                `Each procedure is selected to optimize occlusal harmony and minimize secondary intervention risk.\n\n` +
                `"Estimation only. Final clinical judgment determined by the attending surgeon."\n\n*(Processed locally — cloud unavailable)*`
            )
        } finally {
            setIsGeneratingAI(false)
        }
    }, [selectedItems, totalCost])

    /* Save / Finalize (matches Swift submitPlan + saveApprovedEstimationLog) */
    const handleSave = useCallback(async () => {
        if (!selectedItems.length) {
            toast.error('Add at least one procedure')
            return
        }
        setIsSubmitting(true)
        try {
            const res = await createTreatmentPlan({
                dentist_id: user.id,
                patient_id: patientId,
                request_id: requestId,
                items: selectedItems.map((i) => ({
                    treatment_id: i.treatment_id || 0,
                    name: i.name,
                    cost: i.cost,
                    color_tag: i.color_tag || '#134e4a',
                    tooth_number: i.tooth_number,
                    sessions: i.sessions,
                })),
                clinical_notes: clinicalNotes,
                share_cost_details: shareCosts,
                share_ai_explanation: shareAI,
                ai_explanation: aiExplanation,
                status: 'FINAL',
            })

            if (res.status === 'success') {
                // Mode B: Save approved estimation log (matches Swift saveApprovedEstimationLog)
                const planId = res.data?.plan_id || 0
                try {
                    await saveCostEstimation({
                        user_id: user.id,
                        patient_id: patientId,
                        dentist_id: user.id,
                        treatment_plan_id: planId,
                        mode: 'approved',
                        total_cost: totalCost,
                        confidence: 1.0,
                        explanation: aiExplanation,
                        language: 'en',
                        context: 'approved_plan',
                        items: selectedItems.map((i) => ({
                            name: i.name,
                            cost: i.cost,
                            quantity: 1,
                            subtotal: i.cost,
                            source: 'dentist_catalog',
                        })),
                    })
                } catch { /* analytics save is non-critical */ }

                toast.success('Treatment plan finalized & synced')
                navigate(-1)
            }
        } catch {
            toast.error('Failed to save plan')
        } finally {
            setIsSubmitting(false)
        }
    }, [selectedItems, clinicalNotes, shareCosts, shareAI, aiExplanation, requestId, user.id, navigate, totalCost])

    const filtered = useMemo(
        () => catalog.filter((i) =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.category?.toLowerCase().includes(searchTerm.toLowerCase()),
        ), [catalog, searchTerm],
    )

    const { theme } = useTheme()

    /* ── loading ── */
    if (isLoading) return <UniversalLoader text="CALIBRATING TREATMENT ARCHITECTURE..." />

    return (
        <div className={`flex h-screen bg-slate-50 dark:bg-black font-sans overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
            <ClinicianSidebar />

            <motion.div
                initial={false}
                animate={{
                    marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
                    transition: { type: 'spring', damping: 25, stiffness: 200 }
                }}
                className="flex-1 flex flex-col min-w-0 relative overflow-hidden h-screen"
            >
                <div className="absolute inset-0 bg-[grid_#18181b_24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-100 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(var(--zinc-800) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

                {/* ═══════ HEADER ═══════ */}
                <header className="shrink-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-slate-100/80 dark:border-zinc-800 relative">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-[72px] lg:h-20 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                                <button onClick={() => navigate(-1)} className="w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md sm:rounded-md flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-all shadow-sm shrink-0 active:scale-95">
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <div className="min-w-0 flex items-center gap-2.5 sm:gap-3">
                                    <div className="hidden sm:flex w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-tr from-[#0f172a] to-[#334155] rounded-md sm:rounded-md items-center justify-center text-white text-sm font-black shadow-xl shadow-teal-900/10 ring-2 ring-white shrink-0">
                                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 leading-none mb-1">
                                            <span className="truncate">Treatment Design</span>
                                        </h1>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-teal-600 tracking-widest uppercase flex items-center gap-1 leading-none">
                                            Review Plan
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                <div className="hidden sm:block text-right">
                                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Investment</p>
                                    <p className="text-base sm:text-lg lg:text-xl font-black text-teal-600 tabular-nums flex items-center justify-end gap-0.5 leading-none">
                                        <span className="text-sm">₹</span>{totalCost.toLocaleString()}
                                    </p>
                                </div>
                                <Button onClick={handleSave} disabled={isSubmitting || !selectedItems.length} className="h-9 sm:h-11 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-md sm:rounded-md px-3 sm:px-6 shadow-lg shadow-teal-500/20 text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-wider transition-all gap-1.5 sm:gap-2 active:scale-95">
                                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    <span className="hidden sm:inline">Finalize & Sync</span>
                                    <span className="sm:hidden">Finalize</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* Mobile cost bar */}
                    <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100/50 relative z-30">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Estimated Investment</span>
                        <span className="text-[13px] font-black text-teal-600 flex items-center gap-0.5"><span className="text-[10px]">₹</span>{totalCost.toLocaleString()}</span>
                    </div>
                </header>

                {/* ═══════ BODY ═══════ */}
                <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-10">
                    <div className="min-h-full lg:h-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 lg:gap-8">

                        {/* ── Left: Procedures + Notes ── */}
                        <div className="lg:col-span-8 lg:overflow-y-auto lg:overscroll-contain scrollbar-thin scrollbar-thumb-teal-600/20 scrollbar-track-transparent lg:px-6 px-4 py-6 sm:py-8 lg:py-10">

                            {/* Section header */}
                            <div className="flex items-center justify-between mb-5 sm:mb-6">
                                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-teal-500" /> Procedure Architecture
                                    {selectedItems.length > 0 && (
                                        <span className="text-[9px] sm:text-[10px] font-bold bg-teal-50 dark:bg-zinc-900 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-md border border-teal-100 dark:border-zinc-800">{selectedItems.length}</span>
                                    )}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={() => setShowCatalog(true)} className="h-8 sm:h-9 rounded-md sm:rounded-md border-dashed border-teal-200 dark:border-teal-900 text-teal-600 dark:text-teal-400 font-bold text-[11px] sm:text-xs hover:bg-teal-50 dark:hover:bg-zinc-900 gap-1.5">
                                        <Search className="w-3.5 h-3.5" /> Catalog
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowAIEstimator(true)} className="h-8 sm:h-9 rounded-md sm:rounded-md border-dashed border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] sm:text-xs hover:bg-indigo-50 dark:hover:bg-zinc-900 gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> AI Engine
                                    </Button>
                                </div>
                            </div>

                            {/* Items */}
                            <AnimatePresence mode="popLayout">
                                {selectedItems.length === 0 ? (
                                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 sm:p-16 bg-white dark:bg-zinc-950/40 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-md sm:rounded-md text-center">
                                        <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 dark:text-zinc-800 mx-auto mb-3" />
                                        <p className="text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-wider">No procedures defined</p>
                                        <p className="text-[10px] sm:text-[11px] font-medium text-slate-300 dark:text-zinc-700 mt-1">Use the Catalog or AI Engine to add procedures.</p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-3 sm:space-y-4">
                                        {selectedItems.map((item) => (
                                            <ProcedureCard key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* ── AI Clinical Justification (matches SmartAssistantPanel) ── */}
                            {selectedItems.length > 0 && (
                                <div className="mt-8 sm:mt-10">
                                    <div className={`bg-teal-50/30 dark:bg-zinc-900/40 rounded-md sm:rounded-md border border-teal-100/40 dark:border-zinc-800 p-5 sm:p-6 lg:p-7 ${theme === 'dark' ? 'dark' : ''}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <CloudLightning className="w-4 h-4 text-teal-600" />
                                                <span className="text-[10px] sm:text-[11px] font-extrabold text-teal-600 dark:text-teal-400 tracking-widest uppercase">AI Clinical Analytics</span>
                                            </div>
                                            {isGeneratingAI && <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />}
                                        </div>

                                        {!aiExplanation ? (
                                            <div className="text-center py-6">
                                                <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-3">
                                                    Generate an AI-synthesized clinical justification for this plan.
                                                </p>
                                                <button
                                                    onClick={generateAIExplanation}
                                                    disabled={isGeneratingAI}
                                                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-md shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    {isGeneratingAI ? 'Generating…' : 'Generate Cloud Insight'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className={`bg-slate-50/80 dark:bg-zinc-950/60 rounded-md p-4 sm:p-5 text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed border border-teal-50 dark:border-zinc-800 overflow-hidden shadow-sm ${theme === 'dark' ? 'dark' : ''}`}>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-slate-600 dark:text-zinc-300" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-extrabold text-teal-700 dark:text-teal-400" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2 text-slate-600 dark:text-zinc-300" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-1 text-slate-600 dark:text-zinc-300" {...props} />,
                                                        }}
                                                    >
                                                        {aiExplanation}
                                                    </ReactMarkdown>
                                                </div>
                                                <button
                                                    onClick={() => { setAiExplanation(''); generateAIExplanation() }}
                                                    disabled={isGeneratingAI}
                                                    className="mt-3 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
                                                >
                                                    <RefreshCw className="w-3 h-3" /> Re-analyze
                                                </button>
                                            </div>
                                        )}

                                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 italic text-center mt-4">
                                            "Cloud insights are synthesized using AI over secure SSL."
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Clinical Notes ── */}
                            <div className="mt-8 sm:mt-10">
                                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-3 sm:mb-4">
                                    <StickyNote className="w-4 h-4 text-teal-500" /> Clinical Notes
                                </h2>
                                <textarea
                                    value={clinicalNotes}
                                    onChange={(e) => setClinicalNotes(e.target.value)}
                                    placeholder="Add surgical notes, AI logic parameters, or internal remarks…"
                                    rows={4}
                                    className="w-full bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md sm:rounded-md p-4 sm:p-6 text-sm font-medium text-slate-700 dark:text-zinc-200 placeholder:text-slate-300 dark:placeholder:text-zinc-800 focus:ring-2 focus:ring-teal-500/15 focus:border-teal-200 outline-none transition-all resize-none shadow-sm"
                                />
                            </div>
                        </div>

                        {/* ── Right: Sidebar ── */}
                        <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:overflow-y-auto lg:overscroll-contain scrollbar-thin scrollbar-thumb-teal-600/20 scrollbar-track-transparent lg:px-6 px-4 pb-12 py-6 sm:py-8 lg:py-10 space-y-5 sm:space-y-6">

                            {/* Governance Card */}
                            <div className="bg-white dark:bg-zinc-950 rounded-md sm:rounded-md border border-slate-100 dark:border-zinc-800 shadow-sm p-4 sm:p-5 lg:p-6 pb-5">
                                <h3 className="text-[10px] bg-teal-50 text-teal-700 w-fit px-2.5 py-1 rounded-md font-extrabold uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Case Governance
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-100">Visible Economics</p>
                                            <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-0.5 leading-tight">Expose cost structures to patient</p>
                                        </div>
                                        <Switch checked={shareCosts} onCheckedChange={setShareCosts} className="data-[state=checked]:bg-teal-600 scale-90 sm:scale-100 origin-right" />
                                    </div>
                                    <div className="h-px bg-slate-50" />
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-100">Aesthetic Justification</p>
                                            <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-0.5 leading-tight">Inject AI logic into patient dossier</p>
                                        </div>
                                        <Switch checked={shareAI} onCheckedChange={setShareAI} className="data-[state=checked]:bg-teal-600 scale-90 sm:scale-100 origin-right" />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mt-5 pt-4 border-t border-slate-50 dark:border-zinc-800 grid grid-cols-2 gap-2 sm:gap-3">
                                    <div className="p-2 sm:p-3 bg-slate-50 dark:bg-zinc-900 rounded-md border border-slate-100/60 dark:border-zinc-800">
                                        <p className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Procedures</p>
                                        <p className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-100">{selectedItems.length}</p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-slate-50 dark:bg-zinc-900 rounded-md border border-slate-100/60 dark:border-zinc-800">
                                        <p className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Sessions</p>
                                        <p className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-100">{totalSessions}</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Synthesis Card (matches Swift dark card) */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-md sm:rounded-md p-5 sm:p-6 text-white relative overflow-hidden shadow-xl">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/15 rounded-md blur-2xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center backdrop-blur border border-white/10">
                                            <Sparkles className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-tight">AI Synthesis</h3>
                                    </div>
                                    <p className="text-[11px] sm:text-xs font-medium text-slate-400 leading-relaxed mb-4">
                                        {selectedItems.length > 0 ? (
                                            <>AI Ensemble predicts <span className="text-indigo-400 font-extrabold">{Math.round((aiEstimation?.confidenceScore || 0.92) * 100)}% clinical confidence</span>. Ensure occlusal balance during execution.</>
                                        ) : (
                                            'Add procedures to generate AI-driven cost analysis and clinical predictions.'
                                        )}
                                    </p>
                                    {selectedItems.length > 0 && (
                                        <>
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="flex-1 h-1.5 bg-white/10 rounded-md overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((aiEstimation?.confidenceScore || 0.92) * 100)}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-md" />
                                                </div>
                                                <span className="text-[10px] font-extrabold text-indigo-400 tabular-nums">{Math.round((aiEstimation?.confidenceScore || 0.92) * 100)}%</span>
                                            </div>
                                            <button
                                                onClick={generateAIExplanation}
                                                disabled={isGeneratingAI}
                                                className="w-full py-2 bg-white/10 hover:bg-white/15 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-md border border-white/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudLightning className="w-3 h-3" />}
                                                Cloud Cost Analysis
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="flex items-start gap-2.5 p-3 sm:p-4 bg-slate-50/80 dark:bg-zinc-900/50 rounded-md border border-slate-100/80 dark:border-zinc-800">
                                <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 mt-0.5 shrink-0" />
                                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-zinc-500 leading-relaxed">
                                    AI estimates do not replace professional clinical judgment. Actual costs and biological outcomes are determined by your attending clinician.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════ CATALOG DRAWER ═══════ */}
                <AnimatePresence>
                    {showCatalog && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCatalog(false)} className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md z-[100]" />
                            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 250 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-black shadow-lg z-[101] flex flex-col border-l border-slate-200 dark:border-zinc-800">
                                <div className="shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <span className="text-[9px] sm:text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Clinical Catalog</span>
                                            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Select Procedure</h2>
                                        </div>
                                        <button onClick={() => setShowCatalog(false)} className="w-9 h-9 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-600 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-zinc-700" />
                                        <input autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search procedures…" className="w-full h-10 sm:h-11 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-md pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-teal-500/15 focus:bg-white dark:focus:bg-zinc-900 focus:border-teal-200 outline-none transition-all dark:text-white dark:placeholder:text-zinc-800" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent px-5 sm:px-7 py-4 space-y-2 sm:space-y-3">
                                    {filtered.length === 0 ? (
                                        <div className="text-center py-16 text-slate-300"><Search className="w-8 h-8 mx-auto mb-3 opacity-40" /><p className="text-xs font-bold uppercase tracking-wider">No matching procedures</p></div>
                                    ) : (
                                        filtered.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => { addToPlan(item); setShowCatalog(false); setSearchTerm('') }}
                                                className="w-full text-left p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 rounded-md sm:rounded-md border border-slate-100 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-900 hover:bg-teal-50/30 dark:hover:bg-zinc-900 transition-all group/item"
                                            >
                                                <div
                                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center group-hover/item:shadow transition-all shrink-0"
                                                    style={{ backgroundColor: `${item.color_tag || '#134e4a'}10`, color: item.color_tag || '#134e4a' }}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover/item:text-teal-800 dark:group-hover/item:text-teal-400 truncate">{item.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 truncate">{item.category}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-extrabold text-teal-600">₹{item.effective_cost?.toLocaleString()}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ═══════ AI HYBRID COST ESTIMATOR DRAWER (mirrors Swift AIHybridCostEstimatorView) ═══════ */}
                <AnimatePresence>
                    {showAIEstimator && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAIEstimator(false)} className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md z-[100]" />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 250 }}
                                className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-black shadow-lg z-[101] flex flex-col border-l border-slate-200 dark:border-zinc-800"
                            >
                                {/* AI Header */}
                                <div className="shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 dark:bg-zinc-900 rounded-md flex items-center justify-center border border-indigo-100 dark:border-zinc-800 shadow-sm">
                                                <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] sm:text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">On-Device AI</span>
                                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Hybrid Estimation Engine</h2>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowAIEstimator(false)} className="w-9 h-9 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* AI Body */}
                                <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent px-5 sm:px-7 py-5 space-y-5 sm:space-y-6">

                                    {/* ── Estimation Result Card ── */}
                                    <div className="bg-white dark:bg-zinc-950 rounded-md border border-teal-100 dark:border-zinc-800 shadow-lg shadow-teal-500/5 dark:shadow-black/20 p-5 sm:p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 tracking-widest uppercase">
                                                    {cloudResult ? 'Cloud Clinical Prediction' : 'On-Device SLM Prediction'}
                                                </span>
                                                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                                                    ₹{(cloudResult ? cloudResult.total_cost : aiEstimation.baseCost).toLocaleString()}
                                                </p>
                                                <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-600 mt-1 uppercase tracking-tight">
                                                    {cloudResult ? cloudResult.engine_version : aiEstimation.engine}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 dark:bg-zinc-900 rounded-md flex items-center justify-center border border-transparent dark:border-zinc-800">
                                                {cloudResult ? <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" /> : <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />}
                                            </div>
                                        </div>

                                        <div className="flex gap-6 sm:gap-8">
                                            <div>
                                                <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-wider">Confidence</span>
                                                <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{Math.round((cloudResult ? (cloudResult.confidence_score || 0.93) : aiEstimation.confidenceScore) * 100)}%</p>
                                            </div>
                                            <div>
                                                <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-wider">Projected Range</span>
                                                <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                                                    ₹{(cloudResult ? (cloudResult.min_range || cloudResult.base_cost * 0.92) : aiEstimation.minRange).toLocaleString()} –
                                                    ₹{(cloudResult ? (cloudResult.max_range || cloudResult.base_cost * 1.10) : aiEstimation.maxRange).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        disabled={isPredictingCloud}
                                        onClick={handlePredictCloud}
                                        variant="outline"
                                        className="w-full h-12 rounded-md border-indigo-100 dark:border-zinc-800 bg-indigo-50/30 dark:bg-zinc-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-200 dark:hover:border-zinc-700 text-xs font-bold gap-2 uppercase tracking-widest"
                                    >
                                        {isPredictingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                                        {cloudResult ? 'Re-Run Clinical Prediction' : 'Predict Clinical Grade Cost'}
                                    </Button>

                                    {/* ── Clinical Parameters ── */}
                                    <div className="bg-white dark:bg-zinc-950 rounded-md border border-slate-100 dark:border-zinc-800 shadow-sm p-5">
                                        <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Clinical Parameters
                                        </h3>

                                        {/* Procedure type */}
                                        <div className="mb-4">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 block">Procedure</label>
                                            <Select value={aiTreatmentType} onValueChange={setAiTreatmentType}>
                                                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-md text-sm font-bold text-slate-700 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500/20 transition-all">
                                                    <SelectValue placeholder="Select Procedure" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[110] dark:bg-zinc-950 dark:border-zinc-800 max-h-[300px]">
                                                    {catalog.length > 0
                                                        ? catalog.map((t) => <SelectItem key={t.id} value={t.name} className="text-sm font-bold">{t.name}</SelectItem>)
                                                        : TREATMENT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm font-bold">{t}</SelectItem>)
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <StepperInput label="Units / Teeth" value={aiTeethCount} onChange={setAiTeethCount} max={32} />
                                        <StepperInput label="Expected Sessions" value={aiSessions} onChange={setAiSessions} max={10} />
                                    </div>

                                    {/* ── Complexity & Material ── */}
                                    <div className="bg-white dark:bg-zinc-950 rounded-md border border-slate-100 dark:border-zinc-800 shadow-sm p-5">
                                        <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Target className="w-3.5 h-3.5 text-indigo-500" /> Complexity & Material
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 block">Bio-Complexity Level</label>
                                                <SegmentedControl options={COMPLEXITY_OPTIONS} value={aiComplexity} onChange={setAiComplexity} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 block">Material Classification</label>
                                                <SegmentedControl options={MATERIAL_OPTIONS} value={aiMaterial} onChange={setAiMaterial} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Inject button ── */}
                                    <button
                                        onClick={injectAIEstimate}
                                        className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white text-sm font-extrabold rounded-md shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                        Inject into Treatment Design
                                    </button>

                                    {/* Disclaimer */}
                                    <div className="flex items-start gap-2.5 p-3 bg-indigo-50/50 dark:bg-zinc-900/50 rounded-md border border-indigo-100/40 dark:border-zinc-800">
                                        <AlertTriangle className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-zinc-500 leading-relaxed">
                                            AI provides informational estimates only and does not replace professional clinical judgment. Treatment costs may vary based on clinical assessment.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default TreatmentPlanBuilder
