import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Pill, Clock, CheckCircle, XCircle, Sparkles, AlertTriangle, Trash2,
  ArrowLeft, Loader2, ChevronDown, ChevronUp, Calendar, Activity,
  TrendingUp, AlertCircle, ArrowRight, History, Plus, Brain
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import NotificationBell from '@/components/NotificationBell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar as UICalendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  getMedications, logMedication, updateMedication, deleteMedication
} from '@/services/api'

// ─── Constants ─────────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#10B981', name: 'Green' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#EC4899', name: 'Pink' },
]
const FREQUENCIES = ['Once a day', 'Twice a day', 'Thrice a day', '4 times a day', 'As needed']

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d, opts) => new Date(d).toLocaleDateString('en-US', opts)
const toDateStr = (d) => {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
const formatTime12 = (timeStr) => {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  let h = parseInt(parts[0]), m = parts[1] || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}
const calcAdherence = (med) => {
  const logs = med.logs || []
  if (logs.length === 0) return 0
  const taken = logs.filter(l => l.status === 'taken').length
  return taken / logs.length
}
const getAIInsight = (adherence, name) => {
  if (adherence > 0.9) return `Excellent consistency! Maintaining your ${name} schedule as prescribed is accelerating your biological recovery markers.`
  if (adherence > 0.7) return `Good progress, but minor gaps detected. Adherence must be above 85% for optimal therapeutic effect.`
  return `Frequent missed doses detected. Syncing intake with a fixed daily habit like breakfast can improve adherence.`
}
const getHistoryTrend = (med) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const trend = []
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    const count = (med.logs || []).filter(l => l.log_date === ds && l.status === 'taken').length
    trend.push({ day: days[d.getDay()], count, date: ds })
  }
  return trend
}

// ─── Stat Card Component (matching PatientConsultations) ────────────────────
const StatCard = ({ title, value, subtext, icon: Icon, accent, trend }) => {
  const accents = {
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20', bar: 'bg-teal-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', bar: 'bg-amber-500' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', bar: 'bg-indigo-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-500', border: 'border-blue-600/20', bar: 'bg-blue-600' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', bar: 'bg-rose-500' },
  }
  const t = accents[accent] || accents.blue

  return (
    <div className="bg-card border border-border rounded-md p-5 sm:p-6 hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none group-hover:text-blue-500 transition-colors uppercase tracking-tight">{value}</h3>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">{title}</p>

      <div className="pt-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-md ${t.bar} opacity-50`} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

// ─── Expandable Medication Card ─────────────────────────────────────────────
const MedicationCard = ({ med, isExpanded, onToggle, onLog, onViewDetails, index }) => {
  const adherence = calcAdherence(med)
  const trend = getHistoryTrend(med)
  const todayStr = toDateStr(new Date())
  const currentLog = (med.logs || []).find(l => l.log_date === todayStr)

  const palette = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
  }
  const colorKey = med.color_tag === '#10B981' ? 'emerald' : med.color_tag === '#F59E0B' ? 'amber' : med.color_tag === '#8B5CF6' ? 'purple' : med.color_tag === '#EF4444' ? 'rose' : 'blue'
  const t = palette[colorKey] || palette.blue

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onToggle}
      className={`bg-card border border-border rounded-md p-5 sm:p-6 flex flex-col relative overflow-hidden group transition-all duration-300 cursor-pointer ${isExpanded ? 'shadow-2xl border-blue-500/30 ring-2 ring-blue-500/10' : 'hover:shadow-lg hover:border-blue-500/20'
        }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300" style={{ backgroundColor: med.color_tag || '#3B82F6' }} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-border/50 bg-background shadow-sm transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${med.color_tag || '#3b82f6'}15`, borderColor: `${med.color_tag || '#3b82f6'}30` }}
          >
            <Pill className="w-5 h-5" style={{ color: med.color_tag || '#3b82f6' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-blue-500 transition-colors uppercase tracking-tight">{med.name}</h3>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5 flex items-center gap-1">
              <Activity className="w-3 h-3 text-muted-foreground/60" /> {med.dosage} • {med.frequency}
            </p>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 border border-border bg-secondary/50 text-muted-foreground group-hover:bg-card shadow-sm`}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 bg-secondary/30 p-3 rounded-md border border-border/50 transition-colors group-hover:bg-blue-600/5">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1 tracking-wider">
            <Clock className="w-3 h-3" /> Schedule
          </span>
          <span className="text-xs font-semibold text-foreground">
            {med.scheduled_time ? formatTime12(med.scheduled_time) : 'TBD'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1 tracking-wider">
            <TrendingUp className="w-3 h-3" /> Adherence
          </span>
          <span className={`text-xs font-semibold ${adherence > 0.8 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {Math.round(adherence * 100)}%
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-auto">
        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black border flex items-center gap-1.5 uppercase transition-all ${adherence > 0.8
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm shadow-emerald-500/5'
          : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm shadow-amber-500/5'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-md ${adherence > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          {adherence > 0.8 ? 'Protocol Optimal' : 'Monitor Compliance'}
        </span>
        <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-black uppercase tracking-widest group-hover:text-blue-500 transition-colors">
          View detail <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 border-t border-border">
              {/* AI Insights Section */}
              <div className="mt-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md p-5 text-white shadow-xl shadow-blue-600/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">AI Clinical Analysis</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {getAIInsight(adherence, med.name)}
                </p>
                {adherence <= 0.7 && (
                  <div className="mt-3 bg-white/10 backdrop-blur-md rounded-md p-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
                    <span className="text-xs font-bold text-white/90">High risk of recovery delay detected. Please prioritize consistent intake.</span>
                  </div>
                )}
              </div>

              {/* Compliance Trend Chart */}
              <div className="mt-5 bg-card rounded-md p-5 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Compliance Trend</h4>
                    <p className="text-xs text-muted-foreground font-medium">Intake frequency over past 7 days</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id={`trendGrad${med.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={med.color_tag || '#3b82f6'} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={med.color_tag || '#3b82f6'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 800 }} className="text-muted-foreground" />
                      <YAxis hide domain={[0, 1.2]} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={med.color_tag || '#3b82f6'}
                        strokeWidth={3}
                        fill={`url(#trendGrad${med.id})`}
                        dot={{ r: 4, fill: 'var(--card)', stroke: med.color_tag || '#3b82f6', strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: med.color_tag || '#3b82f6' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-secondary/30 rounded-md p-4 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled Time</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatTime12(med.scheduled_time) || 'Not set'}</p>
                </div>
                <div className="bg-secondary/30 rounded-md p-4 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {med.start_date ? fmt(med.start_date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => onLog(med.id, 'missed')}
                  disabled={currentLog?.status === 'missed'}
                  className={`flex-1 py-3.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all
                    ${currentLog?.status === 'missed'
                      ? 'bg-rose-500/10 text-rose-500 opacity-60 cursor-not-allowed'
                      : 'bg-rose-500/5 text-rose-500 border border-rose-500/10 hover:bg-rose-500/10 hover:scale-[1.02]'}`}
                >
                  {currentLog?.status === 'missed' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {currentLog?.status === 'missed' ? 'Marked Missed' : 'I Missed It'}
                </button>
                <button
                  onClick={() => onLog(med.id, 'taken')}
                  disabled={currentLog?.status === 'taken'}
                  className={`flex-1 py-3.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all
                    ${currentLog?.status === 'taken'
                      ? 'bg-emerald-500/10 text-emerald-500 opacity-60 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] shadow-lg shadow-emerald-600/30'}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {currentLog?.status === 'taken' ? 'Marked Taken' : "I've Taken It"}
                </button>
              </div>

              {/* View Details Link */}
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails && onViewDetails(med); }}
                className="mt-4 w-full py-3 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-600/5 hover:bg-blue-600/10 flex items-center justify-center gap-2 transition-all duration-200 rounded-md border border-blue-500/10 shadow-sm"
              >
                <ArrowRight className="w-3.5 h-3.5" /> View Full Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const MedicationDetailPage = () => {
  const { medId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()

  const [med, setMed] = useState(null)
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [logSuccess, setLogSuccess] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expandedCards, setExpandedCards] = useState({})

  // Settings states
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [frequency, setFrequency] = useState('')
  const [startDate, setStartDate] = useState(new Date())
  const [durationDays, setDurationDays] = useState(7)
  const [selectedColor, setSelectedColor] = useState('')

  const fetchMedData = useCallback(async () => {
    try {
      setLoading(true) // Show loading state when switching medications
      const resp = await getMedications(user.id)
      setMedications(resp.data || [])
      const found = resp.data.find(m => m.id === parseInt(medId))
      if (found) {
        setMed(found)
        setName(found.name || '')
        setDosage(found.dosage || '')
        setScheduledTime(found.scheduled_time ? found.scheduled_time.substring(0, 5) : '08:00')
        setFrequency(found.frequency || 'Once a day')
        setStartDate(found.start_date ? new Date(found.start_date) : new Date())
        setDurationDays(found.duration_days || 7)
        setSelectedColor(found.color_tag || '#3B82F6')
      } else {
        toast.error('Medication not found')
        navigate('/patient/medication')
      }
    } catch (err) {
      toast.error('Failed to load medication details')
    } finally {
      setLoading(false)
    }
  }, [medId, user.id, navigate])

  useEffect(() => {
    // Scroll to top when medId changes
    window.scrollTo(0, 0)
    fetchMedData()
  }, [medId, fetchMedData])

  // Handle expand/collapse
  const toggleCard = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleLog = async (medicationId, status) => {
    const todayStr = toDateStr(new Date())
    try {
      setLogSuccess(null)
      await logMedication({ medication_id: medicationId, status, date: todayStr })
      setLogSuccess(status)
      toast.success(`Marked as ${status}`)
      await fetchMedData()
      setTimeout(() => setLogSuccess(null), 2000)
    } catch (err) {
      toast.error('Failed to log medication')
    }
  }

  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      const startDateStr = toDateStr(startDate)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + Math.max(0, durationDays - 1))

      const payload = {
        id: med.id,
        name: name || med.name,
        dosage: dosage || med.dosage,
        scheduled_time: scheduledTime.includes(':') ? (scheduledTime.split(':').length === 2 ? scheduledTime + ':00' : scheduledTime) : '08:00:00',
        frequency: frequency || med.frequency || 'Once a day',
        start_date: startDateStr,
        duration_days: parseInt(durationDays) || med.duration_days || 1,
        end_date: toDateStr(endDate),
        color_tag: selectedColor
      }

      console.group('Medication Update Request')
      console.log('Medication ID:', med.id)
      console.log('Payload:', JSON.stringify(payload, null, 2))
      console.groupEnd()

      const res = await updateMedication(payload)
      console.log('Update Response:', res)

      if (res.status === 'success') {
        setMed(prev => ({ ...prev, ...payload }))
        toast.success('Medication updated successfully!')
        await fetchMedData()
      } else {
        toast.error(res.message || 'Server returned an error')
      }
    } catch (err) {
      console.error('Update Error:', err)
      toast.error(err.message || 'Failed to update medication')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMedication(med.id)
      toast.success('Medication removed')
      navigate('/patient/medication')
    } catch (err) {
      toast.error('Failed to delete medication')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!med) return null

  const adherence = calcAdherence(med)
  const trend = getHistoryTrend(med)
  const todayStr = toDateStr(new Date())
  const currentLog = (med.logs || []).find(l => l.log_date === todayStr)

  const stats = {
    totalLogs: (med.logs || []).length,
    takenLogs: (med.logs || []).filter(l => l.status === 'taken').length,
    missedLogs: (med.logs || []).filter(l => l.status === 'missed').length,
    adherence: Math.round(adherence * 100)
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <PatientSidebar />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative overflow-y-auto h-screen`}>
        {/* Grid background pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(var(--border) 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

        {/* Header */}
        <header className="sticky top-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border shrink-0 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <button
                  onClick={() => navigate('/patient/medication')}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-secondary border border-border rounded-md flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-600/10 transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-none">Medication Details</h1>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5 hidden sm:flex items-center gap-2">
                    <span className="text-blue-500 font-semibold flex items-center gap-1 uppercase tracking-wider">
                      <Activity className="w-3 h-3" />
                      Dosage Protocol
                    </span>
                    <span className="text-border">·</span>
                    <span>Patient Portal</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />
                <div className="flex items-center gap-2.5 pl-1 pr-2 sm:pr-3 py-1 rounded-md border border-border bg-card hover:border-blue-500/20 hover:bg-blue-600/5 transition-all cursor-pointer" onClick={() => navigate('/patient/profile')}>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-foreground leading-none">{user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-blue-500 mt-0.5 uppercase tracking-widest">Patient</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <StatCard
                title="Adherence Rate"
                value={`${stats.adherence}%`}
                subtext="Of doses taken on time"
                icon={CheckCircle}
                accent={stats.adherence > 80 ? 'emerald' : 'amber'}
              />
              <StatCard
                title="Total Logs"
                value={stats.totalLogs}
                subtext="All recorded doses"
                icon={History}
                accent="blue"
              />
              <StatCard
                title="Doses Taken"
                value={stats.takenLogs}
                subtext="Successfully logged"
                icon={CheckCircle}
                accent="emerald"
              />
              <StatCard
                title="Doses Missed"
                value={stats.missedLogs}
                subtext="Not taken as scheduled"
                icon={AlertCircle}
                accent="rose"
              />
            </div>

            {/* Current Medication Overview */}
            <div className="bg-card border border-border rounded-md shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ backgroundColor: med.color_tag || 'var(--primary)' }} />

              <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-md flex items-center justify-center shadow-lg border border-border"
                      style={{
                        backgroundColor: `${med.color_tag || '#3B82F6'}10`,
                        borderColor: `${med.color_tag || '#3B82F6'}20`
                      }}
                    >
                      <Pill className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: med.color_tag || '#3B82F6' }} />
                    </div>
                    <div>
                      <Badge className="mb-2 bg-blue-600/10 text-blue-500 border-blue-600/20 uppercase tracking-[0.2em] text-[10px] font-black px-3">
                        Prescribed Protocol
                      </Badge>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">{med.name}</h2>
                      <p className="text-sm font-black text-blue-500 uppercase tracking-widest mt-1">
                        {med.dosage} • {med.frequency}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-secondary/30 p-4 rounded-md border border-border lg:bg-transparent lg:p-0 lg:border-0">
                    <div className="flex flex-col items-center lg:items-end">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Weekly Performance</span>
                      <div className="h-2 w-32 sm:w-40 bg-secondary rounded-md overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${adherence * 100}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 relative">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="34" className="stroke-secondary fill-none" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34"
                          className="fill-none transition-all duration-1000 ease-out"
                          stroke={adherence > 0.8 ? '#10b981' : adherence > 0.5 ? '#3b82f6' : '#f59e0b'}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${adherence * 213.6} 213.6`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base sm:text-lg font-black text-foreground">{Math.round(adherence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="mt-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-32 h-32 rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-white/20 rounded-md backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Brain className="w-4.5 h-4.5 text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Clinical Perspective</span>
                    </div>
                    <p className="text-base sm:text-lg font-medium leading-relaxed max-w-3xl">
                      {getAIInsight(adherence, med.name)}
                    </p>
                    {adherence <= 0.7 && (
                      <div className="mt-5 bg-white/10 backdrop-blur-md rounded-md p-4 flex items-center gap-3 border border-white/10">
                        <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
                        <span className="text-xs font-bold text-white leading-tight">Biotic synchronization at risk. Frequent dosage gaps may extend the recovery timeline.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medication Cards Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">All Medications</h3>
                <span className="text-sm text-muted-foreground font-medium">{medications.length} medications</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                <AnimatePresence>
                  {medications.map((medication, index) => (
                    <MedicationCard
                      key={medication.id}
                      med={medication}
                      index={index}
                      isExpanded={!!expandedCards[medication.id]}
                      onToggle={() => toggleCard(medication.id)}
                      onLog={handleLog}
                      onViewDetails={(med) => navigate(`/patient/medication/${med.id}`)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-card border border-border rounded-md p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-600/10 text-blue-500 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                Medication Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                {/* Column 1: CORE PRESCRIPTION */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Core Prescription</p>
                  <div className="group">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block transition-colors group-focus-within:text-blue-500">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Amoxicillin"
                      className="w-full bg-secondary/50 border border-border h-14 rounded-md px-5 font-black text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500 focus:bg-card transition-all outline-none"
                    />
                  </div>
                  <div className="group">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block transition-colors group-focus-within:text-blue-500">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={e => setDosage(e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full bg-secondary/50 border border-border h-14 rounded-md px-5 font-black text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500 focus:bg-card transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Column 2: CLINICAL SCHEDULE */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Clinical Schedule</p>
                  <div className="group">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block transition-colors group-focus-within:text-blue-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Take Med at
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full bg-secondary/50 border border-border h-14 rounded-md px-5 font-black text-foreground focus:border-blue-500 focus:bg-card transition-all outline-none"
                    />
                  </div>
                  <div className="group">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block transition-colors group-focus-within:text-blue-500 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> Frequency
                    </label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="w-full bg-secondary/50 border border-border h-14 rounded-md font-black text-foreground focus:border-blue-500 focus:bg-card transition-all px-5 shadow-none ring-0 outline-none">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="rounded-md border-border bg-card shadow-2xl w-[var(--radix-select-trigger-width)] py-2">
                        {FREQUENCIES.map(f => (
                          <SelectItem key={f} value={f} className="font-bold text-foreground py-3.5 px-5 focus:bg-blue-600/10 focus:text-blue-500 cursor-pointer rounded-md mx-2">
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Column 3: COURSE DETAILS */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Course Details</p>
                  <div className="group">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block transition-colors group-focus-within:text-blue-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Start Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-black bg-secondary/50 border border-border h-14 rounded-md transition-all hover:bg-card hover:border-blue-500/20 shadow-none px-5",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-md shadow-2xl border-border bg-card" align="start">
                        <UICalendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                          className="p-3 bg-card"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="group">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block transition-colors group-focus-within:text-blue-500">
                      Course Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={e => setDurationDays(parseInt(e.target.value) || 1)}
                      className="w-full bg-secondary/50 border border-border h-14 rounded-md px-5 font-black text-foreground focus:border-blue-500 focus:bg-card transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Color Identifier */}
              <div className="mb-8 p-6 bg-secondary/30 rounded-md border border-border">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 block">
                  <Sparkles className="w-3 h-3 inline mr-1" /> Visual Identifier Tag
                </label>
                <div className="flex flex-wrap gap-4 items-center">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-10 h-10 rounded-md transition-all relative flex items-center justify-center outline-none ring-offset-2 ring-offset-card ${selectedColor === c.hex ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                        }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === c.hex && <CheckCircle className="w-5 h-5 text-white" />}
                    </button>
                  ))}

                  {/* Custom Color Picker */}
                  <div className="relative group">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-12 h-12 rounded-md border-2 border-dashed border-border bg-card flex items-center justify-center transition-all duration-300 group-hover:border-blue-500/50 group-hover:bg-blue-600/5 shadow-sm
                      ${!COLOR_PRESETS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase()) ? 'ring-4 ring-blue-500/20 scale-110' : ''}`}
                      style={!COLOR_PRESETS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase()) ? { backgroundColor: selectedColor, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.2)' } : {}}
                    >
                      {COLOR_PRESETS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase()) ? (
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-md bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest">
                    {COLOR_PRESETS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || 'Custom Color'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 border-t border-border">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-14 rounded-md font-black text-base bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] group"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Activity className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />}
                  Update Clinical Settings
                </Button>

                <div className="shrink-0 w-full sm:w-auto">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full sm:w-auto px-6 py-4 text-sm font-bold text-rose-500 hover:text-rose-600 flex items-center justify-center gap-2 group transition-all"
                    >
                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Stop Tracking
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 items-center bg-rose-500/10 p-2 rounded-md border border-rose-500/20 animate-in fade-in slide-in-from-right-4">
                      <p className="text-[10px] font-black text-rose-600 uppercase px-3">Are you sure?</p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleDelete}
                          className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-md hover:bg-rose-700 shadow-sm"
                        >Yes, delete</button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-card text-muted-foreground text-xs font-bold rounded-md border border-border hover:bg-secondary shadow-sm"
                        >No</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Historical Logs */}
            <div className="bg-card border border-border rounded-md p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Historical Logs
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(med.logs || []).slice(0, 30).map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-md border border-border/50 hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {fmt(log.log_date + 'T00:00:00', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      {log.actual_take_time && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Synced at {formatTime12(log.actual_take_time.split(' ')[1] || log.actual_take_time)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-black uppercase px-2.5 py-1 ${log.status === 'taken'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        }`}
                    >
                      {log.status === 'taken' ? 'Intake Sync' : 'Missed'}
                    </Badge>
                  </div>
                ))}
                {(med.logs || []).length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-secondary/50 rounded-md flex items-center justify-center mx-auto mb-3">
                      <Pill className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">No history detected</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </main>
    </div>
  )
}

export default MedicationDetailPage
