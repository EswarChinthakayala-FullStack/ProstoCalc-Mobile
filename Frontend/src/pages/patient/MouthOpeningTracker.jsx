import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Activity, TrendingUp, History, Calendar, Plus, ChevronRight,
    ArrowLeft, Search, Loader2, CheckCircle, Lock, ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
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

// ─── StatCard Component (matching PatientConsultations style) ────────────────────

const StatCard = ({ title, value, subtext, icon: Icon, accent }) => {
    const accents = {
        teal: { bg: 'bg-primary/5', text: 'text-primary', border: 'border-primary/10', bar: 'bg-primary' },
        amber: { bg: 'bg-primary/5', text: 'text-primary', border: 'border-primary/10', bar: 'bg-primary' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', bar: 'bg-indigo-500' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
        blue: { bg: 'bg-blue-600/10', text: 'text-blue-500', border: 'border-blue-600/20', bar: 'bg-blue-600' },
        rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', bar: 'bg-rose-500' },
        slate: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20', bar: 'bg-slate-500' },
    }
    const t = accents[accent] || accents.blue

    return (
        <div className="bg-card border border-border rounded-md p-5 sm:p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-200 group relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

            <div className="flex items-start justify-between mb-5">
                <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none group-hover:text-blue-500 transition-colors uppercase tracking-tight">{value}</h3>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">{title}</p>

            <div className="pt-3 border-t border-border">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-md ${t.bar} opacity-50`} />
                    {subtext}
                </p>
            </div>
        </div>
    )
}

// ─── Main Mouth Opening Tracker Page ────────────────────────────────────────────

const MouthOpeningTracker = () => {
    const { user } = useAuth()
    const { isCollapsed } = useSidebar()
    const navigate = useNavigate()

    const { mouthHistory, analytics, logMouthOpening, isLoading } = useHealthTrackers()

    const [val, setVal] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [selectedFilter, setSelectedFilter] = useState('ALL')

    // Get filtered history based on selected filter
    const getFilteredHistory = () => {
        if (selectedFilter === 'ALL') return mouthHistory;

        const now = new Date();
        const filtered = mouthHistory.filter(h => {
            const entryDate = new Date(h.entry_date);
            const daysDiff = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24));

            switch (selectedFilter) {
                case 'WEEK': return daysDiff <= 7;
                case 'MONTH': return daysDiff <= 30;
                case 'QUARTER': return daysDiff <= 90;
                case 'YEAR': return daysDiff <= 365;
                default: return true;
            }
        });
        return filtered;
    }

    const filteredHistory = getFilteredHistory();

    // Check if user has already logged entry today
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const todayEntry = mouthHistory.find(h => {
        const entryDate = new Date(h.entry_date).toISOString().split('T')[0];
        return entryDate === todayDateStr;
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
        await logMouthOpening(val)
        setIsSaving(false)
        setVal('')
    }

    const handleBack = () => {
        navigate('/patient/trackers')
    }

    const chartData = useMemo(() => {
        return mouthHistory.slice(-14).map(h => ({
            date: new Date(h.entry_date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            value: h.value_mm
        }))
    }, [mouthHistory]);

    const stats = useMemo(() => {
        if (mouthHistory.length === 0) return { avg: 0, peak: 0, growth: 0 };
        const values = mouthHistory.map(h => h.value_mm);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        const peak = Math.max(...values);
        const prev = values.length > 1 ? values[values.length - 2] : values[0];
        const latest = values[values.length - 1];
        const growth = latest - prev;
        return { avg, peak, growth };
    }, [mouthHistory]);

    if (isLoading && !mouthHistory) {
        return (
            <div className="flex h-screen bg-background font-sans overflow-hidden">
                <PatientSidebar />
                <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative overflow-y-auto h-screen`}>
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-center">Loading mouth opening data...</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden text-foreground">
            <PatientSidebar />

            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative h-screen overflow-hidden`}>

                {/* HEADER */}
                <header className="z-40 bg-card/95 backdrop-blur-sm border-b border-border shrink-0">
                    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
                            {/* Left: Title */}
                            <div className="flex items-center gap-3 min-w-0">
                                <PatientSidebarTrigger />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleBack}
                                            className="hidden xl:flex w-8 h-8 bg-secondary border border-border rounded-md items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-600/10 transition-all active:scale-95 shrink-0"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-none">Mouth Opening Tracker</h1>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <NotificationBell color="blue" />
                                <div className="flex items-center gap-2.5 pl-1 pr-2 sm:pr-3 py-1 rounded-md border border-border bg-card hover:border-blue-500/20 hover:bg-blue-600/5 transition-all cursor-pointer" onClick={() => navigate('/patient/profile')}>
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {user?.full_name?.charAt(0)}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs font-semibold text-foreground leading-none">{user?.full_name?.split(' ')[0]}</p>
                                        <p className="text-[9px] font-black text-blue-500 mt-1 uppercase tracking-widest">Patient</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <div className="flex-1 overflow-y-auto">
                    <div className="absolute inset-0 bg-[grid_var(--border)_24px_24px] opacity-100 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
                    <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Header Area */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Mouth Opening <span className="text-blue-600">Tracker</span></h2>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px] opacity-70 mt-1">Monitor your recovery progress and physio stability.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Today's Protocol</span>
                                        <Badge className={`${todayEntry ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-600/10 text-blue-500 border-blue-500/20'} px-3 py-1 font-black uppercase tracking-widest text-[9px]`}>
                                            {todayEntry ? 'Completed Today' : 'Ready to Log'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Insights Row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                                <StatCard
                                    title="Average"
                                    value={stats.avg}
                                    subtext="mm average"
                                    icon={Activity}
                                    accent="blue"
                                />
                                <StatCard
                                    title="Peak Record"
                                    value={stats.peak}
                                    subtext="Best reading"
                                    icon={TrendingUp}
                                    accent="indigo"
                                />
                                <StatCard
                                    title="Growth"
                                    value={`${stats.growth >= 0 ? '+' : ''}${stats.growth}`}
                                    subtext="Change"
                                    icon={ArrowRight}
                                    accent={stats.growth >= 0 ? 'emerald' : 'rose'}
                                />
                                <StatCard
                                    title="Total Logs"
                                    value={mouthHistory.length}
                                    subtext="All entries"
                                    icon={History}
                                    accent="slate"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Measurement Entry - Left (4 cols) */}
                                <div className="lg:col-span-4 space-y-6">
                                    {/* Today's Entry Status Card */}
                                    <div className={`relative overflow-hidden rounded-md border transition-all duration-500 ${hasLoggedToday
                                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                        : 'bg-card border-border shadow-xl shadow-black/5'}`}>
                                        {/* Decorative Elements */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-md -mr-16 -mt-16 transition-transform duration-500 opacity-20 ${hasLoggedToday ? 'bg-emerald-500/20' : 'bg-blue-500/10'}`} />
                                        <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-md -ml-12 -mb-12 opacity-10 ${hasLoggedToday ? 'bg-green-500/20' : 'bg-blue-500/10'}`} />

                                        <div className="relative z-10 p-5 sm:p-6">
                                            {/* Status Badge */}
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${hasLoggedToday
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                        : 'bg-blue-600/10 text-blue-500 border border-blue-500/20'}`}>
                                                        {hasLoggedToday ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Clinical Status</p>
                                                        <p className={`text-sm font-black uppercase tracking-tight ${hasLoggedToday ? 'text-emerald-500' : 'text-foreground'}`}>
                                                            {hasLoggedToday ? 'Entry Compiled' : 'Daily Registry'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Current Value Display */}
                                            <div className={`mb-5 p-3 rounded-md ${hasLoggedToday
                                                ? 'bg-emerald-500/5 border border-emerald-500/10'
                                                : 'bg-secondary/50 border border-border'}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1 tracking-[0.2em]">
                                                        {hasLoggedToday ? "Registered Today" : 'Previous Baseline'}
                                                    </span>
                                                    {hasLoggedToday && (
                                                        <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Logged
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-4xl font-extrabold transition-all tracking-tighter ${hasLoggedToday ? 'text-emerald-500' : 'text-muted-foreground/30'}`}>
                                                        {hasLoggedToday ? todayEntry.value_mm : '--'}
                                                    </span>
                                                    <span className={`text-xs font-black uppercase tracking-widest ${hasLoggedToday ? 'text-emerald-500/50' : 'text-muted-foreground/20'}`}>mm</span>
                                                </div>
                                            </div>

                                            {/* Input Section */}
                                            {hasLoggedToday ? (
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-md p-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sync Disabled</span>
                                                    </div>
                                                    <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest leading-relaxed">
                                                        Daily measurement finalized. Great job staying consistent with your protocol!
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Daily Log (mm)</label>
                                                            <div className="relative mt-2">
                                                                <Input
                                                                    type="number"
                                                                    value={val}
                                                                    onChange={(e) => setVal(e.target.value)}
                                                                    placeholder="e.g. 42"
                                                                    className="h-16 text-2xl font-black bg-secondary/50 border-border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-md pr-20"
                                                                />
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                                    <span className="text-muted-foreground font-black text-xs tracking-widest opacity-50 uppercase">MM</span>
                                                                    <div className="w-px h-5 bg-border mx-1" />
                                                                    <Activity className="w-4 h-4 text-blue-500" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            onClick={handleSave}
                                                            disabled={!val || isSaving}
                                                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-md shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all group uppercase tracking-widest text-[11px]"
                                                        >
                                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                                <span className="flex items-center gap-2">
                                                                    Transmit Record <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Advice Card */}
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-md p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                            <Activity className="w-24 h-24" />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3">Clinical Perspective</h4>
                                        <p className="text-sm text-white font-black tracking-tight leading-relaxed mb-4">
                                            Consistently tracking your mouth opening helps clinicians tailor your recovery plan. Aim for 3 readings per day for a high-fidelity recovery map.
                                        </p>
                                        <div className="flex items-center gap-2 text-white/50">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Sync Active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart - Right (8 cols) */}
                                <div className="lg:col-span-8 bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Clinical Baseline</p>
                                            <h3 className="text-xl font-black text-foreground flex items-center gap-2 mt-1">
                                                <TrendingUp className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                                Recovery Trajectory
                                            </h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="border-border bg-secondary/30 font-black tracking-[0.2em] uppercase text-[9px] px-3 py-1">14-Day Session</Badge>
                                        </div>
                                    </div>

                                    <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorMouth" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 800 }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 800 }}
                                                    dx={-5}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--card)',
                                                        borderRadius: '16px',
                                                        border: '1px solid var(--border)',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                                        padding: '12px'
                                                    }}
                                                    itemStyle={{ fontSize: '13px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' }}
                                                    labelStyle={{ fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}
                                                    cursor={{ stroke: '#3b82f6', strokeDasharray: '5 5' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#3b82f6"
                                                    strokeWidth={4}
                                                    fillOpacity={1}
                                                    fill="url(#colorMouth)"
                                                    animationDuration={2000}
                                                    dot={{ r: 4, fill: 'var(--card)', stroke: '#3b82f6', strokeWidth: 2 }}
                                                    activeDot={{ r: 6, fill: '#3b82f6', stroke: 'var(--card)', strokeWidth: 2 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* History List */}
                            <div className="bg-card border border-border rounded-md p-6 shadow-sm">
                                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-widest opacity-80">
                                        <History className="w-4 h-4 text-blue-500" />
                                        Clinical Event Logs
                                    </h3>
                                    <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
                                        {['ALL', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'].map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setSelectedFilter(filter)}
                                                className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedFilter === filter
                                                    ? 'bg-blue-600/10 text-blue-500 border-blue-500/20 shadow-sm'
                                                    : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:border-muted-foreground/30'
                                                    }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                    {filteredHistory.length === 0 ? (
                                        <div className="col-span-full py-20 flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-secondary/50 border border-border rounded-md flex items-center justify-center mb-4">
                                                <Search className="w-6 h-6 text-muted-foreground/30" />
                                            </div>
                                            <h3 className="text-xl font-black text-foreground mb-2">No Clinical Data</h3>
                                            <p className="text-[11px] font-bold text-muted-foreground max-w-sm uppercase tracking-widest opacity-60">
                                                {selectedFilter !== 'ALL' ? "No protocol recordings matched your filter criteria." : "No clinical measurements detected in this repository."}
                                            </p>
                                        </div>
                                    ) : (
                                        [...filteredHistory].reverse().map((h, i) => {
                                            const entryDate = new Date(h.entry_date);
                                            const isToday = entryDate.toISOString().split('T')[0] === todayDateStr;

                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    key={i}
                                                    className={`bg-card border border-border rounded-md p-5 sm:p-6 flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:border-blue-500/20`}
                                                >
                                                    <div className={`absolute top-0 left-0 right-0 h-[3px] ${isToday ? 'bg-emerald-500' : 'bg-blue-600'}`} />

                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${isToday ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-600/10 text-blue-500 border-blue-500/20'}`}>
                                                                {isToday ? <CheckCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-black text-foreground leading-tight uppercase tracking-tight">{isToday ? "Today's Registry" : 'Diagnostic entry'}</h3>
                                                                <p className="text-[10px] font-black text-muted-foreground mt-1 flex items-center gap-1 uppercase tracking-widest opacity-60">
                                                                    {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-4 bg-secondary/30 p-3 rounded-md border border-border/50">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1 tracking-[0.2em]">
                                                                <Activity className="w-3 h-3" /> Reading
                                                            </span>
                                                            <span className="text-xs font-black text-foreground">
                                                                {h.value_mm} mm
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1 tracking-[0.2em]">
                                                                <TrendingUp className="w-3 h-3" /> Status
                                                            </span>
                                                            <span className={`text-xs font-black uppercase ${h.value_mm > 35 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                {h.value_mm > 35 ? 'Optimal' : 'Monitoring'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center mt-auto">
                                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black border flex items-center gap-1.5 uppercase transition-all ${isToday ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : h.value_mm > 35 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-md ${isToday ? 'bg-emerald-500' : h.value_mm > 35 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                                            {isToday ? 'Synced Today' : h.value_mm > 35 ? 'Optimal Stability' : 'Clinically Monitored'}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </main>
                </div>
            </main>
        </div>
    )
}

export default MouthOpeningTracker
