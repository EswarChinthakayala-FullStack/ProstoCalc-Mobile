import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, MessageSquare, FileText, ChevronRight, MapPin, Calendar, Clock, Sparkles, Brain, IndianRupee, CheckCircle2, Activity, PlayCircle, ClipboardList, Star, Zap, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BackgroundOrbs from '@/components/BackgroundOrbs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import api from '@/services/api'
import { toast } from 'sonner'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/context/ThemeContext'

const StatCard = ({ title, value, subtext, icon: Icon, accent }) => {
  const accents = {
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-500', border: 'border-blue-600/20', bar: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-500', border: 'border-emerald-600/20', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-600/10', text: 'text-amber-500', border: 'border-amber-600/20', bar: 'bg-amber-500' },
    indigo: { bg: 'bg-indigo-600/10', text: 'text-indigo-500', border: 'border-indigo-600/20', bar: 'bg-indigo-500' },
  }
  const t = accents[accent] || accents.blue

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 sm:p-7 hover:shadow-xl hover:border-blue-600/20 transition-all duration-300 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${t.bar} shadow-[0_0_10px_rgba(37,99,235,0.2)]`} />
      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center border ${t.border}`}>
          <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </div>
      </div>
      <h3 className="text-3xl font-black text-foreground tracking-tighter leading-none mb-1.5 tabular-nums">{value}</h3>
      <p className="text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 opacity-70">{title}</p>
      <div className="pt-4 border-t border-border/50">
        <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-md ${t.bar} animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]`} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

/* ─── Clinical Timeline Stages (from PatientClinicalTimeline) ─── */
const TIMELINE_STAGES = [
  { id: 'CONSULTATION_APPROVED', label: 'Consultation Approved', icon: CheckCircle2, desc: 'Initial request validated and confirmed.' },
  { id: 'DIAGNOSIS_COMPLETED', label: 'Diagnosis Completed', icon: FileText, desc: 'Clinical assessment finalized.' },
  { id: 'TREATMENT_PLANNED', label: 'Treatment Planned', icon: ClipboardList, desc: 'Procedures mapped and approved.' },
  { id: 'TREATMENT_STARTED', label: 'Treatment Started', icon: PlayCircle, desc: 'First clinical session initiated.' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: Activity, desc: 'Active procedure execution.' },
  { id: 'FOLLOW_UP', label: 'Follow Up', icon: Clock, desc: 'Post-op observation period.' },
  { id: 'COMPLETED', label: 'Completed', icon: Star, desc: 'Case successfully closed.' },
]

const STATUS_LABELS = {
  'CONSULTATION_APPROVED': 'Consultation Approved',
  'DIAGNOSIS_COMPLETED': 'Diagnosis Completed',
  'TREATMENT_PLANNED': 'Treatment Planned',
  'TREATMENT_STARTED': 'Treatment Started',
  'IN_PROGRESS': 'In Progress',
  'FOLLOW_UP': 'Follow Up',
  'COMPLETED': 'Case Completed'
}

const ClinicalJourney = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [journey, setJourney] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [treatmentPlan, setTreatmentPlan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isCollapsed } = useSidebar()
  const { theme } = useTheme()

  useEffect(() => {
    let intervalId;

    const fetchJourneyData = async (isFirstLoad = false) => {
      if (isFirstLoad) setIsLoading(true);
      try {
        const res = await api.get(`/get_consultation_requests?role=PATIENT&id=${user.id}`);
        if (res.data?.data?.length > 0) {
          const latestJourney = res.data.data[0];
          setJourney(latestJourney);

          // Fetch Timeline
          const timelineRes = await api.get(`/get_timeline?request_id=${latestJourney.id}`);
          if (timelineRes.data?.status === 'success') {
            setTimeline(timelineRes.data.data);
          }

          // Fetch Treatment Plan
          const planRes = await api.get(`/get_treatment_plan?request_id=${latestJourney.id}`);
          if (planRes.data?.status === 'success') {
            setTreatmentPlan(planRes.data.data);
          }
        }
      } catch (error) {
        console.error("Clinical Journey Sync Error:", error);
      } finally {
        if (isFirstLoad) setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchJourneyData(true);
      // Real-time polling every 8 seconds
      intervalId = setInterval(() => fetchJourneyData(false), 8000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.id]);

  if (isLoading) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
    <div className="w-12 h-12 border-t-2 border-r-2 border-blue-600 rounded-md animate-spin" />
    <p className="font-black text-blue-600 tracking-[0.3em] uppercase text-xs animate-pulse">Syncing Diagnostic Node...</p>
  </div>

  if (!journey) return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-primary/10 relative">
     
      <PatientSidebar />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} min-h-screen flex items-center justify-center p-6 relative z-10 w-full`}>
        <div className="bg-card/90 backdrop-blur-3xl rounded-[3.5rem] p-12 text-center max-w-lg border border-border shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-blue-600/10 to-transparent" />
          <div className="flex items-center gap-4 mb-12 relative z-10">
            <PatientSidebarTrigger />
            <div className="flex-1 h-[1px] bg-border opacity-50"></div>
          </div>
          <div className="relative mb-10 group inline-block">
            <div className="absolute inset-0 bg-blue-600/30 blur-[60px] rounded-md group-hover:bg-blue-600/40 transition-all duration-500" />
            <div className="relative w-24 h-24 bg-secondary border border-border rounded-md flex items-center justify-center mx-auto shadow-xl ring-4 ring-white/10 dark:ring-black/10">
              <Brain className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter mb-4 uppercase">Registry Inactive</h1>
          <p className="text-[11px] text-muted-foreground font-black leading-relaxed mb-10 uppercase tracking-[0.2em] max-w-sm mx-auto opacity-80">
            Your medical protocol has not been initiated. Please use the <span className="text-blue-500">Clinic Radar</span> to connect with a verified diagnostic hub.
          </p>
          <Button
            onClick={() => navigate('/patient/clinics')}
            className="w-full rounded-md h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all active:scale-95 text-xs"
          >
            Locate Clinical Hub
          </Button>
        </div>
      </main>
    </div>
  )

  return (
    <div className="flex h-screen bg-background font-sans selection:bg-primary/10 relative overflow-hidden">
      
      <PatientSidebar />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col relative z-10 h-screen overflow-hidden`}>

        {/* ═══ HEADER ═══ */}
        <header className="z-40 bg-background/95 backdrop-blur-md border-b border-border shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-none uppercase">Clinical Journey</h1>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-600/10 border border-emerald-600/20 rounded-md shrink-0">
                      <div className="w-1.5 h-1.5 rounded-md bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[7px] sm:text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Node Sync</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest hidden sm:flex items-center gap-3">
                    <span className="text-blue-600 flex items-center gap-1.5 leading-none">
                      <Activity className="w-3.5 h-3.5" />
                      Active Protocol
                    </span>
                    <span className="opacity-20">/</span>
                    <span className="opacity-60">Real-time Telemetry</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/patient/ai-chat')}
                  className="rounded-md h-9 sm:h-10 border-border bg-secondary/50 text-muted-foreground text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 sm:px-5 hover:bg-blue-600/10 hover:border-blue-600/20 hover:text-blue-500 transition-all"
                >
                  <MessageSquare className="w-4 h-4 sm:mr-2.5" /><span className="hidden sm:inline">Clinic Link</span>
                </Button>
                {treatmentPlan && (
                  <Button
                    onClick={() => navigate(`/patient/consultation/${journey.id}/plan`)}
                    className="rounded-md h-9 sm:h-10 bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 sm:px-5 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <FileText className="w-4 h-4 sm:mr-2.5" /><span className="hidden sm:inline">Vitals Plan</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
       
          <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-20">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Current Phase"
                value={
                  journey.status === 'COMPLETED' ? 'Case Completed' :
                    treatmentPlan ? 'Treatment Planned' :
                      journey.status === 'APPROVED' ? 'Phase: Approved' :
                        'Phase: Requested'
                }
                subtext="Real-time clinical status"
                icon={Activity}
                accent={journey.status === 'COMPLETED' ? 'emerald' : 'blue'}
              />
              <StatCard
                title="Active Steps"
                value={timeline.length + 1}
                subtext="Completed milestones"
                icon={CheckCircle2}
                accent="emerald"
              />
              <StatCard
                title="Plan Value"
                value={treatmentPlan ? `₹${treatmentPlan.total_cost?.toLocaleString()}` : "TBD"}
                subtext="Estimated total value"
                icon={IndianRupee}
                accent="indigo"
              />
              <StatCard
                title="Treatment Class"
                value={treatmentPlan?.items?.[0]?.category || "General"}
                subtext="Primary procedure category"
                icon={Sparkles}
                accent="amber"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {/* ═══ SIMPLIFIED CLINICAL TIMELINE ═══ */}
                <div className="bg-card/80 backdrop-blur-xl rounded-md border border-border shadow-sm p-6 sm:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-600 opacity-80" />
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h2 className="text-xl font-black text-foreground tracking-tighter uppercase mb-1">Clinic Protocol Path</h2>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Real-time Procedural Milestones</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/patient/consultation/${journey.id}/timeline`)}
                      className="rounded-md text-[9px] font-black uppercase tracking-widest h-10 px-5 border-border bg-secondary/50 text-muted-foreground hover:text-blue-500 hover:border-blue-600/30 transition-all active:scale-95"
                    >
                      Telemetry <ChevronRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </div>

                  {/* Simplified Vertical Timeline */}
                  {(() => {
                    const currentStatusId = timeline.length > 0 ? timeline[timeline.length - 1].status : (journey.status === 'APPROVED' ? 'CONSULTATION_APPROVED' : null);
                    const currentIdx = TIMELINE_STAGES.findIndex(s => s.id === currentStatusId);
                    const progressPct = currentIdx < 0 ? 0 : Math.min((currentIdx / (TIMELINE_STAGES.length - 1)) * 100, 100);

                    return (
                      <div className="relative font-sans">
                        {/* Vertical Connector Line */}
                        <div className="absolute left-[21px] top-[14px] bottom-[14px] w-[3px] rounded-md bg-secondary z-0 overflow-hidden">
                          <motion.div
                            className="w-full bg-blue-600 rounded-md"
                            initial={{ height: '0%' }}
                            animate={{ height: `${progressPct}%` }}
                            transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>

                        <div className="relative z-10 space-y-6">
                          {TIMELINE_STAGES.map((stage, i) => {
                            const entry = [...timeline].reverse().find(t => t.status === stage.id);
                            const done = i < currentIdx;
                            const active = i === currentIdx;
                            const pending = i > currentIdx;
                            const Icon = stage.icon;

                            return (
                              <motion.div
                                key={stage.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i, duration: 0.4 }}
                                className="flex items-start gap-0 cursor-default group/line"
                              >
                                {/* Left: Dot Column */}
                                <div className="w-9 flex flex-col items-center shrink-0">
                                  <div
                                    className={`
                                        w-11 h-11 rounded-md flex items-center justify-center border-2 transition-all duration-500 relative z-10
                                        ${done ? 'bg-blue-600 border-blue-500/20 text-white shadow-xl shadow-blue-600/20' : ''}
                                        ${active ? 'bg-foreground border-blue-600 text-background shadow-2xl ring-4 ring-blue-600/10' : ''}
                                        ${pending ? 'bg-card border-border text-muted-foreground/20' : ''}
                                      `}
                                  >
                                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} />}
                                    {active && (
                                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 rounded-md border-2 border-background animate-bounce" />
                                    )}
                                  </div>
                                </div>

                                {/* Right: Content */}
                                <div className={`
                                    flex-1 ml-6 transition-all duration-300
                                    ${pending ? 'opacity-30' : ''}
                                  `}>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h4 className={`text-sm sm:text-base font-black tracking-tight uppercase ${pending ? 'text-muted-foreground' : 'text-foreground'
                                      } group-hover/line:text-blue-500 transition-colors`}>{stage.label}</h4>
                                    {active && (
                                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-600/20">
                                        <Zap className="w-3 h-3" /> Processing
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[11px] font-medium leading-relaxed ${pending ? 'text-muted-foreground/50' : 'text-muted-foreground'} max-w-lg truncate sm:whitespace-normal`}>
                                    {stage.desc}
                                  </p>

                                  {entry && (done || active) && (
                                    <motion.div
                                      className="mt-3 space-y-2.5"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-mdborder border-border">
                                          <Calendar className="w-3 h-3 text-primary" />
                                          {new Date(entry.updated_at || entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        {entry.notes && (
                                          <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-mdborder border-primary/10">
                                            Medical Note Attached
                                          </span>
                                        )}
                                      </div>
                                      {active && entry.notes && (
                                        <div className="bg-secondary/40 backdrop-blur-md border border-border rounded-md p-5 shadow-sm border-l-4 border-l-blue-600 relative overflow-hidden">
                                          <div className="flex items-center gap-2.5 mb-3">
                                            <Brain className="w-4 h-4 text-blue-500" />
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Diagnostic Stream</p>
                                          </div>
                                          <div className="text-[12px] font-bold text-foreground/80 leading-relaxed italic prose prose-slate dark:prose-invert prose-xs max-w-none uppercase tracking-tight">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {entry.notes}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {treatmentPlan && (
                  <div className="bg-card/80 backdrop-blur-xl rounded-md border border-border shadow-sm p-6 sm:p-10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-emerald-600 opacity-80" />
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-1">Clinic Resource Table</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Synchronized Items</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-foreground leading-none tabular-nums">₹ {treatmentPlan.total_cost?.toLocaleString()}</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2">Vitals Total</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {treatmentPlan.items?.map((item, idx) => (
                        <div key={idx}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-md border border-border hover:border-primary/20 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-md flex items-center justify-center shadow-sm border"
                              style={{ backgroundColor: `${item.color_tag || 'var(--primary)'}10`, color: item.color_tag || 'var(--primary)', borderColor: `${item.color_tag || 'var(--primary)'}20` }}
                            >
                              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{item.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.category || 'General'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {treatmentPlan.share_cost_details ? (
                              <p className="text-sm font-bold text-foreground">₹ {item.cost?.toLocaleString()}</p>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-mdborder border-emerald-500/20 uppercase tracking-widest">Covered</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {treatmentPlan.ai_explanation && (
                      <div className="mt-8 p-6 bg-primary/5 rounded-md border border-primary/10 flex gap-4">
                        <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                          <Brain className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-2">Clinical Neural Summary</p>
                          <div className="text-[13px] font-medium text-muted-foreground leading-relaxed italic prose prose-blue dark:prose-invert prose-xs max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {treatmentPlan.ai_explanation}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-primary" />
                  <div className="p-6 border-b border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-5 opacity-60">Primary Clinician</p>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-600 border-4 border-background rounded-md flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-600/30 uppercase shrink-0">
                        {journey.dentist_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-black text-foreground leading-none mb-2 uppercase truncate">Dr. {journey.dentist_name}</h3>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Lead Surgeon (Tier-1)</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-7 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600/10 border border-blue-600/20 rounded-md flex items-center justify-center text-blue-500 shrink-0 shadow-inner">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-2 opacity-60">Operations Base</p>
                        <p className="text-sm font-black text-foreground leading-snug uppercase tracking-tight">{journey.clinic_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600/10 border border-blue-600/20 rounded-md flex items-center justify-center text-blue-500 shrink-0 shadow-inner">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-2 opacity-60">System State</p>
                        <p className="text-sm font-black text-foreground uppercase tracking-widest">{journey.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-secondary/30 border-t border-border">
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/patient/consultation/${journey.id}`)}
                      className="w-full h-11 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:bg-card hover:text-blue-600 transition-all rounded-md border border-dashed border-blue-600/20"
                    >
                      Open Clinical Hub
                    </Button>
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-md p-8 text-white relative overflow-hidden shadow-2xl border border-blue-600/30">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 blur-[100px] rounded-md -mr-24 -mt-24" />
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Protocol Stream</h3>
                  </div>
                  <p className="text-[13px] text-zinc-400 font-bold leading-relaxed mb-8 relative z-10 opacity-80 uppercase tracking-tight">
                    {journey.status === 'PENDING'
                      ? "Consultation request is awaiting review. Your case is currently in the initial triage queue."
                      : treatmentPlan
                        ? `Treatment plan synchronized. Current progression focused on ${treatmentPlan.items?.[0]?.name || 'initial phase'}.`
                        : "Clinical data sync show active engagement. Next priority: Complete Diagnostic Scan Node."}
                  </p>
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className="text-zinc-500">Journey Progress</span>
                      <span className="text-blue-500 text-xl font-black tabular-nums">{journey.status === 'APPROVED' ? (treatmentPlan ? '100' : '50') : '10'}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-md h-3 overflow-hidden p-1 border border-white/5">
                      <motion.div
                        className="bg-blue-600 h-full rounded-md shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${journey.status === 'APPROVED' ? (treatmentPlan ? '100' : '50') : '10'}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClinicalJourney
