import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  History,
  BrainCircuit,
  Sparkles,
  Zap,
  Activity,
  Mail,
  ArrowLeft,
  CalendarCheck,
  ChevronRight,
  User,
  MapPin,
  Calendar,
  Layers,
  Info,
  Search,
  IndianRupee,
  Users,
  ClipboardList,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { usePatientPortfolio } from '@/hooks/usePatientPortfolio'
import { useAuth } from '@/context/AuthContext'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import UniversalLoader from '@/components/UniversalLoader'
import NotificationBell from '@/components/NotificationBell'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/* ═══════════════════════════════════════════════════════════════════
   UI COMPONENTS (STYLING FROM ANALYTICS)
   ═══════════════════════════════════════════════════════════════════ */

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

const PortfolioStatCard = ({ title, value, subtext, icon: Icon, accent, isCurrency = false }) => {
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-500/20', bar: 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-500/20', bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-500/20', bar: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-500/20', bar: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20', bar: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-500/20', bar: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md p-5 sm:p-6 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-black/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 group relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-5">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110",
          t.bg, t.text, t.border
        )}>
          <Icon className="w-5 h-5" />
        </div>
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

const PatientPortfolioPage = () => {
  const { patientId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme, toggleTheme } = useTheme()

  const { data, loading } = usePatientPortfolio(patientId)
  const [searchQuery, setSearchQuery] = useState('')

  if (loading) return <UniversalLoader text="RETRIEVING PATIENT ARCHIVE..." />

  if (!data) return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md">
        <div className="w-16 h-16 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-600 shadow-sm">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Record Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-black leading-relaxed uppercase tracking-widest">Access to this clinical portfolio has been revoked or the record does not exist within your authorized jurisdiction.</p>
        <Button onClick={() => navigate(-1)} className="bg-zinc-900 dark:bg-teal-600 text-white rounded-md h-11 px-8 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-teal-600/20 active:scale-95 transition-all">
          Return to Safety
        </Button>
      </div>
    </div>
  )

  const { profile, total_amount, visit_count, visits, ai_insights } = data

  const filteredVisits = visits.filter(v =>
    v.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.dentist_notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(v.scheduled_date).toLocaleDateString().includes(searchQuery)
  )

  const filteredAI = ai_insights.filter(ai =>
    ai.explanation_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ai.id.toString().includes(searchQuery)
  )

  return (
    <div className="flex h-screen pb-10 bg-slate-50 dark:bg-black overflow-hidden font-sans transition-colors duration-500">
      <ClinicianSidebar activeTab="Patients" />

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
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 lg:h-20 flex items-center justify-between gap-4">

              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 h-10 w-10 shrink-0 active:scale-90 transition-all shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="min-w-0">
                  <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">{profile.full_name}</h1>
                  <p className="text-[10px] lg:text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-teal-600 dark:text-teal-500 font-black flex items-center gap-1.5 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Portfolio #{profile.id.toString().padStart(4, '0')}
                    </span>
                    <span className="text-slate-300 dark:text-slate-800">·</span>
                    <span className="truncate">{profile.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative hidden md:block w-48 lg:w-64 xl:w-80 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                  <Input
                    className="pl-10 h-11 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-md text-sm font-bold focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all dark:text-white dark:placeholder:text-zinc-800 shadow-inner"
                    placeholder="Search history or diagnostics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-11 h-11 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 hover:border-teal-200 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <NotificationBell />

                <Button
                  onClick={() => navigate(`/dashboard/clinician/ai-chat?patientId=${patientId}`)}
                  className="hidden sm:flex bg-zinc-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white rounded-md h-11 px-5 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
                >
                  AI Advisor
                </Button>
              </div>
            </div>
          </div>
        </header>


        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px]  mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pt-8 sm:pb-32">

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6  lg:space-y-8"
          >
            {/* KPI Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <PortfolioStatCard
                title="Monetary Yield"
                value={`₹${total_amount >= 1000 ? (total_amount / 1000).toFixed(1) + 'K' : total_amount}`}
                subtext="Cumulative conversion value"
                icon={IndianRupee}
                accent="emerald"
                isCurrency={false}
              />
              <PortfolioStatCard
                title="Clinical Frequency"
                value={visit_count}
                subtext="Logged visit iterations"
                icon={CalendarCheck}
                accent="blue"
              />
              <PortfolioStatCard
                title="Patient Age Index"
                value={profile.age || '--'}
                subtext={`${profile.gender || '??'} · Profile Verified`}
                icon={Users}
                accent="indigo"
              />
              <PortfolioStatCard
                title="Neural Vigilance"
                value={profile.medical_history ? "ALERT" : "STABLE"}
                subtext="Contraindication status"
                icon={Activity}
                accent={profile.medical_history ? "rose" : "teal"}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6  lg:gap-8">

              {/* Left Side: Visits & Details */}
              <div className="xl:col-span-2 space-y-6 lg:space-y-8">

                {/* Profile Overview Card (Plain Design) */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md p-6 sm:p-8 relative overflow-hidden shadow-sm transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-400 dark:bg-slate-600 opacity-60" />
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">Patient Intelligence Profile</h2>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Registry Archive v2.4.2</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-900 dark:text-white font-black text-xl shadow-inner">
                      {profile.full_name?.charAt(0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Geo-Location Hub</p>
                      <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-none">{profile.city || 'UNDEFINED'}</p>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-tight">{profile.state || 'GLOBAL ZONE'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Interface Node</p>
                      <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-none truncate max-w-full">{profile.email}</p>
                      <p className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 mt-2 uppercase tracking-widest">Primary Channel</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Neural Contraindications</p>
                      <div className={cn(
                        "text-[10px] font-black px-3 py-1.5 rounded-md border leading-tight inline-flex items-center gap-2",
                        profile.medical_history
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400'
                      )}>
                        {profile.medical_history ? <Zap className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {profile.medical_history || "NO DATA OVERRIDE"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visit History Log */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm relative transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]" />
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/30 dark:bg-zinc-900/20">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Clinical Chronology
                      </h2>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">Iterative History log</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filteredVisits.length === 0 ? (
                      <div className="text-center py-24 px-6">
                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md mx-auto flex items-center justify-center mb-4 transition-transform hover:scale-110">
                          <Search className="w-7 h-7 text-slate-200 dark:text-slate-700" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em]">No Matches Found in History</p>
                      </div>
                    ) : (
                      filteredVisits.map((visit, i) => (
                        <div
                          key={visit.id || i}
                          onClick={() => visit.request_id && navigate(`/dashboard/clinician/consultation/${visit.request_id}`)}
                          className="flex items-center gap-4 sm:gap-6 px-6 py-6 hover:bg-slate-50/80 dark:hover:bg-teal-500/5 transition-all group cursor-pointer relative"
                          title="View detailed consultation record"
                        >
                          <div className="w-14 h-14 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 group-hover:border-teal-200 dark:group-hover:border-teal-500/50 group-hover:shadow-lg transition-all">
                            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                              {new Date(visit.scheduled_date).getDate()}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1">
                              {new Date(visit.scheduled_date).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 font-black uppercase tracking-[0.2em] text-[9px]">
                              <span className={visit.visit_status === 'visited' ? 'text-teal-600 dark:text-teal-400' : 'text-amber-500 dark:text-amber-400'}>
                                {visit.visit_status}
                              </span>
                              <span className="text-slate-200 dark:text-slate-800">/</span>
                              <span className="text-slate-400 dark:text-slate-600 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {visit.scheduled_time || '00:00'} HRS
                              </span>
                            </div>
                            <h4 className="text-[13px] font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                              <HighlightText text={visit.reason} highlight={searchQuery} />
                            </h4>
                            {visit.dentist_notes && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 truncate italic">
                                "<HighlightText text={visit.dentist_notes} highlight={searchQuery} />"
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-3">
                            <span className="hidden md:block text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800 transition-colors group-hover:border-teal-500/30">
                              CY-{new Date(visit.scheduled_date).getFullYear()}
                            </span>
                            <div className="w-9 h-9 rounded-md border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-200 dark:group-hover:border-teal-500/50 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all shadow-sm">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: AI Intelligence */}
              <div className="space-y-6 lg:space-y-8">

                {/* AI Diagnostic Portfolio */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm flex flex-col h-full min-h-[500px] relative transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-slate-50/30 dark:bg-zinc-900/20">
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Neural Diagnostics
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">AI Projections & Synthetics</p>
                  </div>

                  <div className="flex-1 px-5 py-6 overflow-y-auto space-y-4 max-h-[600px] custom-scrollbar">
                    {filteredAI.length > 0 ? filteredAI.map((ai, i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-slate-800 rounded-md p-5 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-[0.1] transition-opacity">
                          <BrainCircuit className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                        </div>

                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50 dark:border-slate-800/50">
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
                            Sess #{ai.id}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                            TS: {new Date(ai.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* ReactMarkdown used for AI explanations */}
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed mb-6 prose prose-slate dark:prose-invert prose-xs max-w-none prose-p:my-0 pb-2">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              text: ({ node, ...props }) => <HighlightText text={props.children} highlight={searchQuery} />,
                              p: ({ node, ...props }) => <p {...props} />,
                            }}
                          >
                            {ai.explanation_text || "_No diagnostic narrative available for this session archive._"}
                          </ReactMarkdown>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter mb-1">Yield Estimation</p>
                            <p className="text-base font-black text-slate-900 dark:text-white flex items-baseline gap-0.5">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">₹</span>{ai.total_estimated_cost.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter mb-1">Reliability</p>
                            <p className="text-sm font-black text-teal-600 dark:text-teal-400 tracking-tight">{((ai.confidence_score || 1.0) * 100).toFixed(0)}% Match</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center py-24 opacity-30 gap-4">
                        <Search className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] text-center max-w-[140px] leading-relaxed">No AI Insights Match Query</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/20 border-t border-slate-100 dark:border-zinc-800">
                    <Button
                      onClick={() => navigate(`/dashboard/clinician/ai-chat?patientId=${patientId}`)}
                      className="w-full bg-zinc-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white rounded-md h-12 text-[10px] font-black uppercase tracking-[0.25em] gap-3 shadow-xl shadow-teal-600/10 transition-all hover:-translate-y-1 active:scale-95"
                    >
                      Access AI Hub <Zap className="w-3.5 h-3.5 fill-current" />
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}

export default PatientPortfolioPage
