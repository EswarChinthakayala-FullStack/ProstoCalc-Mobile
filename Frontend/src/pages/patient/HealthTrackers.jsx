import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Activity, Flame, Pill, TrendingUp, History, Calendar, Clock,
    Plus, ChevronRight, ArrowLeft, Search, ArrowRight, Loader2,
    CheckCircle, AlertCircle, XCircle, Info, ShieldCheck, Sparkles, Lock,
    Zap, Brain, Smile, Wind
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { useHealthTrackers } from '@/hooks/useHealthTrackers'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import NotificationBell from '@/components/NotificationBell'
import api from '@/services/api'

// ─── StatCard Component (matching PatientConsultations style) ───────────────────

const StatCard = ({ title, value, subtext, icon: Icon, accent }) => {
    const accents = {
        blue: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600' },
        amber: { bg: 'bg-amber-600/10', text: 'text-amber-600', border: 'border-amber-600/20', bar: 'bg-amber-600' },
        emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-600', border: 'border-emerald-600/20', bar: 'bg-emerald-600' },
        indigo: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600' },
        rose: { bg: 'bg-rose-600/10', text: 'text-rose-600', border: 'border-rose-600/20', bar: 'bg-rose-600' },
        teal: { bg: 'bg-emerald-600/10', text: 'text-emerald-600', border: 'border-emerald-600/20', bar: 'bg-emerald-600' },
    }
    const t = accents[accent] || accents.blue

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-600/30 transition-all duration-300 group relative overflow-hidden"
        >
            <div className={`absolute top-0 left-0 right-0 h-[4px] ${t.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />

            <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border`}>
                    <Icon className="w-4.5 h-4.5" />
                </div>
            </div>

            <h3 className="text-3xl font-black text-foreground tracking-tighter leading-none mb-2 group-hover:text-blue-600 transition-colors uppercase tabular-nums">{value}</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4 opacity-70">{title}</p>

            <div className="pt-4 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground font-black flex items-center gap-2 uppercase tracking-widest opacity-80">
                    <span className={`w-2 h-2 rounded-md ${t.bar} shadow-[0_0_8px_var(--blue-600)]`} />
                    {subtext}
                </p>
            </div>
        </motion.div>
    )
}

// ─── TrackerCard Component (matching consultation card style) ───────────────────

const TrackerCard = ({ title, category, value, unit, icon: Icon, color, onClick, status = "OPTIMAL", lastSync }) => {
    const colorStyles = {
        blue: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600', hover: 'hover:border-blue-600/30' },
        emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-600', border: 'border-emerald-600/20', bar: 'bg-emerald-600', hover: 'hover:border-emerald-600/30' },
        amber: { bg: 'bg-amber-600/10', text: 'text-amber-600', border: 'border-amber-600/20', bar: 'bg-amber-600', hover: 'hover:border-amber-600/30' },
        indigo: { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600/20', bar: 'bg-blue-600', hover: 'hover:border-blue-600/30' },
    }
    const c = colorStyles[color] || colorStyles.blue

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8 }}
            onClick={onClick}
            className={`bg-card/80 backdrop-blur-3xl border border-border rounded-md p-6 sm:p-7 flex flex-col relative overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-blue-600/10 ${c.hover} transition-all duration-300`}
        >
            <div className={`absolute top-0 left-0 right-0 h-[4px] ${c.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[1rem] ${c.bg} ${c.text} flex items-center justify-center ${c.border} border shrink-0 transition-transform group-hover:scale-110 duration-500`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-foreground tracking-tight uppercase">{title}</h3>
                        <p className="text-[10px] font-black text-muted-foreground mt-1.5 flex items-center gap-2 uppercase tracking-[0.2em] opacity-60">
                            {category}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-secondary/20 p-4 rounded-md border border-border/50 shadow-inner">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-black text-muted-foreground/60 flex items-center gap-2 tracking-[0.2em]">
                        <Calendar className="w-3.5 h-3.5" /> Last Sync
                    </span>
                    <span className="text-xs font-black text-foreground uppercase tracking-tight">
                        {lastSync || 'No data'}
                    </span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-black text-muted-foreground/60 flex items-center gap-2 tracking-[0.2em]">
                        <Activity className="w-3.5 h-3.5" /> Current
                    </span>
                    <span className="text-xs font-black text-foreground">
                        <span className="text-2xl tracking-tighter tabular-nums">{value}</span> <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-1">{unit}</span>
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center mt-auto">
                <span className={`px-3 py-1 rounded-md text-[9px] font-black border flex items-center gap-2 uppercase tracking-widest transition-all ${c.bg} ${c.text} ${c.border} group-hover:shadow-[0_0_15px_var(--blue-600)] group-hover:scale-105 shadow-inner`}>
                    <span className={`w-1.5 h-1.5 rounded-md ${c.bar} animate-pulse`} />
                    {status}
                </span>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase tracking-widest group-hover:text-blue-600 transition-all">
                    View Registry <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </motion.div>
    )
}

const ComplianceBar = ({ label, score, color, icon: Icon }) => {
    const colors = {
        emerald: "bg-emerald-600 text-emerald-600",
        indigo: "bg-blue-600 text-blue-600",
        amber: "bg-amber-600 text-amber-600",
        blue: "bg-blue-600 text-blue-600"
    }
    const c = colors[color] || colors.blue

    return (
        <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground/60 flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${c.split(' ')[1]}`} />
                    {label}
                </span>
                <span className="text-foreground tabular-nums">{score}%</span>
            </div>
            <div className="h-2 w-full bg-secondary/50 rounded-md overflow-hidden border border-border/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                    className={`h-full ${c.split(' ')[0]} rounded-md shadow-[0_0_12px_rgba(37,99,235,0.4)]`}
                />
            </div>
        </div>
    )
}

// ─── Dashboard Overview ─────────────────────────────────────────────────────────

const DashboardOverview = ({ analytics, mouthHistory, medications, onNavigate, navigate }) => {
    const { user } = useAuth()
    const complianceScore = useMemo(() => {
        if (!analytics) return 0;
        const med = analytics.medication_compliance?.consistency_score || 0;
        const physio = analytics.physio?.consistency_score || 0;
        const habit = analytics.tobacco_free?.consistency_score || 0;

        // Count how many trackers actually have data (active or historical)
        let total = 0;
        let count = 0;

        if (analytics.medication_compliance) { total += med; count++; }
        if (analytics.physio) { total += physio; count++; }
        if (analytics.tobacco_free) { total += habit; count++; }

        return count > 0 ? Math.round(total / count) : 0;
    }, [analytics]);

    const latestMouth = mouthHistory.length > 0 ? mouthHistory[mouthHistory.length - 1].value_mm : '--';
    const lastMouthDate = mouthHistory.length > 0
        ? new Date(mouthHistory[mouthHistory.length - 1].entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'No data';

    const activeMeds = medications?.length || 0;
    const tobaccoStreak = analytics?.tobacco_free?.current_streak || 0;

    const getLastMedDate = () => {
        if (analytics?.medication_compliance?.last_sync_date) {
            return new Date(analytics.medication_compliance.last_sync_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        if (!medications || medications.length === 0) return 'No data';
        const allLogs = medications.flatMap(m => m.logs || []);
        if (allLogs.length === 0) return 'No logs';
        const sorted = [...allLogs].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
        return new Date(sorted[0].log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const getHabitSyncDate = () => {
        if (analytics?.tobacco_free?.last_sync_date) {
            return new Date(analytics.tobacco_free.last_sync_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return 'Today'; // Default fallback
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* KPI Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <StatCard
                    title="Mouth Opening"
                    value={latestMouth}
                    subtext="Latest measurement"
                    icon={Activity}
                    accent="indigo"
                />
                <StatCard
                    title="Medication Adherence"
                    value={`${analytics?.medication_compliance?.consistency_score || 0}%`}
                    subtext="Consistency score"
                    icon={Pill}
                    accent="emerald"
                />
                <StatCard
                    title="Tobacco Free"
                    value={tobaccoStreak}
                    subtext="Days streak"
                    icon={Flame}
                    accent="amber"
                />
                <StatCard
                    title="Active Meds"
                    value={activeMeds}
                    subtext="Prescriptions"
                    icon={ShieldCheck}
                    accent="blue"
                />
            </div>

            {/* Tracker Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <TrackerCard
                    title="Mouth Opening"
                    category="Physio Stability"
                    value={latestMouth}
                    unit="mm"
                    icon={Activity}
                    color="indigo"
                    status={latestMouth > 35 ? "OPTIMAL" : "TRACKING"}
                    lastSync={lastMouthDate}
                    onClick={() => navigate('/patient/mouth-opening')}
                />
                <TrackerCard
                    title="Medication Protocol"
                    category="Prescription Adherence"
                    value={analytics?.medication_compliance?.consistency_score || 0}
                    unit="%"
                    icon={Pill}
                    color="emerald"
                    status={analytics?.medication_compliance?.consistency_score > 80 ? "OPTIMAL" : "MONITORING"}
                    lastSync={getLastMedDate()}
                    onClick={() => navigate('/patient/medication')}
                />
                <TrackerCard
                    title="Tobacco Free"
                    category="Recovery Habit"
                    value={tobaccoStreak}
                    unit="Days"
                    icon={Flame}
                    color="amber"
                    status={tobaccoStreak > 30 ? "EXCELLENT" : "TRACKING"}
                    lastSync={getHabitSyncDate()}
                    onClick={() => navigate('/patient/habit-tracker')}
                />
            </div>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2 bg-card/80 backdrop-blur-3xl border border-border rounded-md p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-md -mr-32 -mt-32 blur-[100px] opacity-100" />
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h3 className="text-base font-black text-foreground flex items-center gap-3 uppercase tracking-tighter">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Recovery Compliance Score
                        </h3>
                        <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600/30 font-black text-[9px] uppercase tracking-widest px-3 py-1 ring-4 ring-emerald-600/5">
                            <Sparkles className="w-3 h-3" /> Live Registry
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-center relative z-10">
                        {/* Circular Progress (SVG) */}
                        <div className="flex justify-center relative">
                            <div className="relative w-48 h-48">
                                <div className="absolute inset-0 bg-blue-600/10 blur-[50px] rounded-md animate-pulse" />
                                <svg className="w-full h-full transform -rotate-90 relative z-10">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="86"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        className="text-secondary"
                                    />
                                    <motion.circle
                                        cx="96"
                                        cy="96"
                                        r="86"
                                        stroke="currentColor"
                                        strokeWidth="10"
                                        strokeDasharray={540}
                                        initial={{ strokeDashoffset: 540 }}
                                        animate={{ strokeDashoffset: 540 - (540 * complianceScore) / 100 }}
                                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                                        strokeLinecap="round"
                                        fill="transparent"
                                        className="text-blue-600 shadow-2xl drop-shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                                    <span className="text-5xl font-black text-foreground leading-none tracking-tighter tabular-nums">{complianceScore}<span className="text-xl text-muted-foreground ml-0.5">%</span></span>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase mt-3 tracking-[0.3em] opacity-60">Registry Global</span>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="space-y-4">
                            <ComplianceBar
                                label="Medication"
                                score={analytics?.medication_compliance?.consistency_score || 0}
                                color="emerald"
                                icon={Pill}
                            />
                            <ComplianceBar
                                label="Physiotherapy"
                                score={analytics?.physio?.consistency_score || 0}
                                color="indigo"
                                icon={Activity}
                            />
                            <ComplianceBar
                                label="Recovery Habit"
                                score={analytics?.tobacco_free?.consistency_score || 0}
                                color="amber"
                                icon={Flame}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-md p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-[5px] bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-md -mr-32 -mb-32 blur-[100px] group-hover:bg-blue-600/20 transition-all duration-700" />

                    <div className="flex items-start gap-6 h-full flex-col relative z-10">
                        <div className="w-14 h-14 bg-white/5 backdrop-blur-3xl rounded-md flex items-center justify-center border border-white/10 shadow-inner">
                            <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 opacity-80">AI Recovery Insight</p>
                            <p className="text-[20px] font-black leading-tight uppercase tracking-tighter">
                                {complianceScore > 80
                                    ? "EXCEPTIONAL ADHERENCE! YOUR COMMITMENT REDUCES POST-OPERATIVE RISKS SIGNIFICANTLY."
                                    : complianceScore > 50
                                        ? "GOOD PROGRESS. OPTIMIZE PHYSIOTHERAPY ROUTINE TO ENSURE FASTER STABILIZATION."
                                        : "RECOVERY ALERT: CONSISTENCY IN PROTOCOL IS CRITICAL FOR OPTIMAL OUTCOMES."}
                            </p>
                        </div>
                        <div className="mt-auto pt-6 flex items-center gap-3 border-t border-white/5 w-full">
                            <Badge variant="secondary" className="bg-white/10 text-white py-1 px-3 font-black text-[9px] uppercase tracking-widest border-none ring-4 ring-white/5">
                                {complianceScore > 50 ? "LOW RISK" : "OBSERVATION"}
                            </Badge>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-auto">Analysis v2.1</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Mouth Opening Tracker View ───────────────────────────────────────────────

const MouthTrackerView = ({ history, onLog, onBack, isLoading }) => {
    const [val, setVal] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Check if user has already logged entry today
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = history.find(h => {
        const entryDate = new Date(h.entry_date).toISOString().split('T')[0];
        return entryDate === today;
    });
    const hasLoggedToday = !!todayEntry;

    const handleSave = async () => {
        if (!val || isNaN(val)) {
            toast.error("Please enter a valid numeric measurement.")
            return
        }
        if (hasLoggedToday) {
            toast.info("You've already logged your mouth opening today. Come back tomorrow!")
            return
        }
        setIsSaving(true)
        await onLog(val)
        setIsSaving(false)
        setVal('')
    }

    const chartData = useMemo(() => {
        return history.slice(-14).map(h => ({
            date: new Date(h.entry_date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            value: h.value_mm
        }))
    }, [history]);

    const stats = useMemo(() => {
        if (history.length === 0) return { avg: 0, peak: 0, growth: 0 };
        const values = history.map(h => h.value_mm);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        const peak = Math.max(...values);
        const prev = values.length > 1 ? values[values.length - 2] : values[0];
        const latest = values[values.length - 1];
        const growth = latest - prev;
        return { avg, peak, growth };
    }, [history]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-12">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <button onClick={onBack} className="flex items-center gap-2.5 text-muted-foreground/60 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.25em] transition-all mb-4 group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1.5 transition-transform" />
                        Back to Registry
                    </button>
                    <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Mouth Opening <span className="text-blue-600">Telemetry</span></h2>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-4 opacity-60">Monitor physiological recovery trajectory and stability.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Diagnosis Node</span>
                        <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/30 px-4 py-1.5 font-black text-[10px] uppercase tracking-widest ring-4 ring-emerald-600/5">Satisfactory Progress</Badge>
                    </div>
                </div>
            </div>

            {/* Quick Insights Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Clinical Average', value: `${stats.avg}mm`, icon: Activity, accent: 'blue' },
                    { label: 'Peak Record', value: `${stats.peak}mm`, icon: TrendingUp, accent: 'blue' },
                    { label: 'Net Growth', value: `${stats.growth >= 0 ? '+' : ''}${stats.growth}mm`, icon: ArrowRight, accent: 'emerald' },
                    { label: 'Session Registry', value: history.length, icon: History, accent: 'blue' }
                ].map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 sm:p-8 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-300 group relative"
                    >
                        <div className="flex flex-col gap-5">
                            <div className="w-12 h-12 rounded-md bg-blue-600/10 text-blue-600 border border-blue-600/20 flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                                <s.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2 opacity-60 leading-none">{s.label}</p>
                                <p className="text-3xl font-black text-foreground leading-none tracking-tighter tabular-nums">{s.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Measurement Entry - Left (4 cols) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Today's Entry Status Card */}
                    <div className={`relative overflow-hidden rounded-md border-2 transition-all duration-700 ${hasLoggedToday
                        ? 'bg-gradient-to-br from-emerald-600/5 to-emerald-600/10 border-emerald-600/30 shadow-2xl shadow-emerald-600/20'
                        : 'bg-card/80 backdrop-blur-3xl border-border shadow-2xl shadow-black/10'}`}>

                        <div className={`absolute top-0 right-0 w-48 h-48 rounded-md -mr-24 -mt-24 transition-transform duration-1000 opacity-20 ${hasLoggedToday ? 'bg-emerald-600 blur-[80px]' : 'bg-blue-600 blur-[80px]'}`} />

                        <div className="relative z-10 p-8 sm:p-10">
                            {/* Status Badge */}
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-md flex items-center justify-center transition-all shadow-inner ${hasLoggedToday
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-secondary text-blue-600'}`}>
                                        {hasLoggedToday ? <CheckCircle className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60 mb-1">Telemetry Status</p>
                                        <p className={`text-base font-black uppercase tracking-tighter ${hasLoggedToday ? 'text-emerald-600' : 'text-foreground'}`}>
                                            {hasLoggedToday ? 'Sync Complete' : 'Awaiting Entry'}
                                        </p>
                                    </div>
                                </div>
                                <Badge className={`${hasLoggedToday
                                    ? 'bg-emerald-600 text-white border-transparent'
                                    : 'bg-blue-600 text-white border-transparent'} font-black text-[9px] uppercase tracking-widest px-4 py-1 rounded-md shadow-lg`}>
                                    {hasLoggedToday ? 'SYNCED' : 'PENDING'}
                                </Badge>
                            </div>

                            {/* Current Value Display */}
                            <div className={`mb-10 p-8 rounded-md border-2 transition-all duration-500 ${hasLoggedToday
                                ? 'bg-emerald-600/10 border-emerald-600/20'
                                : 'bg-secondary/20 border-border/50 shadow-inner'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60">
                                        {hasLoggedToday ? "Registered Value" : 'Previous Baseline'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className={`text-6xl font-black transition-all tracking-tighter tabular-nums ${hasLoggedToday ? 'text-emerald-600' : 'text-muted-foreground/20'}`}>
                                        {hasLoggedToday ? todayEntry.value_mm : '--'}
                                    </span>
                                    <span className={`text-lg font-black uppercase tracking-widest opacity-60 ${hasLoggedToday ? 'text-emerald-600' : 'text-muted-foreground'}`}>mm</span>
                                </div>
                            </div>

                            {/* Input Section */}
                            {hasLoggedToday ? (
                                <div className="bg-emerald-600/5 border border-emerald-600/10 rounded-md p-6 text-center">
                                    <div className="inline-flex items-center gap-2 mb-3 bg-emerald-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                                        <Lock className="w-3.5 h-3.5" /> Registry Locked
                                    </div>
                                    <p className="text-[11px] text-emerald-600/80 font-black uppercase tracking-widest leading-relaxed">
                                        DAILY TELEMETRY QUOTA REACHED.<br />NEXT SYNC AVAILABLE IN 24H.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 opacity-60 mb-3 block">Physiological Measurement</label>
                                        <div className="relative group/inp">
                                            <Input
                                                type="number"
                                                value={val}
                                                onChange={(e) => setVal(e.target.value)}
                                                placeholder="---"
                                                className="h-20 text-4xl font-black bg-secondary/30 border-2 border-border focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all rounded-md pr-20 placeholder:text-muted-foreground/10 tabular-nums"
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                                <span className="text-muted-foreground font-black text-xs tracking-widest opacity-60">MM</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSave}
                                        disabled={!val || isSaving}
                                        className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-md shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-[0.97] transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full duration-1000 transition-transform -translate-x-full" />
                                        <div className="relative z-10 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em]">
                                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                <>REGISTER TELEMETRY <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" /></>
                                            )}
                                        </div>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6 text-white shadow-xl shadow-black/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="w-24 h-24" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2">ProstoCalc Advice</h4>
                        <p className="text-sm text-zinc-300 font-medium leading-relaxed mb-4">
                            Consistently tracking your mouth opening helps clinicians tailor your recovery plan. Aim for 3 readings per day.
                        </p>
                        <div className="flex items-center gap-2 text-zinc-500">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Clinically Validated</span>
                        </div>
                    </div>
                </div>

                {/* Chart - Right (8 cols) */}
                <div className="lg:col-span-8 bg-card/80 backdrop-blur-xl border border-border rounded-md p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[5px] bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-xl font-black text-foreground flex items-center gap-3 uppercase tracking-tighter">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                                Physiological Trajectory
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-3 opacity-60">Neural Stability Visualization</p>
                        </div>
                        <div className="flex gap-3">
                            <Badge variant="outline" className="border-border font-black text-[9px] uppercase tracking-widest px-4 py-1.5 ring-4 ring-blue-600/5">14 Day Node Window</Badge>
                        </div>
                    </div>

                    <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMouth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-border/50" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'currentColor', fontWeight: 900, textTransform: 'uppercase' }}
                                    className="text-muted-foreground/60"
                                    dy={20}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'currentColor', fontWeight: 900 }}
                                    className="text-muted-foreground/60"
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        backdropFilter: 'blur(16px)',
                                        borderRadius: '1.5rem',
                                        border: '1px solid var(--border)',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    labelStyle={{ fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '900', marginBottom: '8px', letterSpacing: '0.2em' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2563EB"
                                    strokeWidth={6}
                                    fillOpacity={1}
                                    fill="url(#colorMouth)"
                                    animationDuration={2000}
                                    dot={{ r: 6, fill: 'var(--card)', stroke: '#2563EB', strokeWidth: 3 }}
                                    activeDot={{ r: 10, fill: '#2563EB', stroke: 'var(--card)', strokeWidth: 3, shadow: '0 0 20px rgba(37,99,235,0.6)' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Clinical interaction timeline */}
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border flex items-center justify-between bg-blue-600/5">
                    <div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-[0.25em] flex items-center gap-3">
                            <History className="w-5 h-5 text-blue-600" /> Clinical Registry
                        </h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-border bg-card px-4 py-1.5">{history.length} SYNCED SESSIONS</Badge>
                </div>
                <div className="divide-y divide-border/50">
                    {history.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-secondary/50 rounded-md flex items-center justify-center text-muted-foreground/30 mx-auto mb-6">
                                <Info className="w-8 h-8" />
                            </div>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">No Telemetry Recorded</p>
                        </div>
                    ) : (
                        [...history].reverse().map((h, i) => {
                            const entryDate = new Date(h.entry_date);
                            const isToday = entryDate.toISOString().split('T')[0] === today;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={i}
                                    className={`group relative overflow-hidden border-2 transition-all duration-300 rounded-md ${isToday
                                        ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10'
                                        : 'bg-card border-border hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5'
                                        }`}
                                >
                                    {/* Top accent bar */}
                                    <div className={`h-1.5 w-full ${isToday ? 'bg-emerald-500' : 'bg-primary'}`} />

                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-all border ${isToday
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-secondary text-primary border-border'
                                                    }`}>
                                                    {isToday ? <CheckCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{isToday ? "Today's" : 'Historical'} Entry</p>
                                                    <p className="text-xs font-bold text-foreground">
                                                        {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {isToday && (
                                                <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-bold text-[9px] px-2 py-0.5">
                                                    TODAY
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Measured Value</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-3xl font-black transition-transform group-hover:scale-110 origin-left ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                                                        {h.value_mm}
                                                    </span>
                                                    <span className="text-xs font-bold text-muted-foreground">MM</span>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold ${h.value_mm > 35 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-md ${h.value_mm > 35 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {h.value_mm > 35 ? 'Optimal' : 'Monitoring'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Medication Tracker View ─────────────────────────────────────────────────

const MedTrackerView = ({ medications, analytics, onLog, onAdd, onDelete, onBack }) => {
    const [showAdd, setShowAdd] = useState(false)
    const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', color_tag: 'var(--primary)', start_date: new Date().toISOString().split('T')[0] })

    const handleAdd = () => {
        if (!newMed.name) {
            toast.error("Medication name is required.")
            return
        }
        onAdd(newMed)
        setShowAdd(false)
        setNewMed({ name: '', dosage: '', frequency: '', color_tag: 'var(--primary)', start_date: new Date().toISOString().split('T')[0] })
    }

    const adherenceData = useMemo(() => {
        const dateMap = {};
        medications.forEach(med => {
            (med.logs || []).forEach(log => {
                const dateKey = log.log_date;
                if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, shortDate: new Date(dateKey).toLocaleDateString([], { month: 'short', day: 'numeric' }), taken: 0, missed: 0 };
                if (log.status === 'taken') dateMap[dateKey].taken++;
                else dateMap[dateKey].missed++;
            });
        });
        return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
    }, [medications]);

    const stats = useMemo(() => {
        let totalTaken = 0;
        let totalMissed = 0;
        medications.forEach(m => {
            (m.logs || []).forEach(l => {
                if (l.status === 'taken') totalTaken++;
                else totalMissed++;
            });
        });
        return { taken: totalTaken, missed: totalMissed };
    }, [medications]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-12">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <button onClick={onBack} className="flex items-center gap-2.5 text-muted-foreground/60 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.25em] transition-all mb-4 group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1.5 transition-transform" />
                        Back to Registry
                    </button>
                    <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Prescription <span className="text-blue-600">Telemetry</span></h2>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-4 opacity-60">Clinical medication adherence tracking and registry monitoring.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowAdd(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest px-8 py-7 rounded-md shadow-2xl shadow-blue-600/30 active:scale-95 transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full duration-1000 transition-transform -translate-x-full" />
                        <span className="relative z-10 flex items-center gap-3">
                            <Plus className="w-5 h-5" /> ADD PRESCRIPTION
                        </span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Card and Chart View */}
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-md -mr-32 -mt-32 blur-[100px] opacity-100" />

                        <div className="grid grid-cols-3 gap-6 mb-12 relative z-10">
                            {[
                                { label: 'Verified Taken', value: stats.taken, icon: CheckCircle, color: 'emerald' },
                                { label: 'Total Missed', value: stats.missed, icon: XCircle, color: 'rose' },
                                { label: 'Registry Streak', value: analytics?.medication_compliance?.current_streak || 0, icon: TrendingUp, color: 'blue' }
                            ].map((s, i) => (
                                <div key={i} className={`bg-${s.color}-600/5 dark:bg-${s.color}-600/10 rounded-md p-6 text-center border border-${s.color}-600/20 shadow-inner group py-8`}>
                                    <div className={`w-10 h-10 rounded-md bg-${s.color}-600/10 text-${s.color}-600 border border-${s.color}-600/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500`}>
                                        <s.icon className="w-5 h-5" />
                                    </div>
                                    <p className={`text-4xl font-black text-${s.color}-600 tracking-tighter tabular-nums leading-none`}>{s.value}</p>
                                    <p className={`text-[9px] font-black text-${s.color}-600/60 uppercase tracking-[0.2em] mt-4`}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                        {adherenceData.length > 0 && (
                            <div className="h-[120px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={adherenceData}>
                                        <Bar dataKey="taken" fill="rgb(16 185 129)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="missed" fill="rgb(244 63 94)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Med List */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] opacity-60 ml-1">Active Prescriptions</h3>
                        {medications.length === 0 ? (
                            <div className="bg-card border border-border rounded-md p-8 text-center">
                                <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-muted-foreground font-medium text-sm">No active medications</p>
                                <Button variant="link" className="text-primary text-sm font-bold" onClick={() => setShowAdd(true)}>Add Medication</Button>
                            </div>
                        ) : (
                            medications.map((med, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={med.id}
                                    className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 flex flex-col sm:flex-row items-center gap-6 hover:shadow-2xl hover:shadow-blue-600/5 transition-all border-l-4 group"
                                    style={{ borderLeftColor: med.color_tag || '#2563EB' }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-base font-black text-foreground truncate uppercase tracking-tight">{med.name}</h4>
                                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-md bg-blue-600/10 text-blue-600 border-transparent">{med.frequency}</Badge>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{med.dosage} • {med.scheduled_time || 'UNSCHEDULED'}</p>

                                        <div className="flex gap-2 mt-4 flex-wrap">
                                            {(med.logs || []).slice(0, 7).reverse().map((l, j) => (
                                                <div
                                                    key={j}
                                                    title={l.log_date}
                                                    className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-black border-2 transition-all hover:scale-110 shadow-inner ${l.status === 'taken'
                                                        ? 'bg-emerald-600/10 border-emerald-600/20 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                                                        : 'bg-rose-600/10 border-rose-600/20 text-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                                                        }`}
                                                >
                                                    {l.status === 'taken' ? '✓' : '×'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => onLog(med.id, 'missed')}
                                            variant="ghost"
                                            size="icon"
                                            className="h-12 w-12 rounded-[1rem] bg-secondary/50 text-rose-600 hover:bg-rose-600/10 hover:text-rose-600 border border-border/50 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] transition-all"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            onClick={() => onLog(med.id, 'taken')}
                                            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[1rem] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Verify Log
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600/50" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/20 rounded-md -mr-16 -mb-16 blur-3xl opacity-50" />
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/5 rounded-md flex items-center justify-center border border-white/10 shrink-0">
                                <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em] mb-2 opacity-80">AI Adherence Insight</p>
                                <p className="text-sm font-black tracking-tight leading-relaxed uppercase">
                                    {analytics?.medication_compliance?.consistency_score > 80
                                        ? "EXCELLENT ADHERENCE RECORDED. CONSISTENCY IS OPTIMIZING TISSUE HEALING PHASES."
                                        : "STAY CONSISTENT WITH PROTOCOL FOR OPTIMAL STABILIZATION."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-8 shadow-2xl">
                        <h3 className="text-[11px] font-black text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                            <XCircle className="w-5 h-5 text-rose-600" />
                            Missed Dose Registry
                        </h3>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {medications.flatMap(m => (m.logs || []).filter(l => l.status === 'missed')).length === 0 ? (
                                <p className="text-center text-muted-foreground/40 font-black text-[9px] py-10 uppercase tracking-[0.3em]">Perfect Adherence Record</p>
                            ) : (
                                medications.flatMap(m => (m.logs || []).filter(l => l.status === 'missed').map(l => ({ ...l, name: m.name })))
                                    .sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
                                    .slice(0, 10)
                                    .map((l, i) => (
                                        <div key={i} className="p-4 bg-rose-600/5 dark:bg-rose-600/10 border border-rose-600/20 rounded-md flex items-center justify-between group hover:bg-rose-600/10 transition-colors">
                                            <div>
                                                <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{l.name}</p>
                                                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-1.5 opacity-80">
                                                    {new Date(l.log_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="bg-card/90 backdrop-blur-3xl border border-border w-full max-w-md rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600" />
                            <h3 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tighter">Register Prescription</h3>
                            <p className="text-[10px] text-muted-foreground font-black mb-10 uppercase tracking-[0.25em] opacity-60">Define medication protocol details</p>

                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 mb-3 block opacity-60">Medication Name</label>
                                    <Input
                                        value={newMed.name}
                                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                                        placeholder="e.g. Augmentin 625mg"
                                        className="h-14 bg-secondary/30 border-2 border-border focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all rounded-md font-black placeholder:text-muted-foreground/20 uppercase"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 mb-3 block opacity-60">Dosage</label>
                                        <Input
                                            value={newMed.dosage}
                                            onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                            placeholder="1 Tablet"
                                            className="h-14 bg-secondary/30 border-2 border-border focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all rounded-md font-black placeholder:text-muted-foreground/20 uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 mb-3 block opacity-60">Frequency</label>
                                        <Input
                                            value={newMed.frequency}
                                            onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                            placeholder="Twice Daily"
                                            className="h-14 bg-secondary/30 border-2 border-border focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all rounded-md font-black placeholder:text-muted-foreground/20 uppercase"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-12">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAdd(false)}
                                    className="flex-1 h-14 rounded-md font-black uppercase text-[10px] tracking-[0.2em] bg-secondary hover:bg-secondary/80 transition-all"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAdd}
                                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                                >
                                    Apply protocol
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Habit Tracker View ─────────────────────────────────────────────────────

const HabitTrackerView = ({ analytics, habitAnalytics, onLog, onBack }) => {
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        tobacco_count: '',
        areca_count: '',
        craving_level: '3',
        mood_score: '5',
        trigger_type: 'Stress'
    })

    const stats = habitAnalytics?.stats || { current_avg: 0, reduction_percent: 0 }
    const streaks = analytics?.tobacco_free || { current_streak: 0, longest_streak: 0, consistency_score: 0 }
    const history = habitAnalytics?.daily_logs || []

    const chartData = useMemo(() => {
        return history.slice(-14).map(d => ({
            date: new Date(d.log_date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            tobacco: parseInt(d.tobacco) || 0,
            areca: parseInt(d.areca) || 0
        }))
    }, [history])

    const handleLog = async () => {
        setIsSaving(true)
        try {
            await onLog({
                tobacco_count: parseInt(formData.tobacco_count) || 0,
                areca_count: parseInt(formData.areca_count) || 0,
                craving_level: parseInt(formData.craving_level),
                mood_score: parseInt(formData.mood_score),
                trigger_type: formData.trigger_type
            })
            setFormData({ ...formData, tobacco_count: '', areca_count: '' })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-12">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <button onClick={onBack} className="flex items-center gap-2.5 text-muted-foreground/60 hover:text-amber-600 font-black text-[10px] uppercase tracking-[0.25em] transition-all mb-4 group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1.5 transition-transform" />
                        Back to Registry
                    </button>
                    <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Habit <span className="text-amber-600">Recovery</span></h2>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-4 opacity-60">Personalized cessation protocol and neural monitoring.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-card/80 backdrop-blur-xl border border-border p-6 rounded-md shadow-2xl text-center min-w-[140px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[4px] bg-emerald-600" />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-3 opacity-60">Status</p>
                        <p className="text-xl font-black text-emerald-600 leading-none tracking-widest">ACTIVE</p>
                    </div>
                    <div className="bg-card/80 backdrop-blur-xl border border-border p-6 rounded-md shadow-2xl text-center min-w-[140px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[4px] bg-amber-600" />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-3 opacity-60">Reduction</p>
                        <p className="text-xl font-black text-amber-600 leading-none tracking-tighter tabular-nums">{stats.reduction_percent}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Streak Card */}
                <div className="md:col-span-2 bg-zinc-950 border border-zinc-900 rounded-md p-10 text-white relative overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 left-0 right-0 h-[5px] bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/10 rounded-md -mr-40 -mb-40 blur-[120px] group-hover:bg-amber-600/20 transition-all duration-700" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-6">
                            <div>
                                <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-80">Current Recovery Mastery</p>
                                <h3 className="text-7xl font-black flex items-baseline gap-3 tracking-tighter tabular-nums">
                                    {streaks.current_streak}
                                    <span className="text-sm font-black text-zinc-500 uppercase tracking-[0.25em]">Days Clean</span>
                                </h3>
                            </div>
                            <div className="flex items-center gap-10 pt-8 border-t border-white/5">
                                <div>
                                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5">Personal Best</p>
                                    <p className="text-2xl font-black text-white tabular-nums">{streaks.longest_streak}d</p>
                                </div>
                                <div className="w-px h-10 bg-white/5" />
                                <div>
                                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5">Consistency</p>
                                    <p className="text-2xl font-black text-amber-500 tabular-nums">{streaks.consistency_score}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <div className="relative w-40 h-40">
                                <div className="absolute inset-0 bg-amber-600/10 blur-[40px] rounded-md animate-pulse" />
                                <svg className="w-full h-full transform -rotate-90 relative z-10">
                                    <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                    <motion.circle
                                        cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" strokeDasharray={465}
                                        initial={{ strokeDashoffset: 465 }}
                                        animate={{ strokeDashoffset: 465 - (465 * (streaks.consistency_score / 100)) }}
                                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                                        strokeLinecap="round" fill="transparent" className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                    <Flame className="w-10 h-10 text-amber-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insight Card */}
                <div className="bg-card/80 backdrop-blur-xl border-2 border-amber-600/20 rounded-md p-8 relative overflow-hidden group shadow-2xl shadow-amber-600/5">
                    <div className="absolute top-0 right-0 p-6">
                        <Sparkles className="w-7 h-7 text-amber-600/30 group-hover:scale-125 group-hover:text-amber-600 transition-all duration-500" />
                    </div>
                    <div className="space-y-6">
                        <div className="w-14 h-14 bg-amber-600/10 rounded-md flex items-center justify-center text-amber-600 border border-amber-600/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Brain className="w-7 h-7" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3 opacity-60">Recovery Insight</h4>
                            <p className="text-lg font-black text-foreground leading-tight tracking-tight uppercase">
                                "ABSTINENCE INCREASES TISSUE OXYGENATION BY 40%. CRITICAL FOR PREVENTING COMPLICATIONS."
                            </p>
                        </div>
                        <div className="pt-6 flex items-center gap-3 border-t border-border/50">
                            <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-md border-4 border-card bg-amber-600/10 flex items-center justify-center shadow-lg">
                                        <CheckCircle className="w-4 h-4 text-amber-600" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest opacity-60">3 Verified Goals Today</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Input Form (5 cols) */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 right-0 h-[4px] bg-amber-600" />
                        <div className="bg-secondary/20 border-b border-border p-8 flex items-center justify-between">
                            <h3 className="text-base font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                                <Zap className="w-5 h-5 text-amber-600" /> Log Progress Node
                            </h3>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 tabular-nums">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-60">Cigarettes Registry</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={formData.tobacco_count}
                                            onChange={(e) => setFormData({ ...formData, tobacco_count: e.target.value })}
                                            placeholder="00"
                                            className="h-16 text-3xl font-black bg-secondary/30 border-2 border-border focus:border-amber-600 focus:ring-8 focus:ring-amber-600/5 rounded-md pr-14 tabular-nums"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                                            <Wind className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-60">Areca Registry</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={formData.areca_count}
                                            onChange={(e) => setFormData({ ...formData, areca_count: e.target.value })}
                                            placeholder="00"
                                            className="h-16 text-3xl font-black bg-secondary/30 border-2 border-border focus:border-amber-600 focus:ring-8 focus:ring-amber-600/5 rounded-md pr-14 tabular-nums"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-border/50">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Craving Intensity Matrix</label>
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-600/10 px-3 py-1 rounded-md uppercase tracking-widest shadow-inner">LEVEL {formData.craving_level}</span>
                                    </div>
                                    <div className="relative h-4 bg-secondary rounded-md overflow-hidden border border-border/50 p-1">
                                        <motion.div
                                            className="h-full bg-amber-600 rounded-md shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                                            animate={{ width: `${formData.craving_level * 10}%` }}
                                        />
                                        <input
                                            type="range" min="1" max="10"
                                            value={formData.craving_level}
                                            onChange={(e) => setFormData({ ...formData, craving_level: e.target.value })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-4">
                                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">MINIMAL</span>
                                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">CRITICAL</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Neural Mood Score</label>
                                        <div className="flex gap-2">
                                            {[1, 3, 5, 7, 10].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setFormData({ ...formData, mood_score: v })}
                                                    className={`flex-1 h-12 rounded-[1rem] font-black text-xs transition-all border-2 ${formData.mood_score == v ? 'bg-amber-600 text-white border-transparent shadow-xl shadow-amber-600/20' : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-amber-600/20'}`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Primary Trigger Node</label>
                                        <select
                                            value={formData.trigger_type}
                                            onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                                            className="w-full h-12 rounded-[1rem] bg-secondary/50 border-2 border-transparent focus:border-amber-600/20 text-xs font-black text-foreground px-4 outline-none transition-all uppercase tracking-widest"
                                        >
                                            <option>Stress</option>
                                            <option>Social</option>
                                            <option>Routine</option>
                                            <option>Boredom</option>
                                            <option>Hunger</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleLog}
                                disabled={isSaving}
                                className="w-full h-20 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-md shadow-[0_20px_40px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all mt-6 overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full duration-1000 transition-transform -translate-x-full" />
                                {isSaving ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                                    <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-[0.3em]">
                                        <CheckCircle className="w-7 h-7" />
                                        <span>Synchronize Daily Registry</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: History & Visualization (7 cols) */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                    {/* Charts Card */}
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[5px] bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                                    <TrendingUp className="w-6 h-6 text-amber-600" /> Usage Registry
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-3 opacity-60">Neural Consumption Mapping</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                    <div className="w-2.5 h-2.5 rounded-md bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.4)]" /> Tobacco
                                </span>
                                <span className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                    <div className="w-2.5 h-2.5 rounded-md bg-secondary" /> Areca
                                </span>
                            </div>
                        </div>

                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-border/40" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                                        className="text-muted-foreground/60"
                                        dy={20}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }}
                                        className="text-muted-foreground/60"
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(245,158,11,0.05)', radius: [12, 12, 0, 0] }}
                                        contentStyle={{ backgroundColor: 'var(--card)', backdropFilter: 'blur(16px)', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '16px' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                        labelStyle={{ color: 'var(--muted-foreground)', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.2em' }}
                                    />
                                    <Bar
                                        dataKey="tobacco"
                                        fill="#D97706"
                                        radius={[6, 6, 0, 0]}
                                        barSize={24}
                                        animationDuration={1500}
                                    />
                                    <Bar
                                        dataKey="areca"
                                        fill="var(--secondary)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={24}
                                        animationDuration={2000}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Interaction Timeline */}
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md overflow-hidden shadow-2xl relative">
                        <div className="p-8 border-b border-border flex items-center justify-between bg-amber-600/5">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.25em] flex items-center gap-3">
                                <History className="w-5 h-5 text-amber-600" /> Interaction Timeline
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-border bg-card px-4 py-1.5">{history.length} SYNCED ENTRIES</Badge>
                        </div>
                        <div className="divide-y divide-border/50">
                            {history.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-secondary/50 rounded-md flex items-center justify-center text-muted-foreground/30 mx-auto mb-6">
                                        <Info className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black text-muted-foreground uppercase opacity-60 tracking-[0.3em]">No Registry Entries Recorded</p>
                                </div>
                            ) : (
                                [...history].reverse().slice(0, 5).map((h, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={i}
                                        className="p-6 hover:bg-amber-600/5 transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`p-4 rounded-md transition-all shadow-inner ${parseInt(h.tobacco) > 0 ? 'bg-rose-600/10 text-rose-600' : 'bg-emerald-600/10 text-emerald-600'}`}>
                                                {parseInt(h.tobacco) > 0 ? <Zap className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-foreground tracking-tight uppercase">
                                                    {parseInt(h.tobacco) > 0 ? `${h.tobacco} CIGARETTES RECORDED` : 'ABSTINENCE VERIFIED'}
                                                </p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1.5">
                                                    {new Date(h.log_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 tracking-widest opacity-60">Craving</p>
                                                <p className="text-xs font-black text-foreground tabular-nums">{h.avg_craving || '0'}</p>
                                            </div>
                                            <div className="w-px h-10 bg-border/50" />
                                            <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-3 py-1 ring-4 ring-amber-600/5 border-amber-600/20">
                                                {h.trigger_type || 'STABLE'}
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const HealthTrackers = () => {
    const { user } = useAuth()
    const { isCollapsed } = useSidebar()
    const navigate = useNavigate()

    const {
        analytics, mouthHistory, medications, habitAnalytics, isLoading,
        logMouthOpening, logHabitEntry, logMed, addNewMed, removeMed, refresh
    } = useHealthTrackers()

    const [activeView, setActiveView] = useState('dashboard')

    if (isLoading && !analytics) {
        return (
            <div className="flex h-screen bg-background font-sans overflow-hidden">
                <PatientSidebar />
                <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative overflow-y-auto h-screen`}>
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Loading health data...</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden transition-colors duration-500">
            <PatientSidebar />

            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative h-screen overflow-hidden`}>

                {/* HEADER */}
                <header className="z-40 bg-card/80 backdrop-blur-xl border-b border-border shrink-0">
                    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
                        <div className="h-16 sm:h-20 flex items-center justify-between gap-6">
                            {/* Left: Title */}
                            <div className="flex items-center gap-6 min-w-0">
                                <PatientSidebarTrigger />
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter leading-none uppercase">Health <span className="text-blue-600">Trackers</span></h1>
                                    <div className="text-[10px] text-muted-foreground font-black mt-2 hidden sm:flex items-center gap-3 uppercase tracking-widest opacity-60">
                                        <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                        Neural Registry Active
                                        <span className="w-1 h-1 rounded-md bg-border" />
                                        Clinical Portal
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-4 sm:gap-6">
                                <NotificationBell />
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-center gap-3.5 pl-1.5 pr-4 py-1.5 rounded-md border-2 border-border bg-card/50 hover:border-blue-600/30 transition-all cursor-pointer shadow-sm"
                                    onClick={() => navigate('/patient/profile')}
                                >
                                    <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
                                        {user?.full_name?.charAt(0)}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs font-black text-foreground leading-none uppercase tracking-tight">{user?.full_name?.split(' ')[0]}</p>
                                        <p className="text-[9px] font-black text-blue-600 mt-1.5 uppercase tracking-[0.2em] opacity-80">Registry ID: {String(user?.id || '').slice(0, 8)}</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <div className="flex-1 overflow-y-auto relative">
                    {/* Theme-aware grid background decorative element */}
                    <div className="absolute inset-0 bg-[grid_var(--border)_24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

                    <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 relative z-10">
                        <AnimatePresence mode="wait">
                            {activeView === 'dashboard' && (
                                <motion.div
                                    key="dashboard"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <DashboardOverview
                                        analytics={analytics}
                                        mouthHistory={mouthHistory}
                                        medications={medications}
                                        navigate={navigate}
                                        onNavigate={(view) => {
                                            if (view === 'mouth') {
                                                navigate('/patient/mouth-opening')
                                            } else {
                                                setActiveView(view)
                                            }
                                        }}
                                    />
                                </motion.div>
                            )}

                            {activeView === 'meds' && (
                                <motion.div
                                    key="meds"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <MedTrackerView
                                        medications={medications}
                                        analytics={analytics}
                                        onLog={logMed}
                                        onAdd={addNewMed}
                                        onDelete={removeMed}
                                        onBack={() => setActiveView('dashboard')}
                                    />
                                </motion.div>
                            )}

                            {activeView === 'habit' && (
                                <motion.div
                                    key="habit"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <HabitTrackerView
                                        analytics={analytics}
                                        habitAnalytics={habitAnalytics}
                                        onLog={logHabitEntry}
                                        onBack={() => setActiveView('dashboard')}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </main>
        </div>
    )
}

export default HealthTrackers
