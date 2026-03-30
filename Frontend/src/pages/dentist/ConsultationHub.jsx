import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
	ChevronLeft,
	MessageCircle,
	ClipboardList,
	History,
	StickyNote,
	Activity,
	Calendar,
	Clock,
	Sparkles,
	ArrowRight,
	Stethoscope,
	ShieldCheck,
	CheckCircle2,
	RefreshCcw,
	CheckCircle,
	User,
	XCircle,
	AlertOctagon,
	TrendingUp,
	Zap,
	Loader2,
	IndianRupee,
	ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConsultationData } from '@/hooks/useConsultationData'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import UniversalLoader from '@/components/UniversalLoader'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import NotificationBell from '@/components/NotificationBell'
import { useTheme } from '@/context/ThemeContext'

/* ─── Navigation Tile ───────────────────────────────────────────── */
const HubTile = ({ title, subtitle, icon: Icon, color, onClick }) => {
	const palette = {
		blue: { bg: 'bg-blue-50 dark:bg-zinc-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-zinc-800/50', glow: 'shadow-blue-500/10' },
		indigo: { bg: 'bg-indigo-50 dark:bg-zinc-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-zinc-800/50', glow: 'shadow-indigo-500/10' },
		teal: { bg: 'bg-teal-50 dark:bg-zinc-900/20', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-zinc-800/50', glow: 'shadow-teal-500/10' },
		amber: { bg: 'bg-amber-50 dark:bg-zinc-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-zinc-800/50', glow: 'shadow-amber-500/10' },
		purple: { bg: 'bg-purple-50 dark:bg-zinc-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-zinc-800/50', glow: 'shadow-purple-500/10' },
	}
	const t = palette[color] || palette.blue

	return (
		<motion.button
			whileHover={{ y: -4, scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			onClick={onClick}
			className={`relative w-full text-left p-5 sm:p-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-md sm:rounded-md border ${t.border} shadow-sm hover:shadow-xl ${t.glow} transition-all duration-300 group overflow-hidden`}
		>
			{/* Animated SVG Backdrop */}
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

			<div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-md sm:rounded-md ${t.bg} ${t.text} flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300 relative z-10 box-border border ${t.border} shadow-inner`}>
				<Icon className="w-5 h-5 sm:w-6 sm:h-6" />
			</div>

			<h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-800 dark:text-slate-100 leading-tight mb-1 relative z-10">{title}</h3>
			<p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest relative z-10">{subtitle}</p>

			<div className={`absolute bottom-5 right-5 w-7 h-7 bg-white dark:bg-zinc-900 rounded-md border border-slate-100 dark:border-zinc-800 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm`}>
				<ChevronRight className={`w-3.5 h-3.5 ${t.text}`} />
			</div>
		</motion.button>
	)
}

/* ─── Workflow Step ──────────────────────────────────────────────── */
const WorkflowStep = ({ label, description, done, last }) => (
	<div className="flex gap-3 sm:gap-4 relative">
		{/* connector */}
		{!last && <div className={`absolute left-[15px] sm:left-[17px] top-9 bottom-0 w-[2px] ${done ? 'bg-teal-200 dark:bg-teal-900' : 'bg-slate-100 dark:bg-slate-800'}`} />}
		<div className={`w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-md flex items-center justify-center shrink-0 transition-colors duration-500 box-border border-2 border-white dark:border-slate-900 ${done ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-100 dark:ring-teal-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}>
			{done ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-md bg-current" />}
		</div>
		<div className="pb-6 sm:pb-7">
			<h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">{label}</h4>
			<p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{description}</p>
		</div>
	</div>
)

/* ═══════════════════════════════════════════════════════════════════
  MAIN COMPONENT
  ═══════════════════════════════════════════════════════════════════ */
const ConsultationHub = () => {
	const { requestId } = useParams()
	const navigate = useNavigate()
	const { isLoading, plan, patient, timeline, error } = useConsultationData(requestId)
	const { theme, toggleTheme } = useTheme()

	/* ── status badge ── */
	const getStatus = () => {
		const s = plan?.visit_status?.toLowerCase()
		const resch = !!plan?.rescheduled_from
		const map = {
			scheduled: { label: resch ? 'Rescheduled' : 'On Schedule', color: resch ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20', icon: resch ? RefreshCcw : Calendar },
			arrived: { label: 'Patient Arrived', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20', icon: User },
			in_progress: { label: 'In Chair', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20', icon: Activity },
			visited: { label: 'Visit Completed', color: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20', icon: CheckCircle },
			postponed: { label: 'Postponed', color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20', icon: Clock },
			not_visited: { label: 'No Show', color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20', icon: AlertOctagon },
			cancelled: { label: 'Cancelled', color: 'bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-500/20', icon: XCircle },
		}
		return map[s] || { label: 'Active', color: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-500/20', icon: Sparkles }
	}
	const status = getStatus()

	const { isCollapsed } = useSidebar()
	const isDesktop = useMediaQuery('(min-width: 1280px)')

	/* ── loading ── */
	if (isLoading) return <UniversalLoader text="PARSING CONSULTATION DATA..." />

	const hasPlan = !!plan?.total_cost && plan.total_cost > 0
	const isVisited = plan?.visit_status === 'visited' || plan?.status === 'COMPLETED'


	return (
		<div className="flex h-screen bg-slate-50 dark:bg-black font-sans overflow-hidden transition-colors duration-500">
			<ClinicianSidebar />

			<motion.div
				initial={false}
				animate={{
					marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
					transition: { type: 'spring', damping: 25, stiffness: 200 }
				}}
				className="flex-1 flex flex-col min-w-0 relative overflow-hidden h-screen"
			>
				{/* Ambient Bg */}
				<div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-[0.03]"
					style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#14b8a6' : '#94a3b8'} 1.5px, transparent 1.5px)`, backgroundSize: '48px 48px' }} />

				{/* ═══ HEADER ═══ */}
				<header className="shrink-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 relative transition-colors duration-300">
					<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex flex-col justify-center">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-3 sm:gap-4 min-w-0">
								<MobileSidebarTrigger />
								<button
									onClick={() => navigate('/dashboard/clinician')}
									className="hidden xl:flex w-10 h-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-md items-center justify-center text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-800 transition-all shadow-sm active:scale-90 shrink-0 group"
								>
									<ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
								</button>
								<div className="min-w-0 flex items-center gap-3">
									<div className="hidden sm:flex w-11 h-11 bg-teal-600 dark:bg-zinc-950 rounded-md items-center justify-center text-white shadow-lg shadow-teal-600/20 shrink-0 relative overflow-hidden">
										<Activity className="w-5 h-5 text-white relative z-10" />
									</div>
									<div className="min-w-0">
										<h1 className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5 truncate">
											Case #{requestId}
										</h1>
										<span className="text-[10px] font-black text-teal-600 dark:text-teal-500 tracking-[0.2em] uppercase flex items-center gap-1.5 leading-none">
											Clinical Command Center
										</span>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<NotificationBell />
								<div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
							</div>
						</div>
					</div>
				</header>

				{/* ═══ BODY (scrollable) ═══ */}
				<div className="flex-1 overflow-y-auto w-full overscroll-contain scrollbar-thin scrollbar-thumb-teal-600/20 dark:scrollbar-thumb-teal-400/20 scrollbar-track-transparent">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 relative z-10 pb-12">

						{/* ─── LEFT: Patient Card + Nav Tiles ─── */}
						<div className="lg:col-span-8 space-y-6 sm:space-y-8">

							{/* Patient Overview Card */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="bg-white/90 dark:bg-zinc-950/50 backdrop-blur-xl rounded-md sm:rounded-md p-5 sm:p-7 lg:p-8 border border-white dark:border-zinc-800 shadow-md ring-1 ring-slate-100/50 dark:ring-zinc-900/50 relative overflow-hidden group"
							>
								<div className="absolute -top-4 -right-4 opacity-[0.02] dark:opacity-[0.05] group-hover:opacity-[0.04] dark:group-hover:opacity-[0.1] group-hover:scale-110 transition-all duration-700 pointer-events-none">
									<Stethoscope className="w-40 h-40 sm:w-48 sm:h-48 text-slate-900 dark:text-white" />
								</div>

								<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative z-10">
									{/* Avatar */}
									<div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-teal-500 to-teal-700 rounded-md flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg shadow-teal-500/20 shadow-inner border-[3px] border-white dark:border-zinc-800 overflow-hidden shrink-0">
										{patient?.avatar_url ? (
											<img src={patient.avatar_url} alt={patient.full_name} className="w-full h-full object-cover rounded-[12px] sm:rounded-[14px]" />
										) : (
											(patient?.full_name || plan?.patient_name || 'P').charAt(0)
										)}
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<div className='flex flex-wrap items-center gap-3 mb-1.5'>
											<h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white leading-none truncate">
												{patient?.full_name || plan?.patient_name || 'Patient Record'}
											</h2>
											<Badge className={`rounded-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${status.color}`}>
												<status.icon className="w-3 h-3" />
												<span className="inline">{status.label}</span>
											</Badge>
										</div>
										<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-zinc-500">
											<span className="flex items-center gap-1.5">
												<Calendar className="w-3.5 h-3.5 text-slate-300 dark:text-teal-800" />
												{plan?.scheduled_date ? new Date(plan.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
											</span>
											<span className="flex items-center gap-1.5 leading-none">
												<Clock className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-800" />
												{plan?.scheduled_time || 'TBD'}
											</span>
											<span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-zinc-900/40 px-2.5 py-1 rounded-md border border-teal-100/50 dark:border-zinc-800 leading-none">
												<ShieldCheck className="w-3.5 h-3.5" />
												Verified File
											</span>
										</div>
									</div>

									{/* Cost */}
									<div className="hidden sm:block text-right shrink-0">
										<p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Est. Cost</p>
										<p className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 leading-none flex items-center justify-end gap-0.5">
											<span className="text-[13px] sm:text-[15px]">₹</span>{plan?.total_cost?.toLocaleString() || '0'}
										</p>
									</div>
								</div>

								{/* Mobile Cost */}
								<div className="sm:hidden mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between relative z-10">
									<span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Estimated Cost</span>
									<span className="text-lg font-black text-teal-600 dark:text-teal-400 flex items-center gap-0.5"><span className="text-xs">₹</span>{plan?.total_cost?.toLocaleString() || '0'}</span>
								</div>

								{/* Reschedule notice */}
								{plan?.original_date && (
									<div className="mt-5 pt-5 border-t border-slate-50 dark:border-zinc-800 relative z-10">
										<div className="flex items-start gap-3 bg-orange-50/60 dark:bg-orange-950/40 rounded-md p-3.5 border border-orange-100/60 dark:border-orange-900">
											<RefreshCcw className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
											<div>
												<p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-zinc-400">
													Rescheduled from <span className="text-slate-800 dark:text-teal-50 font-extrabold">{new Date(plan.original_date).toLocaleDateString()}</span>
												</p>
												{plan.postpone_reason && (
													<p className="text-[10px] font-medium text-orange-600 dark:text-orange-400 mt-1">Reason: {plan.postpone_reason}</p>
												)}
											</div>
										</div>
									</div>
								)}
							</motion.div>

							{/* Navigation Tiles Grid */}
							<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
								<HubTile title="Secure Chat" subtitle="Patient Channel" icon={MessageCircle} color="blue" onClick={() => navigate(`/dashboard/clinician/consultation/${requestId}/chat`)} />
								<HubTile title={plan ? "Review Plan" : "Build Plan"} subtitle={plan ? "Treatment Review" : "Build Protocol"} icon={ClipboardList} color="indigo" onClick={() => navigate(`/dashboard/clinician/consultation/${requestId}/plan`)} />
								<HubTile title="Timeline" subtitle="Milestone Log" icon={History} color="teal" onClick={() => navigate(`/dashboard/clinician/consultation/${requestId}/timeline`)} />
								<HubTile title="Private Notes" subtitle="Confidential" icon={StickyNote} color="amber" onClick={() => navigate(`/dashboard/clinician/consultation/${requestId}/notes`)} />
								<HubTile title="Risk Analyzer" subtitle="AI Habit Profiler" icon={Activity} color="purple" onClick={() => navigate(`/dashboard/clinician/consultation/${requestId}/analyzer`)} />
							</div>
						</div>

						{/* ─── RIGHT: Sidebar ─── */}
						<div className="lg:col-span-4 space-y-5 sm:space-y-6">

							{/* Quick Workflow */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
								className="bg-white/90 dark:bg-zinc-950/40 backdrop-blur-xl rounded-md sm:rounded-md border border-white dark:border-zinc-800 shadow-sm ring-1 ring-slate-100/50 dark:ring-zinc-900/50 p-5 sm:p-6 lg:p-7"
							>
								<h3 className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-5 sm:mb-6 flex items-center gap-2">
									<TrendingUp className="w-4 h-4 text-teal-500 dark:text-teal-400" /> Workflow Status
								</h3>

								<div>
									<WorkflowStep
										label="Consultation Approved"
										description="Request mapped to clinical schedule."
										done={true}
										last={false}
									/>
									<WorkflowStep
										label="Treatment Synthesized"
										description={hasPlan ? 'Framework active and cost-calculated.' : 'Define procedures to generate estimations.'}
										done={hasPlan}
										last={false}
									/>
									<WorkflowStep
										label="Execution Complete"
										description={isVisited ? 'Case verified and locked.' : 'Awaiting clinical visit confirmation.'}
										done={isVisited}
										last={true}
									/>
								</div>

								{/* Stats */}
								<div className="mt-6 pt-6 border-t border-teal-100 dark:border-zinc-800 grid grid-cols-1 gap-4">
									<div className="p-4 sm:p-5 rounded-md bg-gradient-to-br from-teal-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 border border-teal-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">

										<p className="text-[10px] sm:text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">
											Procedures
										</p>

										<div className="flex items-end justify-between">
											<p className="text-2xl sm:text-3xl font-extrabold text-teal-800 dark:text-teal-100">
												{plan?.items?.length || 0}
											</p>

											<span className="text-xs text-teal-500 dark:text-teal-400 font-medium bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md">
												Total Count
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

export default ConsultationHub
