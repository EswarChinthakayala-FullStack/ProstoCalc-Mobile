import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
	Sparkles,
	BrainCircuit,
	Calendar,
	LayoutDashboard,
	Users,
	ClipboardList,
	Stethoscope,
	IndianRupee,
	History,
	Activity,
	Layers,
	Settings,
	LogOut,
	ChevronLeft,
	ChevronRight,
	Menu,
	X,
	Bell,
	PanelLeftClose,
	PanelLeft,
	Moon,
	Sun
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useDentistProfile } from '@/hooks/useDentistProfile'
import { useSidebar } from '@/context/SidebarContext'
import { useTheme } from '@/context/ThemeContext'

const SidebarItem = ({ icon: Icon, label, active, onClick, isCollapsed, hidden = false }) => {
	if (hidden) return null;
	return (
		<button
			onClick={onClick}
			title={isCollapsed ? label : ''}
			className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-300 group cursor-pointer border border-transparent relative ${active
				? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 border-teal-500'
				: 'text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-teal-600 dark:hover:text-teal-400 hover:border-slate-100 dark:hover:border-zinc-800'
				} ${isCollapsed ? 'justify-center' : ''}`}
		>
			<Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 dark:text-zinc-600 group-hover:text-teal-600 dark:group-hover:text-teal-500'} shrink-0`} />

			{!isCollapsed && (
				<motion.span
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					className="font-bold text-[11px] uppercase tracking-widest leading-none whitespace-nowrap overflow-hidden"
				>
					{label}
				</motion.span>
			)}

			{active && isCollapsed && (
				<motion.div
					layoutId="activeIndicator"
					className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
				/>
			)}
		</button>
	)
}

/* ─── Shared Nav Content (used in both Desktop & Mobile) ─── */
const SidebarNavContent = ({ isCalcOnly, isCollapsed, location, activeTab, handleNav, navigate, logout, onItemClick }) => {
	const wrappedNav = (path, tab) => {
		handleNav(path, tab)
		onItemClick?.()
	}
	const wrappedNavigate = (path) => {
		navigate(path)
		onItemClick?.()
	}

	return (
		<>
			<nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar px-5 pb-6">
				{/* Core Operations */}
				<SidebarItem
					icon={LayoutDashboard}
					label="Practice Overview"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician' && activeTab === 'Overview'}
					onClick={() => wrappedNav('/dashboard/clinician', 'Overview')}
				/>

				<SidebarItem
					hidden={isCalcOnly}
					icon={Calendar}
					label="Timeline & Schedule"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician/schedule'}
					onClick={() => wrappedNavigate('/dashboard/clinician/schedule')}
				/>

				<SidebarItem
					hidden={isCalcOnly}
					icon={Users}
					label="Patient Directory"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician' && activeTab === 'Patients'}
					onClick={() => wrappedNav('/dashboard/clinician', 'Patients')}
				/>

				<SidebarItem
					hidden={isCalcOnly}
					icon={ClipboardList}
					label="Consultation Requests"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician/requests'}
					onClick={() => wrappedNavigate('/dashboard/clinician/requests')}
				/>

				<SidebarItem
					hidden={isCalcOnly}
					icon={Stethoscope}
					label="Odontogram Matrix"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician/odontogram'}
					onClick={() => wrappedNavigate('/dashboard/clinician/odontogram')}
				/>

				{/* Clinical Intelligence */}
				<SidebarItem
					icon={BrainCircuit}
					label="AI Surgical Advisor"
					isCollapsed={isCollapsed}
					active={location.pathname.startsWith('/dashboard/clinician/ai-chat')}
					onClick={() => wrappedNavigate('/dashboard/clinician/ai-chat')}
				/>

				<SidebarItem
					icon={History}
					label={isCalcOnly ? "Estimation Registry" : "Clinical Registry"}
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician/history'}
					onClick={() => wrappedNavigate('/dashboard/clinician/history')}
				/>

				{/* Practice Performance */}
				<SidebarItem
					icon={IndianRupee}
					label="Financial Estimates"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician/estimator'}
					onClick={() => wrappedNavigate('/dashboard/clinician/estimator')}
				/>

				<SidebarItem
					icon={Activity}
					label="Clinical Analytics"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician/analytics'}
					onClick={() => wrappedNavigate('/dashboard/clinician/analytics')}
				/>

				<SidebarItem
					icon={Layers}
					label="Treatment Catalog"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dashboard/clinician/catalog'}
					onClick={() => wrappedNavigate('/dashboard/clinician/catalog')}
				/>
			</nav>

			<div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-auto space-y-1.5 px-5 pb-8">
				<SidebarItem
					icon={Settings}
					label="System Settings"
					isCollapsed={isCollapsed}
					active={location.pathname === '/dentist/profile'}
					onClick={() => wrappedNavigate('/dentist/profile')}
				/>

				<button
					onClick={() => { logout(); onItemClick?.() }}
					title={isCollapsed ? 'Terminate Session' : ''}
					className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer group ${isCollapsed ? 'justify-center' : ''}`}
				>
					<LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1 shrink-0" />
					{!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Terminate Session</motion.span>}
				</button>
			</div>
		</>
	)
}

const ClinicianSidebar = ({ activeTab }) => {
	const { user, logout } = useAuth()
	const { settings } = useDentistProfile(user?.id)
	const isCalcOnly = settings?.consultation_mode === 'CALCULATION_ONLY'
	const navigate = useNavigate()
	const location = useLocation()
	const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar()

	const handleNav = (path, tab) => {
		if (tab && location.pathname === '/dashboard/clinician') {
			navigate(`/dashboard/clinician?tab=${tab}`)
		} else {
			navigate(tab ? `/dashboard/clinician?tab=${tab}` : path)
		}
	}

	const sharedNavProps = {
		isCalcOnly,
		location,
		activeTab,
		handleNav,
		navigate,
		logout,
	}

	return (
		<>
			{/* ═══ Desktop Sidebar (xl+) ═══ */}
			<motion.aside
				initial={false}
				animate={{ width: isCollapsed ? 100 : 300 }}
				className="bg-white dark:bg-black border-r border-slate-200 dark:border-zinc-800 hidden xl:flex flex-col fixed inset-y-0 z-50 shadow-lg shadow-slate-200/40 dark:shadow-black/30"
			>
				{/* Collapse Toggle */}
				<button
					onClick={toggleSidebar}
					className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-400 hover:text-teal-600 shadow-sm z-50 cursor-pointer transition-colors"
				>
					{isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
				</button>

				<div className={`flex items-center gap-3 mb-10 px-6 pt-10 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`} onClick={() => navigate('/dashboard/clinician')}>
					<div className="w-10 h-10 bg-white dark:bg-zinc-950 rounded-md flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-100 dark:border-zinc-800/50 shrink-0 overflow-hidden">
						<img src="/logo-teal.svg" alt="Logo" className="w-7 h-7 object-contain" />
					</div>
					{!isCollapsed && (
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
						>
							Prosto<span className="text-teal-600">Calc</span>
						</motion.span>
					)}
				</div>

				<SidebarNavContent {...sharedNavProps} isCollapsed={isCollapsed} />
			</motion.aside>

			{/* ═══ Mobile Sidebar Overlay (< xl) ═══ */}
			<AnimatePresence>
				{isMobileOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[60] xl:hidden"
							onClick={closeMobileSidebar}
						/>

						{/* Drawer */}
						<motion.aside
							initial={{ x: -320 }}
							animate={{ x: 0 }}
							exit={{ x: -320 }}
							transition={{ type: 'spring', damping: 28, stiffness: 280 }}
							className="fixed inset-y-0 left-0 w-[300px] bg-white dark:bg-black z-[70] xl:hidden flex flex-col shadow-2xl shadow-slate-900/20 border-r border-slate-100 dark:border-zinc-800"
						>
							{/* Mobile Header */}
							<div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
								<div className="flex items-center gap-3 cursor-pointer" onClick={() => { navigate('/dashboard/clinician'); closeMobileSidebar() }}>
									<div className="w-10 h-10 bg-white dark:bg-zinc-950 rounded-md flex items-center justify-center border border-teal-100 dark:border-zinc-800 shadow-sm overflow-hidden">
										<img src="/logo-teal.svg" alt="Logo" className="w-7 h-7 object-contain" />
									</div>
									<span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
										Prosto<span className="text-teal-600">Calc</span>
									</span>
								</div>
								<button
									onClick={closeMobileSidebar}
									className="w-9 h-9 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-95"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* Clinician Profile Strip */}
							<div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-teal-600 rounded-md flex items-center justify-center text-white text-sm font-bold shadow-sm">
										{user?.full_name?.charAt(0) || 'D'}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">Dr. {user?.full_name || 'Clinician'}</p>
										<p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">Active Session</p>
									</div>
									<div className="w-2.5 h-2.5 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
								</div>
							</div>

							<SidebarNavContent {...sharedNavProps} isCollapsed={false} onItemClick={closeMobileSidebar} />
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</>
	)
}

/* ─── Mobile Sidebar Trigger Button ─── */
export const MobileSidebarTrigger = ({ className = '' }) => {
	const { openMobileSidebar } = useSidebar()
	return (
		<button
			onClick={openMobileSidebar}
			className={`xl:hidden w-9 h-9 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-zinc-700 hover:bg-teal-50/50 dark:hover:bg-zinc-900/40 transition-all shadow-sm active:scale-95 ${className}`}
		>
			<Menu className="w-5 h-5" />
		</button>
	)
}

export default ClinicianSidebar
