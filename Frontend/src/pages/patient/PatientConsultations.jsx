import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Calendar,
    Clock,
    ChevronRight,
    Activity,
    User,
    MapPin,
    RefreshCcw,
    Stethoscope,
    ChevronLeft,
    Loader2,
    Sparkles,
    CheckCircle,
    AlertCircle,
    ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import api from '@/services/api'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import NotificationBell from '@/components/NotificationBell'
import { Badge } from '@/components/ui/badge'

const StatCard = ({ title, value, subtext, icon: Icon, accent, trend }) => {
    const accents = {
        blue: { bg: 'bg-blue-600/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-600/20 dark:border-zinc-800/50', bar: 'bg-blue-600' },
    }
    const t = accents.blue

    return (
        <div className="bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-100 dark:border-zinc-800/50 rounded-md p-6 sm:p-7 hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-600/30 transition-all duration-300 group relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[4px] ${t.bar} shadow-[0_0_10px_rgba(37,99,235,0.2)] opacity-80 group-hover:opacity-100 transition-opacity`} />

            <div className="flex items-start justify-between mb-5">
                <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border shadow-inner group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1.5">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none tabular-nums">{value}</h3>
            </div>
            <p className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em] mb-5">{title}</p>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-black flex items-center gap-2.5 uppercase tracking-widest">
                    <span className={`w-2 h-2 rounded-md ${t.bar} animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]`} />
                    {subtext}
                </p>
            </div>
        </div>
    )
}

const PatientConsultations = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { isCollapsed } = useSidebar()

    const [requests, setRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchText, setSearchText] = useState("")
    const [selectedFilter, setSelectedFilter] = useState("ALL")

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setIsLoading(true)
                const res = await api.get(`/get_consultation_requests?role=PATIENT&id=${user.id}`)
                if (res.data?.status === 'success') {
                    setRequests(res.data.data)
                }
            } catch (error) {
                console.error("Failed to fetch requests", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (user?.id) fetchRequests()
    }, [user?.id])

    const filteredRequests = requests.filter(req => {
        const dentistName = (req.dentist_name || "").toLowerCase()
        const clinicName = (req.clinic_name || "").toLowerCase()
        const searchL = searchText.toLowerCase()

        const matchesSearch = searchText === "" || dentistName.includes(searchL) || clinicName.includes(searchL)
        const matchesFilter = selectedFilter === "ALL" || req.status === selectedFilter

        return matchesSearch && matchesFilter
    })

    const filters = ["ALL", "PENDING", "APPROVED", "REJECTED", "COMPLETED"]

    const stats = {
        total: requests.length,
        approved: requests.filter(r => r.status?.toUpperCase() === 'APPROVED').length,
        pending: requests.filter(r => r.status?.toUpperCase() === 'PENDING').length,
        completed: requests.filter(r => r.status?.toUpperCase() === 'COMPLETED' || r.visit_status?.toUpperCase() === 'COMPLETED').length
    }

    const getStatusTheme = (status, visitStatus, isRescheduled) => {
        const reqStr = status?.toUpperCase() || ''
        const visStr = visitStatus?.toUpperCase() || ''

        if (reqStr === 'REJECTED') {
            return { label: 'Rejected', color: 'bg-rose-600/10 text-rose-500 border-rose-600/20', dot: 'bg-rose-500' }
        }
        if (reqStr === 'COMPLETED') {
            return { label: 'Completed', color: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20', dot: 'bg-emerald-500' }
        }
        if (reqStr === 'APPROVED') {
            if (isRescheduled) return { label: 'Rescheduled', color: 'bg-indigo-600/10 text-indigo-500 border-indigo-600/20', dot: 'bg-indigo-500' }
            if (visStr === 'IN_PROGRESS' || visStr === 'IN CHAIR') return { label: 'In Chair', color: 'bg-purple-600/10 text-purple-500 border-purple-600/20', dot: 'bg-purple-500' }
            return { label: 'Approved', color: 'bg-blue-600/10 text-blue-500 border-blue-600/20', dot: 'bg-blue-500' }
        }
        if (reqStr === 'PENDING') {
            return { label: 'Pending', color: 'bg-orange-600/10 text-orange-500 border-orange-600/20', dot: 'bg-orange-500' }
        }

        // Fallbacks for any strange edge cases:
        if (visStr === 'VISITED' || visStr === 'COMPLETED') return { label: 'Completed', color: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20', dot: 'bg-emerald-500' }
        if (visStr === 'POSTPONED') return { label: 'Postponed', color: 'bg-orange-600/10 text-orange-500 border-orange-600/20', dot: 'bg-orange-500' }

        return { label: status || 'Pending', color: 'bg-secondary text-muted-foreground border-border', dot: 'bg-muted-foreground' }
    }

    return (
        <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden text-slate-900 dark:text-white transition-colors duration-500">
            <PatientSidebar />

            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative h-screen overflow-hidden`}>
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none opacity-100 shadow-inner"
                    style={{ backgroundImage: `radial-gradient(var(--border) 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />

                {/* ═══ HEADER ═══ */}
                <header className="z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
                    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
                            {/* Left: Title */}
                            <div className="flex items-center gap-3 min-w-0">
                                <PatientSidebarTrigger />
                                <div className="min-w-0">
                                    <h1 className="text-sm sm:text-lg font-black text-foreground tracking-tight leading-none uppercase">Consultation Hub</h1>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5 hidden sm:flex items-center gap-2">
                                        <span className="text-blue-600 flex items-center gap-1.5 leading-none">
                                            <Activity className="w-3.5 h-3.5" />
                                            Clinical Intelligence
                                        </span>
                                        <span className="opacity-20">/</span>
                                        <span>Case Manager</span>
                                    </p>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 sm:gap-4">
                                <NotificationBell color="blue" />
                                <div className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-md border border-border bg-secondary/50 hover:bg-blue-600/10 hover:border-blue-600/20 transition-all cursor-pointer group" onClick={() => navigate('/patient/profile')}>
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                        {user?.full_name?.charAt(0)}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-[11px] font-black text-foreground leading-none uppercase tracking-tight">{user?.full_name?.split(' ')[0]}</p>
                                        <p className="text-[9px] font-black text-blue-500 mt-1 uppercase tracking-widest opacity-80">Unit-X01</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ═══ MAIN CONTENT ═══ */}
                <div className="flex-1 overflow-y-auto relative bg-background">
                    {/* Subtle grid pattern without aggressive masking */}
                    <div className="absolute inset-0 bg-[grid_var(--border)_24px_24px] opacity-[0.03] pointer-events-none" />

                    <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* KPI Stats */}
                            {!isLoading && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                                    <StatCard
                                        title="Total Consults"
                                        value={stats.total}
                                        subtext="All recorded requests"
                                        icon={Activity}
                                        accent="blue"
                                    />
                                    <StatCard
                                        title="Approved"
                                        value={stats.approved}
                                        subtext="Ready for scheduling"
                                        icon={CheckCircle}
                                        accent="blue"
                                    />
                                    <StatCard
                                        title="Pending Action"
                                        value={stats.pending}
                                        subtext="Awaiting response"
                                        icon={Clock}
                                        accent="amber"
                                    />
                                    <StatCard
                                        title="Completed"
                                        value={stats.completed}
                                        subtext="Finished consultations"
                                        icon={CheckCircle}
                                        accent="emerald"
                                    />
                                </div>
                            )}

                            {/* Search and Filters */}
                            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-card p-5 sm:p-6 rounded-md border border-border shadow-sm">
                                <div className="relative w-full lg:w-96 group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search registry indices..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="w-full pl-14 pr-6 h-12 bg-secondary/80 border border-border rounded-md text-xs font-black uppercase tracking-[0.2em] focus:ring-8 focus:ring-blue-600/10 focus:border-blue-500/50 transition-all placeholder:text-muted-foreground outline-none shadow-sm"
                                    />
                                </div>
                                <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 no-scrollbar items-center">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mr-3 hidden sm:block opacity-50">Filter Registry:</p>
                                    {filters.map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setSelectedFilter(filter)}
                                            className={`px-6 py-3 rounded-md text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap border ${selectedFilter === filter
                                                ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/30'
                                                : 'bg-secondary text-muted-foreground border-border hover:bg-card hover:text-foreground'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Request List */}
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-blue-600 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest">Gathering records...</p>
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="bg-card/50 backdrop-blur-md border border-border border-dashed rounded-md py-24 flex flex-col items-center justify-center text-center">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-md" />
                                        <div className="relative w-20 h-20 bg-secondary border border-border rounded-md flex items-center justify-center">
                                            <Search className="w-8 h-8 text-blue-600" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-3 uppercase tracking-tight">Vault Empty</h3>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground max-w-sm leading-relaxed opacity-60">
                                        {searchText ? "No clinical records matched your current query." : "Your consultation registry is currently empty."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                    <AnimatePresence>
                                        {filteredRequests.map((req, index) => {
                                            const isRescheduled = !!req.rescheduled_from
                                            const theme = getStatusTheme(req.status, req.visit_status, isRescheduled)
                                            const isClickable = ['APPROVED', 'COMPLETED'].includes(req.status) ||
                                                ['scheduled', 'in_progress', 'visited', 'arrived'].includes(req.visit_status?.toLowerCase())
                                            const hasPostponement = req.original_date !== null && req.original_date !== undefined

                                            return (
                                                <motion.div
                                                    key={req.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => {
                                                        if (isClickable) navigate(`/patient/consultation/${req.id}`)
                                                    }}
                                                    className={`bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 sm:p-7 flex flex-col relative overflow-hidden group transition-all duration-300 ${isClickable ? 'cursor-pointer hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-600/30' : 'opacity-80'}`}
                                                >
                                                    <div className={`absolute top-0 left-0 right-0 h-[4px] ${theme.dot} opacity-80`} />

                                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-md ${theme.color.split(' ')[0]} ${theme.color.split(' ')[1]} flex items-center justify-center border-2 ${theme.color.split(' ')[2]} shrink-0 text-xs font-black uppercase shadow-inner`}>
                                                                {req.dentist_name?.charAt(0) || 'D'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="text-sm sm:text-base font-black text-foreground leading-none uppercase tracking-tight truncate">Dr. {req.dentist_name || 'Dentist'}</h3>
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] mt-2 flex items-center gap-1.5 opacity-70">
                                                                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> {req.clinic_name || 'Clinic'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-8 bg-secondary/50 p-4 rounded-md border border-border/60">
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1.5 tracking-widest opacity-60">
                                                                <Calendar className="w-3.5 h-3.5" /> Date
                                                            </span>
                                                            <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                                                                {req.scheduled_date ? new Date(req.scheduled_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unscheduled'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1.5 tracking-widest opacity-60">
                                                                <Clock className="w-3.5 h-3.5" /> Timeline
                                                            </span>
                                                            <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                                                                {req.scheduled_time || 'TBD'} <span className="text-blue-500 opacity-60">({req.duration_minutes ? `${req.duration_minutes}m` : 'Std'})</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center mb-4 mt-auto">
                                                        <span className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 shadow-sm ${theme.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-md ${theme.dot} animate-pulse`} />
                                                            {theme.label}
                                                        </span>
                                                        {isClickable && (
                                                            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                                                                Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {hasPostponement && (
                                                        <div className="pt-4 border-t border-border mt-3">
                                                            <p className="text-[9px] font-black text-orange-600 flex items-center gap-2 mb-2 uppercase tracking-widest">
                                                                <RefreshCcw className="w-3.5 h-3.5" /> Shifted Node
                                                            </p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-relaxed opacity-70">
                                                                Moved from {new Date(req.original_date).toLocaleDateString()} to {req.scheduled_date ? new Date(req.scheduled_date).toLocaleDateString() : 'TBD'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    </main>
                </div>
            </main>
        </div>
    )
}

export default PatientConsultations
