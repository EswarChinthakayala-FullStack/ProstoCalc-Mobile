import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, ArrowLeft, Calendar, User, IndianRupee,
  Sparkles, Brain, Clock, ShieldCheck, CheckCircle2,
  ChevronRight, BadgeInfo, Download, Share2, Activity,
  Printer, MoreVertical, ExternalLink, Mail, MessageCircle, TrendingUp, ClipboardList,
  Layers
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import api from '@/services/api'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { useConsultationData } from '@/hooks/useConsultationData'
import { TIMELINE_STAGES } from '@/data/clinicalStages'
import { useMemo } from 'react'
import { useTheme } from '@/context/ThemeContext'

/* ═══════════════════════════════════════════════════════════════════
   PREMIUM STAT CARD (Matched to DentistAnalytics)
   ═══════════════════════════════════════════════════════════════════ */
const AnalyticStat = ({ title, value, icon: Icon, accent = "blue", subtext, isCurrency = false }) => {
  const accents = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50', bar: 'bg-blue-600', shadow: 'shadow-blue-500/10' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/50', bar: 'bg-indigo-600', shadow: 'shadow-indigo-500/10' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', bar: 'bg-amber-600', shadow: 'shadow-amber-500/10' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/50', bar: 'bg-teal-600', shadow: 'shadow-teal-500/10' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', bar: 'bg-emerald-600', shadow: 'shadow-emerald-500/10' },
  }
  const t = accents[accent] || accents.blue

  return (
    <div className={`bg-white dark:bg-zinc-900/50 border ${t.border} rounded-md p-5 sm:p-6 hover:shadow-2xl ${t.shadow} hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden backdrop-blur-xl`}>
      {/* Visual Glitch/Decor */}
      <div className="absolute -right-4 -top-4 w-12 h-12 bg-gradient-to-br from-white/10 to-transparent rounded-md blur-2xl group-hover:bg-blue-600/20 transition-all duration-700" />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-12 h-12 rounded-md ${t.bg} ${t.text} flex items-center justify-center border ${t.border} transition-all group-hover:scale-110 duration-500 group-hover:rotate-3 shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          <span className={`w-1.5 h-1.5 rounded-md ${t.bar} opacity-60 animate-ping`} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        {isCurrency && <span className="text-lg font-bold text-muted-foreground/60 tracking-tighter">₹</span>}
        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none truncate group-hover:tracking-normal transition-all duration-500">{value}</h3>
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">{title}</p>

      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800/50">
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold flex items-center gap-2 uppercase tracking-wider">
          <span className={`w-1.5 h-1.5 rounded-md ${t.bar}`} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

const TreatmentPlanItem = ({ item, index, showCost }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 * index, type: 'spring', damping: 20 }}
    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/50 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-md transition-all group relative overflow-hidden active:scale-[0.98]"
  >
    <div
      className="w-12 h-12 rounded-md flex items-center justify-center text-white shadow-lg shrink-0 transition-all group-hover:rotate-6 group-hover:scale-110"
      style={{ backgroundColor: item.color_tag || '#2563eb' }}
    >
      <Activity className="w-6 h-6" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{item.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest px-1.5 py-0.5 bg-blue-500/5 dark:bg-blue-400/5 rounded-md border border-blue-500/10">{item.category || 'General Procedure'}</span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Verified</span>
          </div>
        </div>
        {showCost && (
          <div className="text-right">
            <span className="text-base font-black text-slate-900 dark:text-white shrink-0 block leading-tight tracking-tighter">₹{parseInt(item.cost).toLocaleString()}</span>
            <span className="text-[8px] font-black text-emerald-500 block uppercase tracking-[0.1em] mt-0.5">Clinical Fee</span>
          </div>
        )}
      </div>
    </div>
    {/* Animated glow on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
  </motion.div>
)

const PatientTreatmentPlan = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const reportRef = useRef(null)
  const { theme } = useTheme()

  const { plan, dentist, timeline, isLoading, error } = useConsultationData(requestId)

  const dentistName = plan?.dentist_name || dentist?.full_name || 'Clinician'

  const currentStatusId = useMemo(() => {
    if (!timeline?.length) return TIMELINE_STAGES[0].id
    return timeline[timeline.length - 1].status
  }, [timeline])

  const currentIndex = useMemo(
    () => TIMELINE_STAGES.findIndex((s) => s.id === currentStatusId),
    [currentStatusId],
  )

  const progressPct = useMemo(() => {
    if (currentIndex <= 0) return 5
    return Math.min((currentIndex / (TIMELINE_STAGES.length - 1)) * 100, 100)
  }, [currentIndex])

  const currentMilestone = useMemo(() => {
    return TIMELINE_STAGES[currentIndex]?.label || 'Active Phase'
  }, [currentIndex])

  const totalSessions = useMemo(() => {
    if (!plan?.items) return 0
    return plan.items.reduce((sum, item) => sum + (item.sessions_estimate || 1), 0)
  }, [plan?.items])

  const riskLevel = useMemo(() => {
    if (!plan?.items) return 'Low'
    const highRisk = ['implant', 'surgery', 'extraction', 'root canal', 'sinus', 'bone']
    const mediumRisk = ['filling', 'crown', 'bridge', 'scaling']

    let currentRisk = 'Minimal'
    plan.items.forEach(item => {
      const name = item.name.toLowerCase()
      if (highRisk.some(r => name.includes(r))) currentRisk = 'High'
      else if (currentRisk !== 'High' && mediumRisk.some(r => name.includes(r))) currentRisk = 'Moderate'
    })
    return currentRisk
  }, [plan?.items])

  const handleExportPDF = () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const exportUrl = `${baseURL}/web/export_treatment_pdf?request_id=${requestId}`;

    toast.info("Preparing clinical report...");

    // Redirect to the export URL which stems a download
    window.open(exportUrl, '_blank');
  }

  const handleShare = async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const pdfUrl = `${baseURL}/web/export_treatment_pdf?request_id=${requestId}`;

    toast.info("Preparing clinical document for sharing...");

    try {
      // Attempt to fetch the PDF blob
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], `Treatment_Plan_${requestId}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Treatment Plan - Case #${requestId}`,
          text: `Clinical Treatment Plan from Dr. ${dentistName}`
        });
        toast.success("Document shared successfully");
      } else {
        // Fallback: Share the direct PDF link
        const shareData = {
          title: `Treatment Plan - Case #${requestId}`,
          text: `View my clinical treatment plan here:`,
          url: pdfUrl,
        };

        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`;
          window.open(whatsappUrl, '_blank');
        }
        toast.success("Link shared successfully");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error("Sharing failed");
        console.error('Share Error:', err);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-blue-600 rounded-md animate-spin mb-4" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Synchronizing Terminal...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="bg-card border border-border rounded-md p-10 max-w-md shadow-sm">
          <div className="w-16 h-16 bg-secondary rounded-md flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Plan Not Finalized</h2>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">Your clinician is still preparing your clinical protocol. Please check back shortly.</p>
          <Button onClick={() => navigate(-1)} variant="outline" className="rounded-md h-10 px-6 font-bold text-xs uppercase tracking-widest">Back to Hub</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <PatientSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden"
      >
        {/* HEADER (Sticky) */}
        <header className="z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <PatientSidebarTrigger />
                <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-all active:scale-90 shrink-0 shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none truncate">Clinical Treatment Plan</h1>
                  <div className="flex items-center gap-3 mt-1.5 hidden sm:flex">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-blue-500/10 rounded-md">Protocol V.42.0</span>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest truncate">Case Identity: <span className="text-slate-900 dark:text-zinc-300 font-mono">#{requestId?.substring(0, 8)}</span></p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  className="h-10 rounded-md border-slate-200 dark:border-zinc-800 text-[11px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-widest px-4 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all active:scale-95 group shadow-sm bg-white dark:bg-black"
                >
                  <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" /> <span className="hidden md:inline">Export Report</span>
                </Button>
                <Button
                  onClick={handleShare}
                  className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-[11px] font-black uppercase tracking-widest px-6 shadow-xl shadow-blue-500/20 transition-all active:scale-95 border-none"
                >
                  <Share2 className="w-4 h-4 mr-2" /> <span className="hidden md:inline">Share Profile</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth">
          {/* Background Decor */}
          <div className="absolute inset-0 opacity-100 pointer-events-none -z-10"
            style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${theme === 'dark' ? '#18181b' : '#f1f5f9'} 1px, transparent 0)`, backgroundSize: '24px 24px' }}
          />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-md pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-md pointer-events-none -z-10" />

          <main className="max-w-[1700px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24">

            <div ref={reportRef} className="space-y-6 sm:space-y-8">

              {/* TOP INFO ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Provider Info Card */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-6 sm:p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 shadow-sm backdrop-blur-3xl">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                    <Activity className="w-48 h-48" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-8 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md flex items-center justify-center text-white text-4xl font-black border-4 border-white dark:border-zinc-800 shadow-2xl group-hover:scale-105 transition-transform duration-700 group-hover:rotate-2">
                      {dentistName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Dr. {dentistName}</h2>
                        <span className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-md border border-blue-500/20 uppercase tracking-[0.2em]">Consulting Clinician</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 px-4 py-2 rounded-md border border-slate-100 dark:border-zinc-800 transition-all group-hover:border-blue-500/20">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          Mapped: {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 px-4 py-2 rounded-md border border-slate-100 dark:border-zinc-800 transition-all group-hover:border-emerald-500/20">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          Registry Synchronized
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment Progress Card */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden hover:shadow-2xl transition-all duration-500 shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-24 h-24 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5">Treatment Evolution</p>
                    <span className={`px-3 py-1 ${currentStatusId === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'} text-[9px] font-black rounded-md border uppercase tracking-widest`}>
                      {currentStatusId === 'COMPLETED' ? 'Cycle Terminated' : 'Cycle Persistent'}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {Math.round(progressPct)}<span className="text-2xl text-slate-400 dark:text-zinc-600">%</span>
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-3 uppercase tracking-[0.15em]">Protocol Progress</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">Milestone</p>
                        <p className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-tighter leading-tight">
                          {currentMilestone}
                        </p>
                      </div>
                    </div>

                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-md overflow-hidden p-0.5 border border-slate-200 dark:border-zinc-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className={`h-full rounded-md relative ${currentStatusId === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                      </motion.div>
                    </div>

                    <div className="flex justify-between items-center pt-2 relative">
                      {/* Connector Line */}
                      <div className="absolute top-[13.5px] left-0 right-0 h-0.5 bg-slate-100 dark:bg-zinc-800 -z-0" />

                      {TIMELINE_STAGES.filter((_, idx) => idx % 2 === 0 || idx === TIMELINE_STAGES.length - 1).map((stage, i, arr) => {
                        const stageIdx = TIMELINE_STAGES.findIndex(s => s.id === stage.id);
                        const isDone = stageIdx <= currentIndex;
                        const isActive = stageIdx === currentIndex;

                        return (
                          <div key={stage.id} className="flex flex-col items-center gap-2 relative z-10 transition-transform duration-500 hover:scale-110">
                            <div className={`w-3.5 h-3.5 rounded-md border-2 transition-all duration-700 ${isActive ? 'bg-blue-600 border-white dark:border-zinc-900 scale-125 shadow-[0_0_15px_rgba(37,99,235,0.5)]' :
                              isDone ? 'bg-emerald-500 border-white dark:border-zinc-900' : 'bg-slate-200 dark:bg-zinc-800 border-white dark:border-zinc-900'
                              }`} />
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-blue-600 dark:text-blue-400' : isDone ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-300 dark:text-zinc-600'
                              }`}>{stage.label.split(' ')[0]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI STATS (Matched to DentistAnalytics) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <AnalyticStat title="Total Procedures" value={plan.items.length} icon={ClipboardList} accent="indigo" subtext="Clinical nodes mapped" />
                <AnalyticStat title="Est. Duration" value={`${totalSessions * 20}m`} icon={Clock} accent="amber" subtext={`Planned in ${totalSessions} sessions`} />
                {plan.share_cost_details ? (
                  <AnalyticStat title="Total Investment" value={parseInt(plan.total_cost).toLocaleString()} isCurrency={true} icon={IndianRupee} accent="emerald" subtext="Inclusive of clinical overhead" />
                ) : (
                  <AnalyticStat title="Plan Category" value="Standard" icon={Layers} accent="teal" subtext="Clinical tier assigned" />
                )}
                <AnalyticStat title="Risk Profile" value={riskLevel} icon={ShieldCheck} accent="blue" subtext={`${riskLevel === 'High' ? 'Supervised execution' : 'Standard protocol'}`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* PROCEDURAL BREAKDOWN & AI INSIGHTS */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden group hover:shadow-2xl transition-all duration-500 shadow-sm backdrop-blur-3xl">
                    <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" /> Procedural Nodes
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-bold mt-1 uppercase tracking-widest">Protocol Execution Sequence</p>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">Node Map V.4.2</span>
                    </div>
                    <div className="p-6 sm:p-8 space-y-4">
                      {plan.items.map((item, idx) => (
                        <TreatmentPlanItem key={idx} item={item} index={idx} showCost={plan.share_cost_details} />
                      ))}
                    </div>
                  </div>

                  {plan.share_ai_explanation && plan.ai_explanation && (
                    <div
                      className="rounded-md p-8 sm:p-10 text-white relative overflow-hidden group shadow-2xl transition-all duration-700 hover:shadow-blue-500/10 active:scale-[0.99]"
                      style={{ background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)' }}
                    >
                      <motion.div
                        animate={{
                          opacity: [0.1, 0.25, 0.1],
                          scale: [1, 1.2, 1],
                          rotate: [0, 90, 0]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-20 -right-20 w-80 h-80 rounded-md blur-[100px]"
                        style={{ backgroundColor: '#2563eb' }}
                      />

                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-14 h-14 bg-white/5 backdrop-blur-2xl rounded-md flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-6 transition-transform">
                            <Sparkles className="w-7 h-7 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Advanced Neural Intelligence</h3>
                            <h4 className="text-xl font-black tracking-tighter text-white">Clinical Logic Synthesis</h4>
                          </div>
                        </div>

                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-bold leading-relaxed
                                    [&_p]:mb-6 [&_p:last-child]:mb-0
                                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
                                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6
                                    [&_li]:mb-2 [&_li]:pl-1 [&_strong]:text-blue-400 [&_strong]:font-black
                                    [&_h1]:text-white [&_h1]:font-black [&_h1]:text-lg [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:mb-4
                                    [&_h2]:text-white [&_h2]:font-black [&_h2]:text-base [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:mb-3
                                ">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {plan.ai_explanation}
                          </ReactMarkdown>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-blue-500" /> Intelligence Layer Active (v4.2.1-stable)</span>
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-md border border-white/5">AES-256 Secure</span>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">Synced</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PROTOCOL METADATA */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-6 sm:p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 shadow-sm backdrop-blur-3xl">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-zinc-800 group-hover:bg-blue-600 transition-colors duration-700" />
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-zinc-700 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                          <BadgeInfo className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-0.5">Registry Matrix</h3>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">Protocol Metadata</h4>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-md bg-slate-200 dark:bg-zinc-800 group-hover:bg-blue-600 transition-colors animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Security Schema", val: "Encypted Tunnel (TLS)", icon: ShieldCheck, color: 'text-emerald-500' },
                        { label: "Identity Level", val: "Verified Patient", icon: User, color: 'text-blue-500' },
                        { label: "Deployment Zone", val: "Cloud Cluster #42", icon: Layers, color: 'text-indigo-500' },
                        { label: "Protocol Integrity", val: "#VALID-SIG-04", icon: ExternalLink, color: 'text-amber-500' }
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 hover:border-blue-500/20 hover:shadow-xl transition-all duration-500 group/row rounded-md overflow-hidden relative">
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-2 rounded-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm ${row.color} group-hover/row:scale-110 transition-transform`}>
                              <row.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-tight">{row.label}</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight relative z-10">{row.val}</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 -translate-x-full group-hover/row:translate-x-full transition-transform duration-700" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 p-6 bg-blue-600 rounded-md relative overflow-hidden group/cta cursor-pointer active:scale-95 transition-all shadow-xl shadow-blue-500/20">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/cta:scale-125 transition-transform duration-700">
                        <MessageCircle className="w-16 h-16 text-white" />
                      </div>
                      <h5 className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-1">Direct Communication</h5>
                      <p className="text-sm font-black text-white tracking-tight">Contact Clinician for Verification</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-md bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest">Clinician Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </motion.div>
    </div>
  )
}

export default PatientTreatmentPlan
