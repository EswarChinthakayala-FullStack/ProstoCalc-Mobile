import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    MessageSquare, FileText, History, StickyNote, ChevronLeft,
    MapPin, ShieldCheck, Calendar, Clock, Sparkles, Activity, Plus,
    CheckCircle2, RefreshCcw, CheckCircle, AlertOctagon, XCircle, TrendingUp, Zap, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { toast } from 'sonner'
import api from '@/services/api'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import NotificationBell from '@/components/NotificationBell'
import { Badge } from '@/components/ui/badge'

const HubTile = ({ title, subtitle, icon: Icon, color, onClick }) => {
    const palette = {
        blue: { bg: 'bg-blue-600/10', text: 'text-blue-500', border: 'border-blue-600/20', glow: 'shadow-blue-500/10' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10' },
        teal: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', glow: 'shadow-purple-500/10' },
    }
    const t = palette[color] || palette.blue

    return (
        <motion.button
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative w-full text-left p-6 sm:p-7 bg-card/80 backdrop-blur-xl rounded-md border border-border shadow-sm hover:shadow-xl ${t.glow} transition-all duration-300 group overflow-hidden`}
        >
            <div className="absolute -right-8 -top-8 pointer-events-none opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                <motion.svg width="140" height="140" viewBox="0 0 100 100" className={t.text}>
                    <motion.path
                        fill="currentColor"
                        d="M39.6,-49.4C52.7,-42.6,65.8,-32.8,71.7,-19.7C77.6,-6.5,76.2,10.2,69.5,25C62.8,39.9,50.7,52.9,36.5,58.3C22.2,63.7,5.8,61.4,-8.6,56.7C-23.1,51.9,-35.6,44.7,-46.8,33.9C-58,23.1,-67.9,8.7,-68.8,-6.2C-69.8,-21.2,-61.8,-36.8,-50,-44.6C-38.2,-52.4,-22.6,-52.4,-8.3,-50.2C6.1,-48.1,26.4,-56.3,39.6,-49.4Z"
                        transform="translate(50 50) scale(0.8)"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    />
                </motion.svg>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110 relative z-10 box-border border shadow-inner ${t.bg} ${t.text} ${t.border}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-black text-foreground leading-tight mb-1 relative z-10">{title}</h3>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10">{subtitle}</p>

            <div className={`absolute bottom-5 right-5 w-7 h-7 bg-card rounded-md border border-border flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm`}>
                <ChevronRight className={`w-3.5 h-3.5 ${t.text}`} />
            </div>
        </motion.button>
    )
}

const WorkflowStep = ({ label, description, done, last }) => (
    <div className="flex gap-4 sm:gap-6 relative">
        {!last && <div className={`absolute left-[17px] sm:left-[19px] top-10 bottom-0 w-[2px] ${done ? 'bg-blue-600/30' : 'bg-secondary'}`} />}
        <div className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-md flex items-center justify-center shrink-0 transition-all duration-500 box-border border-4 border-background z-10 ${done ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-4 ring-blue-600/10' : 'bg-secondary text-muted-foreground/30'}`}>
            {done ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-md bg-current opacity-60" />}
        </div>
        <div className="pb-8 sm:pb-10 pt-1.5 flex-1">
            <h4 className={`text-sm sm:text-base font-black ${done ? 'text-foreground' : 'text-muted-foreground/40'} tracking-tight leading-none uppercase`}>{label}</h4>
            <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest mt-2 leading-relaxed ${done ? 'text-muted-foreground opacity-80' : 'text-muted-foreground/20'}`}>{description}</p>
        </div>
    </div>
)

const StatItem = ({ label, value, colorClass }) => (
    <div className="flex flex-col gap-1">
        <p className={`text-xl sm:text-2xl font-black tabular-nums tracking-tighter ${colorClass}`}>
            {value}
        </p>
        <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground border-t border-border pt-1.5 uppercase tracking-widest whitespace-nowrap">
            {label}
        </p>
    </div>
)

const PatientConsultationOverview = () => {
    const { requestId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const { isCollapsed } = useSidebar()
    const isDesktop = useMediaQuery('(min-width: 1280px)')

    const [request, setRequest] = useState(null)
    const [plan, setPlan] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true)
                // Fetch basic request data first
                const reqs = await api.get(`/get_consultation_requests?role=PATIENT&id=${user.id}`)
                if (reqs.data?.status === 'success') {
                    const match = reqs.data.data.find(r => r.id.toString() === requestId)
                    setRequest(match)
                }

                // Fetch Plan Data
                const planData = await api.get(`/get_treatment_plan?request_id=${requestId}`)
                if (planData.data?.status === 'success') {
                    setPlan(planData.data.data)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        if (user?.id && requestId) fetchDetails()
    }, [user?.id, requestId])

    if (isLoading) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-blue-600 gap-4">
            <Activity className="w-10 h-10 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Syncing Diagnostic Node...</p>
        </div>
    }

    if (!request && !plan) {
        return <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <h1 className="text-xl font-bold uppercase tracking-tight text-muted-foreground">Record Not Found.</h1>
        </div>
    }

    // Resolve derived status identically to mobile
    const vStatus = plan?.visit_status || request?.visit_status
    const isRescheduled = !!(plan?.rescheduled_from || request?.rescheduled_from)
    const activeStatus = plan?.status || request?.status

    const getStatus = () => {
        if (vStatus === 'scheduled') return { label: isRescheduled ? 'Rescheduled' : 'On Schedule', color: 'bg-blue-600/10 text-blue-500 border-blue-600/20', icon: isRescheduled ? RefreshCcw : Calendar }
        if (vStatus === 'arrived') return { label: 'Patient Arrived', color: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20', icon: MapPin }
        if (vStatus === 'in_progress') return { label: 'In Chair', color: 'bg-purple-600/10 text-purple-500 border-purple-600/20', icon: Activity }
        if (vStatus === 'visited') return { label: 'Visit Completed', color: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20', icon: CheckCircle }
        if (vStatus === 'postponed') return { label: 'Postponed', color: 'bg-orange-600/10 text-orange-500 border-orange-600/20', icon: Clock }
        if (vStatus === 'cancelled') return { label: 'Cancelled', color: 'bg-secondary text-muted-foreground border-border', icon: XCircle }
        if (activeStatus === 'APPROVED') return { label: 'Approved', color: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20', icon: Sparkles }
        if (activeStatus === 'PENDING') return { label: 'Pending', color: 'bg-orange-600/10 text-orange-500 border-orange-600/20', icon: Clock }
        if (activeStatus === 'REJECTED') return { label: 'Rejected', color: 'bg-rose-600/10 text-rose-500 border-rose-600/20', icon: AlertOctagon }
        return { label: activeStatus || 'Active', color: 'bg-blue-600/10 text-blue-500 border-blue-600/20', icon: Sparkles }
    }
    const status = getStatus()

    // Appointment Context
    const schedDate = plan?.scheduled_date || request?.scheduled_date
    const schedTime = plan?.scheduled_time || request?.scheduled_time

    // Total Calculation
    const items = plan?.items || []
    const totalCost = items.reduce((acc, item) => acc + (parseFloat(item.cost) || 0), 0)

    const hasPlan = !!plan?.total_cost && plan.total_cost > 0
    const isVisited = plan?.visit_status === 'visited' || plan?.status === 'COMPLETED'

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden">
            <PatientSidebar />

            <motion.div
                initial={false}
                animate={{
                    marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
                    transition: { type: 'spring', damping: 25, stiffness: 200 }
                }}
                className="flex-1 flex flex-col min-w-0 relative overflow-hidden h-screen"
            >
                <div className="absolute inset-0 opacity-100 pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(var(--border) 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

                {/* HEADER */}
                <header className="shrink-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border relative">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-[72px] lg:h-20 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-5 min-w-0">
                                <PatientSidebarTrigger />
                                <button
                                    onClick={() => navigate('/patient/consultations')}
                                    className="hidden xl:flex w-10 h-10 bg-secondary border border-border rounded-md items-center justify-center text-muted-foreground hover:text-blue-500 hover:border-blue-600/30 transition-all shadow-sm group shrink-0 active:scale-95"
                                >
                                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                                <div className="min-w-0 flex items-center gap-3">
                                    <div className="hidden sm:flex w-11 h-11 bg-blue-600 rounded-md items-center justify-center text-white shadow-xl shadow-blue-600/20 ring-4 ring-background shrink-0 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2s_infinite]" />
                                        <Activity className="w-5 h-5 relative z-10" />
                                    </div>
                                    <div>
                                        <h1 className="text-sm sm:text-base md:text-lg font-black text-foreground tracking-tight flex items-center gap-1.5 leading-none mb-1.5 uppercase">
                                            <span className="truncate">Case #{requestId}</span>
                                        </h1>
                                        <span className="text-[9px] sm:text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase flex items-center gap-1 leading-none opacity-80">
                                            Clinical Node Overview
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <NotificationBell />
                                <div className="w-px h-6 bg-border hidden sm:block" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* BODY (scrollable) */}
                <div className="flex-1 overflow-y-auto w-full overscroll-contain scrollbar-thin scrollbar-thumb-blue-600/20 scrollbar-track-transparent">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 relative z-10 pb-12">

                        {/* LEFT: Provider Card + Nav Tiles */}
                        <div className="lg:col-span-8 space-y-6 sm:space-y-8">

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card/80 backdrop-blur-xl rounded-md p-6 sm:p-8 border border-border shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute -top-4 -right-4 opacity-[0.05] group-hover:opacity-[0.1] group-hover:scale-110 transition-all duration-700 pointer-events-none text-blue-600">
                                    <MapPin className="w-40 h-40 sm:w-48 sm:h-48" />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 relative z-10">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-600/20 border-4 border-background overflow-hidden shrink-0">
                                        {(request?.dentist_name || plan?.dentist_name || 'D').charAt(0)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground leading-none truncate uppercase tracking-tight">
                                                Dr. {request?.dentist_name || plan?.dentist_name || 'Your Doctor'}
                                            </h2>
                                            <Badge className={`rounded-md px-2.5 py-1 sm:px-3 sm:py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-1.5 ${status.color}`}>
                                                <status.icon className="w-3 h-3" />
                                                <span className="inline">{status.label}</span>
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                {schedDate ? new Date(schedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                            </span>
                                            <span className="flex items-center gap-2 leading-none">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                {schedTime || 'TBD'}
                                            </span>
                                            <span className="flex items-center gap-2 text-blue-500 bg-blue-600/10 px-3 py-1.5 rounded-md border border-blue-600/20 leading-none">
                                                <ShieldCheck className="w-4 h-4" />
                                                Verified
                                            </span>
                                        </div>
                                    </div>

                                    <div className="hidden sm:block text-right shrink-0">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Est. Investment</p>
                                        <p className="text-xl sm:text-3xl font-black text-foreground leading-none flex items-center justify-end gap-1 tabular-nums">
                                            <span className="text-blue-600 text-[15px] sm:text-[18px]">₹</span>{totalCost.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="sm:hidden mt-5 pt-5 border-t border-border flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Estimated Investment</span>
                                    <span className="text-xl font-black text-foreground flex items-center gap-1"><span className="text-blue-600 text-sm">₹</span>{totalCost.toLocaleString()}</span>
                                </div>

                                {plan?.original_date && (
                                    <div className="mt-6 pt-6 border-t border-border relative z-10">
                                        <div className="flex items-start gap-4 bg-orange-600/10 rounded-md p-4 border border-orange-600/20 group/reschedule">
                                            <RefreshCcw className="w-5 h-5 text-orange-500 mt-0.5 shrink-0 group-hover:rotate-180 transition-transform duration-700" />
                                            <div>
                                                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                                    Rescheduled from <span className="text-foreground font-black">{new Date(plan.original_date).toLocaleDateString()}</span>
                                                </p>
                                                {plan.postpone_reason && (
                                                    <p className="text-[11px] font-bold text-orange-600 mt-1.5 italic opacity-80">Reason: {plan.postpone_reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                                <HubTile title="Secure Chat" subtitle="Clinic Channel" icon={MessageSquare} color="blue" onClick={() => navigate(`/patient/consultation/${requestId}/chat`)} />
                                <HubTile title="Treatment Plan" subtitle="AI Guided Protocol" icon={FileText} color="indigo" onClick={() => navigate(`/patient/consultation/${requestId}/plan`)} />
                                <HubTile title="Timeline" subtitle="Clinical History" icon={History} color="teal" onClick={() => navigate(`/patient/consultation/${requestId}/timeline`)} />
                                <HubTile title="Notes" subtitle="Personal Diary" icon={StickyNote} color="amber" onClick={() => navigate(`/patient/consultation/${requestId}/notes`)} />
                            </div>
                        </div>

                        {/* RIGHT: Sidebar Workflow + Insights */}
                        <div className="lg:col-span-4 space-y-5 sm:space-y-6">

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-card/80 backdrop-blur-xl rounded-md border border-border shadow-sm p-6 sm:p-8"
                            >
                                <h3 className="text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-blue-600" /> Diagnostic Pipeline
                                </h3>

                                <div className="space-y-1">
                                    <WorkflowStep label="Request Received" description="Clinic mapping requested." done={true} last={false} />
                                    <WorkflowStep label="Consultation Approved" description="Assigned to schedule." done={activeStatus === 'APPROVED' || hasPlan} last={false} />
                                    <WorkflowStep label="Treatment Created" description={hasPlan ? "Est. active and mapped." : "Awaiting clinician input."} done={hasPlan} last={false} />
                                    <WorkflowStep label="Protocol Completed" description={isVisited ? "Session finished." : "Awaiting visit completion."} done={isVisited} last={true} />
                                </div>

                                <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 gap-5">
                                    <div className="p-6 rounded-md bg-foreground group relative overflow-hidden shadow-2xl shadow-black/20">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-md -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />

                                        <p className="text-[10px] sm:text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 relative z-10">
                                            Active Units
                                        </p>

                                        <div className="flex items-end justify-between relative z-10">
                                            <p className="text-3xl sm:text-4xl font-black text-background tabular-nums">
                                                {items.length.toString().padStart(2, '0')}
                                            </p>

                                            <span className="text-[10px] font-black text-blue-500 bg-blue-600/20 px-3 py-1.5 rounded-md uppercase tracking-widest border border-blue-600/30">
                                                In Protocol
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>


                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default PatientConsultationOverview
