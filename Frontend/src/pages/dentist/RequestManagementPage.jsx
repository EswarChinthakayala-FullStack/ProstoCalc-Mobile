import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Search,
  ChevronLeft,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  CalendarCheck,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import ConsultationRequestManager from '@/components/dashboard/ConsultationRequestManager'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { Input } from '@/components/ui/input'
import NotificationBell from '@/components/NotificationBell'
import { useConsultationRequests } from '@/hooks/useConsultationRequests'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

/* ─── Premium Stat Card (Analytics Style) ─────────────────────────── */
const StatCard = ({ title, value, subtext, icon: Icon, accent, trend }) => {
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-zinc-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-zinc-800', bar: 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.2)]' },
    amber: { bg: 'bg-amber-50 dark:bg-zinc-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-zinc-800', bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' },
    rose: { bg: 'bg-rose-50 dark:bg-zinc-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-zinc-800', bar: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' },
    indigo: { bg: 'bg-indigo-50 dark:bg-zinc-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-zinc-800', bar: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]' },
    emerald: { bg: 'bg-emerald-50 dark:bg-zinc-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-zinc-800', bar: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-md p-4 sm:p-5 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-black/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 group relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110",
          t.bg, t.text, t.border
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && trend !== null && (
          <span className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-widest transition-colors duration-300",
            trend > 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-zinc-900/50 border-emerald-100 dark:border-zinc-800' :
              trend < 0 ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-zinc-900/50 border-rose-100 dark:border-zinc-800' :
                'text-slate-500 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
          )}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {trend !== 0 && `${Math.abs(trend)}%`}
            {trend === 0 && 'Stable'}
          </span>
        )}
      </div>

      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{value}</h3>
      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">{title}</p>

      <div className="pt-4 border-t border-slate-50 dark:border-zinc-800/50">
        <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-bold flex items-center gap-2 truncate">
          <span className={cn("w-2 h-2 rounded-md opacity-50 shrink-0", t.bar)} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

const RequestManagementPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const [searchTerm, setSearchTerm] = useState('')
  const { requests, isLoading, respond } = useConsultationRequests()

  // Compute stats from requests
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden font-sans transition-colors duration-500">
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative"
      >
        {/* Subtle Ambient Bg */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-40"
          style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181b' : '#94a3b8'} 1.5px, transparent 1.5px)`, backgroundSize: '48px 48px' }} />

        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 lg:h-20 flex items-center justify-between gap-4">
              {/* Left: Back & Title */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <button
                  onClick={() => navigate(-1)}
                  className="hidden xl:flex w-10 h-10 bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-md items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-zinc-700 transition-all active:scale-90 shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Request Hub</h1>
                  <p className="text-[10px] lg:text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 hidden sm:flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-teal-600 dark:text-teal-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Clinical Registry
                    </span>
                    <span className="text-slate-300 dark:text-slate-800">·</span>
                    <span className="hidden md:inline">Waitlist Management</span>
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative hidden md:block w-48 lg:w-64 xl:w-96 group relative z-10">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-600 group-focus-within:text-teal-500 transition-colors" />
                  <Input
                    className="pl-10 h-11 bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 rounded-md text-sm font-bold focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all dark:text-white dark:placeholder:text-zinc-700 shadow-inner"
                    placeholder="Search clinical requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-11 h-11 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-teal-50/50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <NotificationBell />

                <Link to="/dentist/profile" className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-sm group">
                  <div className="w-9 h-9 bg-teal-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-bold text-teal-600 dark:text-teal-500 mt-1 uppercase tracking-widest">Clinician</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>


        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 sm:space-y-6"
            >
              {/* ═══ KPI STAT CARDS ═══ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                <StatCard
                  title="Total Requests"
                  value={stats.total}
                  subtext="All consultation nodes"
                  icon={ClipboardList}
                  accent="teal"
                />
                <StatCard
                  title="Pending Review"
                  value={stats.pending}
                  subtext="Awaiting clinical action"
                  icon={AlertTriangle}
                  accent="amber"
                />
                <StatCard
                  title="Scheduled"
                  value={stats.approved}
                  subtext="Active patient slots"
                  icon={CalendarCheck}
                  accent="emerald"
                />
                <StatCard
                  title="Declined"
                  value={stats.rejected}
                  subtext="Archived records"
                  icon={Activity}
                  accent="rose"
                />
              </div>

              {/* ═══ MOBILE SEARCH (shows on small screens) ═══ */}
              <div className="block md:hidden">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500/50" />
                  <Input
                    className="pl-9 h-11 bg-white dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 rounded-md text-sm font-medium focus:ring-teal-500 focus:border-teal-400 transition-all shadow-sm dark:text-white dark:placeholder:text-zinc-700"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* ═══ CONSULTATION REQUEST LIST ═══ */}
              <ConsultationRequestManager
                externalSearchTerm={searchTerm}
                requests={requests}
                isLoading={isLoading}
                respond={respond}
              />
            </motion.div>
          </div>
        </main>
      </motion.div>
    </div>
  )
}

export default RequestManagementPage
