import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  FileSearch,
  CalendarDays,
  Dumbbell,
  LineChart,
  BookOpen,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Activity, Sparkles, Flame
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { useTheme } from '@/context/ThemeContext'

const SidebarItem = ({ icon: Icon, label, active, onClick, isCollapsed, hidden = false }) => {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : ''}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-300 group cursor-pointer border border-transparent relative ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-blue-500'
        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-100 dark:hover:border-zinc-800'
        } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'} shrink-0`} />

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
          className="absolute left-0 w-1 h-6 bg-white rounded-r-md"
        />
      )}
    </button>
  )
}

/* ─── Shared Nav Content (used in both Desktop & Mobile) ─── */
const SidebarNavContent = ({ isCollapsed, location, navigate, logout, onItemClick }) => {
  const wrappedNavigate = (path) => {
    navigate(path)
    onItemClick?.()
  }

  return (
    <>
      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar px-5 pb-6">
        <SidebarItem
          icon={LayoutDashboard}
          label="Overview"
          isCollapsed={isCollapsed}
          active={location.pathname === '/dashboard/patient'}
          onClick={() => wrappedNavigate('/dashboard/patient')}
        />

        <SidebarItem
          icon={Activity}
          label="Consultation Hub"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/consultations'}
          onClick={() => wrappedNavigate('/patient/consultations')}
        />

        <SidebarItem
          icon={Sparkles}
          label="AI Assistant"
          isCollapsed={isCollapsed}
          active={location.pathname.startsWith('/patient/ai-chat')}
          onClick={() => wrappedNavigate('/patient/ai-chat')}
        />

        <SidebarItem
          icon={Briefcase}
          label="Medical Journey"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/journey'}
          onClick={() => wrappedNavigate('/patient/journey')}
        />

        <SidebarItem
          icon={FileSearch}
          label="Clinic Radar"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/radar'}
          onClick={() => wrappedNavigate('/patient/radar')}
        />

        <SidebarItem
          icon={CalendarDays}
          label="Medication"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/medication'}
          onClick={() => wrappedNavigate('/patient/medication')}
        />

        <SidebarItem
          icon={Dumbbell}
          label="Therapy Plan"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/therapy'}
          onClick={() => wrappedNavigate('/patient/therapy')}
        />

        <SidebarItem
          icon={LineChart}
          label="Health Trackers"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/trackers'}
          onClick={() => wrappedNavigate('/patient/trackers')}
        />

        <SidebarItem
          icon={Flame}
          label="Habit Recovery"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/habit-tracker'}
          onClick={() => wrappedNavigate('/patient/habit-tracker')}
        />

        <SidebarItem
          icon={BookOpen}
          label="Learning Hub"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/hub'}
          onClick={() => wrappedNavigate('/patient/hub')}
        />
      </nav>

      <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-auto space-y-1.5 px-5 pb-8">
        <SidebarItem
          icon={User}
          label="Clinical Profile"
          isCollapsed={isCollapsed}
          active={location.pathname === '/patient/profile'}
          onClick={() => wrappedNavigate('/patient/profile')}
        />



        <button
          onClick={() => { logout(); onItemClick?.() }}
          title={isCollapsed ? 'Sign Out' : ''}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-black text-[11px] uppercase tracking-widest cursor-pointer group ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1 shrink-0" />
          {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Sign Out</motion.span>}
        </button>
      </div>
    </>
  )
}

const PatientSidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isCollapsed, toggleSidebar, isPatientMobileOpen, closePatientMobileSidebar } = useSidebar()

  const sharedNavProps = {
    location,
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
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm z-50 cursor-pointer transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Area */}
        <div className={`flex items-center gap-3 mb-10 px-6 pt-10 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`} onClick={() => navigate('/dashboard/patient')}>
          <div className="w-10 h-10 bg-white dark:bg-zinc-950 rounded-md flex items-center justify-center shadow-lg shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-zinc-800 shrink-0 overflow-hidden">
            <img src="/logo.svg" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              Prosto<span className="text-blue-600">Calc</span>
            </motion.span>
          )}
        </div>

        <SidebarNavContent {...sharedNavProps} isCollapsed={isCollapsed} />
      </motion.aside>

      {/* ═══ Mobile Sidebar Overlay (< xl) ═══ */}
      <AnimatePresence>
        {isPatientMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] xl:hidden"
              onClick={closePatientMobileSidebar}
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
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { navigate('/dashboard/patient'); closePatientMobileSidebar() }}>
                  <div className="w-9 h-9 bg-white dark:bg-zinc-950 rounded-md flex items-center justify-center border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <img src="/logo.svg" alt="Logo" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Prosto<span className="text-blue-600">Calc</span>
                  </span>
                </div>
                <button
                  onClick={closePatientMobileSidebar}
                  className="w-9 h-9 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 hover:border-rose-200 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Patient Profile Strip */}
              <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user?.full_name?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{user?.full_name || 'Patient'}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Active Session</p>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                </div>
              </div>

              <SidebarNavContent {...sharedNavProps} isCollapsed={false} onItemClick={closePatientMobileSidebar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── Mobile Sidebar Trigger Button ─── */
export const PatientSidebarTrigger = ({ className = '' }) => {
  const { openPatientMobileSidebar } = useSidebar()
  return (
    <button
      onClick={openPatientMobileSidebar}
      className={`xl:hidden w-9 h-9 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-all shadow-sm active:scale-95 ${className}`}
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

export default PatientSidebar
