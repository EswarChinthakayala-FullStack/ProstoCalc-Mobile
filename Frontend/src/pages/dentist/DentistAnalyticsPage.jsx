import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Settings,
  Sparkles,
  LayoutDashboard,
  BrainCircuit,
  Users,
  Calendar,
  ClipboardList,
  IndianRupee,
  Activity,
  LogOut,
  ChevronLeft,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Layers,
  CalendarCheck,
  Search,
  ArrowUpRight,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useDentistProfile } from '@/hooks/useDentistProfile'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import NotificationBell from '@/components/NotificationBell'
import { useDentistAnalytics } from '@/hooks/useDentistAnalytics'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const PIE_COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1']

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim() || !text) return <span>{text || ""}</span>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-teal-100 dark:bg-teal-500/30 text-teal-900 dark:text-teal-100 rounded-[2px] px-0.5 font-bold no-underline inline-block leading-tight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════ */
const StatCard = ({ title, value, subtext, icon: Icon, accent, hidden = false, isCurrency = false, trend }) => {
  if (hidden) return null
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-500/20', bar: 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-500/20', bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-500/20', bar: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-500/20', bar: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20', bar: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 sm:p-6 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-black/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-5">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110",
          t.bg, t.text, t.border
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && trend !== null && (
          <span className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-widest",
            trend > 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' :
              trend < 0 ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20' :
                'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          )}>
            {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-1.5">
        {isCurrency && <span className="text-base font-bold text-slate-400 dark:text-slate-600">₹</span>}
        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</h3>
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">{title}</p>

      <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 truncate">
          <span className={cn("w-2 h-2 rounded-md opacity-50 shrink-0", t.bar)} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

const DentistAnalyticsPage = () => {
  const { user, logout } = useAuth()
  const { settings, loading } = useDentistProfile(user?.id)
  const isCalcOnly = settings?.consultation_mode === 'CALCULATION_ONLY'
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const [timeframe, setTimeframe] = useState('6months')

  const { stats, monthlyData, procedures, isLoading: analyticsLoading } = useDentistAnalytics(
    timeframe,
    isCalcOnly ? 'calculation' : 'full'
  )

  const formatCurrency = (val) => `₹${(val / 1000).toFixed(1)}K`

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans transition-colors duration-500">
      <ClinicianSidebar />

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative"
      >
        {/* Ambient Bg */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#14b8a6' : '#94a3b8'} 1.5px, transparent 1.5px)`, backgroundSize: '48px 48px' }} />

        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 lg:h-20 flex items-center justify-between gap-4">
              {/* Left: Title */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Practice Insights</h1>
                  <p className="text-[10px] lg:text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 hidden sm:flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-teal-600 dark:text-teal-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Analytical Matrix
                    </span>
                    <span className="text-slate-300 dark:text-slate-800">·</span>
                    <span>Growth Metrics</span>
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3 sm:gap-4">
                {!isCalcOnly && (
                  <div className="relative hidden md:block w-48 lg:w-64 xl:w-96 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                    <Input
                      className="pl-10 h-11 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-slate-800 rounded-md text-sm font-bold focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all dark:text-white dark:placeholder:text-slate-700 shadow-inner"
                      placeholder="Query analytical data..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-11 h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 hover:border-teal-200 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <NotificationBell />

                <Link to="/dentist/profile" className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-zinc-900/50 hover:border-teal-200 dark:hover:border-teal-800 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-sm group">
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
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* KPI Stats */}
            <div className={`grid gap-4 sm:gap-5 ${isCalcOnly ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
              <StatCard
                title={isCalcOnly ? "Est. Revenue" : "Revenue"}
                value={formatCurrency(stats.revenue)}
                subtext={isCalcOnly ? "Potential estimation value" : "Total cumulative revenue"}
                icon={IndianRupee}
                accent="emerald"

                isCurrency={false}
              />
              {isCalcOnly ? (
                <StatCard
                  title="Calculations"
                  value={stats.calculations}
                  subtext="AI total estimations"
                  icon={BrainCircuit}
                  accent="blue"

                />
              ) : (
                <StatCard
                  title="Total Patients"
                  value={stats.totalPatients}
                  subtext="Active patient base"
                  icon={Users}
                  accent="blue"

                />
              )}
              <StatCard
                hidden={isCalcOnly}
                title="Completed Plans"
                value={stats.treatmentPlans}
                subtext="Case acceptance rate"
                icon={ClipboardList}
                accent="indigo"

              />
              <StatCard
                hidden={isCalcOnly}
                title="Pending Inquiries"
                value={stats.pendingRequests}
                subtext="Awaiting conversion"
                icon={Bell}
                accent="amber"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trend Area Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{isCalcOnly ? "Estimation Trajectory" : "Revenue Trajectory"}</h2>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {isCalcOnly ? `${timeframe === 'year' ? '12-Month' : '6-Month'} estimated value record` : `${timeframe === 'year' ? '12-Month' : '6-Month'} financial performance record`}
                    </p>
                  </div>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-[140px] text-[11px] font-bold text-slate-600 dark:text-teal-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md h-9">
                      <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent className="z-[60] dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="6months" className="text-[11px] font-bold dark:text-slate-100">Last 6 Months</SelectItem>
                      <SelectItem value="year" className="text-[11px] font-bold dark:text-slate-100">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[320px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevanue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#475569' : '#94a3b8', fontWeight: 600 }} dy={10} minTickGap={15} />
                      <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#475569' : '#94a3b8', fontWeight: 600 }} dx={-10} />
                      <Tooltip
                        cursor={{ stroke: theme === 'dark' ? '#334155' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid ' + (theme === 'dark' ? '#1e293b' : '#e2e8f0'), boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' }}
                        itemStyle={{ fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                        labelStyle={{ fontWeight: 600, color: theme === 'dark' ? '#64748b' : '#64748b', marginBottom: '4px' }}
                        formatter={(val) => [`₹${val.toLocaleString()}`, isCalcOnly ? "Est. Total" : "Revenue"]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRevanue)" activeDot={{ r: 6, fill: '#0d9488', stroke: theme === 'dark' ? '#0f172a' : '#fff', strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Treatment Distribution Pie Chart */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 sm:p-6 flex flex-col shadow-sm">
                <div className="mb-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Procedure Portfolio</h2>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Distribution of clinical treatments</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={procedures.length ? procedures : [{ name: 'No Data', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {(procedures.length ? procedures : [{ name: 'No Data', value: 1 }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid ' + (theme === 'dark' ? '#1e293b' : '#e2e8f0'), boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' }}
                        itemStyle={{ fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Custom Legend */}
                  <div className="w-full mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
                    {procedures.map((entry, index) => (
                      <div key={index} className={`flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400 transition-all ${searchTerm && !entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="truncate">
                          <HighlightText text={entry.name} highlight={searchTerm} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patient/Calculation Bar Chart */}
              <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{isCalcOnly ? "Calculation Volume" : "Patient Conversions"}</h2>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{isCalcOnly ? "Monthly AI estimation activity" : "Monthly consultation growth and data"}</p>
                  </div>
                </div>
                <div className="h-[280px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#475569' : '#94a3b8', fontWeight: 600 }} dy={10} minTickGap={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#475569' : '#94a3b8', fontWeight: 600 }} />
                      <Tooltip
                        cursor={{ stroke: theme === 'dark' ? '#334155' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid ' + (theme === 'dark' ? '#1e293b' : '#e2e8f0'), boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' }}
                        itemStyle={{ fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                        labelStyle={{ fontWeight: 600, color: theme === 'dark' ? '#64748b' : '#64748b', marginBottom: '4px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey={isCalcOnly ? "calculations" : "patients"}
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: theme === 'dark' ? '#0f172a' : '#fff' }}
                        activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: theme === 'dark' ? '#0f172a' : '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}

export default DentistAnalyticsPage
