import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MessageSquare,
  User,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  FileText,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim() || !text) return <span>{text || ""}</span>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-teal-100 dark:bg-teal-800 text-teal-900 dark:text-teal-100 rounded-[2px] px-0.5 font-bold no-underline inline-block leading-tight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

const StatusBadge = ({ status, isPostponed }) => {
  const config = {
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      icon: AlertTriangle
    },
    APPROVED: {
      label: 'Scheduled',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      icon: CalendarCheck
    },
    REJECTED: {
      label: 'Declined',
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
      icon: XCircle
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-teal-50 dark:bg-teal-900/30',
      text: 'text-teal-700 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800',
      dot: 'bg-teal-500',
      icon: CheckCircle2
    }
  }

  const c = config[status] || config.PENDING
  const StatusIcon = c.icon

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <div className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${c.bg} ${c.text} ${c.border}`}>
        <span className={`w-1.5 h-1.5 rounded-md ${c.dot} animate-pulse`} />
        {c.label}
      </div>
      {isPostponed && (
        <span className="text-[8px] sm:text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-widest">
          Rescheduled
        </span>
      )}
    </div>
  )
}

/* ─── Priority Indicator Bar ─────────────────────────────────────── */
const PriorityBar = ({ status }) => {
  const colors = {
    PENDING: 'bg-amber-400',
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-rose-400',
    COMPLETED: 'bg-teal-500'
  }
  return <div className={`absolute top-0 left-0 w-full h-[3px] sm:h-[3px] ${colors[status] || 'bg-slate-200'} transition-colors`} />
}

const ConsultationRequestManager = ({ externalSearchTerm = null, requests = [], isLoading = false, respond }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [internalSearchTerm, setInternalSearchTerm] = useState('')
  const searchTerm = externalSearchTerm !== null ? externalSearchTerm : internalSearchTerm
  const setSearchTerm = externalSearchTerm !== null ? () => { } : setInternalSearchTerm
  const [filterStatus, setFilterStatus] = useState('ALL')

  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRespondAction = async (requestId, status) => {
    if (status === 'APPROVED') {
      const req = requests.find(r => r.id === requestId)
      setSelectedRequest(req)
      setIsSchedulingOpen(true)
      return
    }
    await respond(requestId, status)
  }

  const handleScheduleConfirm = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select date and time")
      return
    }

    setIsSubmitting(true)
    const success = await respond(selectedRequest.id, 'APPROVED', {
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      duration_minutes: parseInt(duration)
    })
    setIsSubmitting(false)
    if (success) setIsSchedulingOpen(false)
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.request_message?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'ALL' || req.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-5 sm:space-y-6 w-full">
      {/* ═══ TOOLBAR ═══ */}
      <div className="bg-white dark:bg-zinc-900/10 border border-slate-200 dark:border-zinc-800 rounded-md p-4 sm:p-5 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-900 dark:bg-teal-500" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-slate-900 dark:bg-teal-600 flex items-center justify-center text-teal-400 dark:text-white shrink-0 shadow-sm">
                <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span>Consultation Registry</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-teal-500 mt-1 uppercase tracking-widest ml-[42px] sm:ml-[46px]">
              {filteredRequests.length} Active {filteredRequests.length === 1 ? 'Node' : 'Nodes'} · Clinical Waitlist
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!externalSearchTerm && (
              <div className="relative flex-1 sm:flex-none sm:w-56 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-teal-500/50" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 border-slate-200 dark:border-zinc-800 rounded-md bg-slate-50 dark:bg-zinc-900/30 dark:text-white dark:placeholder:text-zinc-600 focus:bg-white dark:focus:bg-zinc-900/50 shadow-sm focus:ring-teal-500/10 focus:border-teal-400 transition-all"
                />
              </div>
            )}
            <div className="w-40 sm:w-44 shrink-0">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 rounded-md border-slate-200 dark:border-zinc-800 font-bold text-xs sm:text-sm text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="z-[100] dark:bg-zinc-950 dark:border-zinc-800">
                  <SelectItem value="ALL" className="font-bold py-2 text-xs dark:text-zinc-100">All Nodes</SelectItem>
                  <SelectItem value="PENDING" className="font-bold py-2 text-xs dark:text-zinc-100">Pending</SelectItem>
                  <SelectItem value="APPROVED" className="font-bold py-2 text-xs dark:text-zinc-100">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED" className="font-bold py-2 text-xs dark:text-zinc-100">Completed</SelectItem>
                  <SelectItem value="REJECTED" className="font-bold py-2 text-xs dark:text-zinc-100">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ REQUEST CARDS ═══ */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white/40 dark:bg-zinc-900/10 backdrop-blur-sm rounded-md border border-slate-100 dark:border-zinc-800">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600 animate-spin mb-4" />
            <p className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] text-[9px] sm:text-[10px]">Synchronizing clinical waitlist...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white dark:bg-zinc-900/10 rounded-md border border-dashed border-slate-200 dark:border-zinc-800 text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-zinc-900/30 rounded-md flex items-center justify-center mb-4 border border-slate-100 dark:border-zinc-800">
              <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7 text-slate-200 dark:text-zinc-800" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">No Consultation Nodes</h3>
            <p className="text-slate-400 dark:text-zinc-500 text-[10px] sm:text-xs font-medium mt-1 uppercase tracking-widest">Registry is currently clear</p>
          </div>
        ) : (
          filteredRequests.map((req, idx) => (
            <motion.div
              layout={false}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              key={req.id}
              className="group bg-white dark:bg-zinc-900/10 rounded-md border border-slate-200 dark:border-zinc-800 hover:border-teal-300/60 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-teal-600/5 transition-all duration-200 overflow-hidden relative shadow-sm"
            >
              <PriorityBar status={req.status} />

              <div className="p-4 sm:p-5 lg:p-6">
                {/* ── Mobile Layout (stacked) ── */}
                <div className="flex flex-col gap-4 lg:hidden">
                  {/* Row 1: Avatar + Name + Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:border-teal-200 dark:group-hover:border-zinc-700 group-hover:from-teal-50 dark:group-hover:from-zinc-800 group-hover:to-teal-100 dark:group-hover:to-zinc-900 transition-all shadow-sm">
                      <User className="w-5 h-5 text-slate-400 dark:text-zinc-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                          <HighlightText text={req.patient_name} highlight={searchTerm} />
                        </h4>
                        <StatusBadge status={req.status} isPostponed={!!req.rescheduled_from} />
                      </div>
                      <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-teal-500">
                          <Calendar className="w-3 h-3 text-teal-500" />
                          {new Date(req.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-teal-500">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                          {formatRelativeTime(req.requested_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Message */}
                  {req.request_message && (
                    <div className="p-3 bg-slate-50/80 dark:bg-teal-900/40 rounded-md border border-slate-100 dark:border-teal-800 flex items-start gap-2.5 group-hover:bg-teal-50/10 dark:group-hover:bg-teal-900/60 group-hover:border-teal-100/50 dark:group-hover:border-teal-700 transition-colors shadow-inner">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-teal-200 italic leading-relaxed line-clamp-2">
                        "<HighlightText text={req.request_message} highlight={searchTerm} />"
                      </p>
                    </div>
                  )}

                  {/* Row 3: Actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {req.status === 'PENDING' ? (
                      <>
                        <Button
                          onClick={() => handleRespondAction(req.id, 'APPROVED')}
                          className="flex-1 h-9 sm:h-10 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-bold rounded-md shadow-md shadow-teal-500/20 active:scale-[0.98] transition-all text-[9px] sm:text-[10px] uppercase tracking-widest px-3"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 mr-1.5" /> Schedule
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleRespondAction(req.id, 'REJECTED')}
                          className="h-9 sm:h-10 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-300 font-bold rounded-md transition-all text-[9px] sm:text-[10px] uppercase tracking-widest px-3 sm:px-4"
                        >
                          <XCircle className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Decline</span>
                        </Button>
                      </>
                    ) : req.status === 'APPROVED' || req.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-2 sm:gap-3 w-full">
                        {req.scheduled_date && (
                          <div className="flex-1 bg-emerald-50/60 dark:bg-emerald-900/20 p-2 sm:p-2.5 px-3 rounded-md border border-emerald-100 dark:border-emerald-800 flex items-center gap-2 shadow-sm">
                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[7px] sm:text-[8px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">Timeline</p>
                              <p className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                                {new Date(req.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {req.scheduled_time?.slice(0, 5)}
                              </p>
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() => navigate(`/dashboard/clinician/consultation/${req.id}`)}
                          className="h-9 sm:h-10 bg-slate-900 dark:bg-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-800 text-white font-bold rounded-md shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all text-[9px] sm:text-[10px] uppercase tracking-widest px-3 sm:px-5 gap-1.5 shrink-0 border border-transparent dark:border-zinc-800"
                        >
                          <span className="hidden sm:inline">Patient Hub</span>
                          <span className="sm:hidden">Hub</span>
                          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-teal-900/30 text-slate-400 dark:text-teal-700 font-bold text-[9px] rounded-md tracking-[0.2em] uppercase w-full text-center border border-slate-100 dark:border-teal-800 shadow-inner">
                        Record Archived
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Desktop Layout (horizontal) ── */}
                <div className="hidden lg:flex items-center justify-between gap-6">
                  {/* Patient Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
                    <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:border-teal-200 dark:group-hover:border-zinc-700 group-hover:from-teal-50 dark:group-hover:from-zinc-800 group-hover:to-teal-100 dark:group-hover:to-zinc-900 transition-all duration-200 shadow-sm">
                      <User className="w-6 h-6 xl:w-7 xl:h-7 text-slate-400 dark:text-zinc-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base xl:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                          <HighlightText text={req.patient_name} highlight={searchTerm} />
                        </h4>
                        <StatusBadge status={req.status} isPostponed={!!req.rescheduled_from} />
                      </div>
                      <div className="flex items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-teal-500 uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          {new Date(req.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-teal-500 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest border-l border-slate-200 dark:border-teal-800 pl-4">
                          {formatRelativeTime(req.requested_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {req.request_message && (
                    <div className="flex-1 max-w-md xl:max-w-lg">
                      <div className="p-3 bg-slate-50/80 dark:bg-zinc-900/40 rounded-md border border-slate-100 dark:border-zinc-800 flex items-start gap-3 group-hover:bg-teal-50/10 dark:group-hover:bg-zinc-900/60 group-hover:border-teal-100/50 dark:group-hover:border-zinc-700 transition-colors shadow-inner">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300 italic leading-relaxed line-clamp-2">
                          "<HighlightText text={req.request_message} highlight={searchTerm} />"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-3">
                    {req.status === 'PENDING' ? (
                      <>
                        <Button
                          onClick={() => handleRespondAction(req.id, 'APPROVED')}
                          className="h-10 bg-teal-600 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 text-white font-bold rounded-md px-5 shadow-lg shadow-teal-500/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                        >
                          <CalendarCheck className="w-4 h-4 mr-2" /> Schedule Slot
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleRespondAction(req.id, 'REJECTED')}
                          className="text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-300 font-bold rounded-md px-5 h-10 transition-all text-[10px] uppercase tracking-widest"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Decline
                        </Button>
                      </>
                    ) : req.status === 'APPROVED' || req.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-4">
                        {req.scheduled_date && (
                          <div className="bg-emerald-50/60 dark:bg-emerald-900/20 p-2.5 px-4 rounded-md border border-emerald-100 dark:border-emerald-800 flex flex-col justify-center shadow-sm">
                            <label className="text-[8px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-0.5">Timeline</label>
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(req.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {req.scheduled_time?.slice(0, 5)}</span>
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() => navigate(`/dashboard/clinician/consultation/${req.id}`)}
                          className="h-10 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold rounded-md px-6 shadow-xl shadow-slate-900/10 active:scale-95 transition-all text-[10px] uppercase tracking-widest gap-2"
                        >
                          Launch Patient Hub
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-teal-900/30 text-slate-400 dark:text-teal-700 font-bold text-[9px] rounded-md tracking-[0.2em] uppercase border border-slate-100 dark:border-teal-800 shadow-inner">
                        Record Archived
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ═══ RESULTS COUNT ═══ */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="text-center py-2">
          <p className="text-[10px] font-bold text-slate-400 dark:text-teal-500 uppercase tracking-widest">
            Showing {filteredRequests.length} of {requests.length} consultation nodes
          </p>
        </div>
      )}

      {/* ═══ SCHEDULING CONSOLE ═══ */}
      <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-md p-0 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl overflow-hidden font-sans">
          <div className="h-1 bg-teal-500 w-full" />
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <div className="p-2 bg-teal-50 dark:bg-zinc-900/50 text-teal-600 dark:text-teal-400 rounded-md shrink-0 border border-teal-100 dark:border-zinc-800 shadow-sm">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                Schedule Assessment
              </DialogTitle>
              <DialogDescription className="text-slate-400 dark:text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest pt-2">
                Locking slot for Node-{selectedRequest?.id?.toString().padStart(4, '0')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-teal-600 uppercase tracking-widest ml-1">Proposed Visit Date</label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-11 sm:h-12 border-slate-200 dark:border-teal-800 rounded-md font-bold text-slate-700 dark:text-teal-100 bg-slate-50 dark:bg-teal-900/30 focus:bg-white dark:focus:bg-teal-900/50 transition-all shadow-inner text-sm dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-teal-600 uppercase tracking-widest ml-1">Clinical Commencement</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-11 sm:h-12 border-slate-200 dark:border-teal-800 rounded-md font-bold text-slate-700 dark:text-teal-100 bg-slate-50 dark:bg-teal-900/30 focus:bg-white dark:focus:bg-teal-900/50 transition-all shadow-inner text-sm dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-teal-600 uppercase tracking-widest ml-1">Slot Duration</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="h-11 sm:h-12 rounded-md border-slate-200 dark:border-teal-800 font-bold text-slate-700 dark:text-teal-200 bg-slate-50 dark:bg-teal-900/30 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="z-[110] dark:bg-teal-900 dark:border-teal-800">
                    <SelectItem value="15" className="font-bold py-3 text-xs dark:text-teal-100">15 Min (Assessment)</SelectItem>
                    <SelectItem value="30" className="font-bold py-3 text-xs dark:text-teal-100">30 Min (Diagnostic)</SelectItem>
                    <SelectItem value="45" className="font-bold py-3 text-xs dark:text-teal-100">45 Min (Surgical Review)</SelectItem>
                    <SelectItem value="60" className="font-bold py-3 text-xs dark:text-teal-100">60 Min (Full Clinical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-8 sm:mt-10">
              <Button
                variant="ghost"
                onClick={() => setIsSchedulingOpen(false)}
                className="flex-1 h-11 sm:h-12 font-bold text-slate-400 dark:text-teal-500 uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-slate-50 dark:hover:bg-teal-900/50 rounded-md transition-all"
              >
                Abort
              </Button>
              <Button
                onClick={handleScheduleConfirm}
                disabled={isSubmitting}
                className="flex-[2] bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold rounded-md h-11 sm:h-12 shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20 uppercase tracking-widest text-[9px] sm:text-[10px] transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Slot & Alert'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const ClipboardCheck = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></svg>
)

export default ConsultationRequestManager
