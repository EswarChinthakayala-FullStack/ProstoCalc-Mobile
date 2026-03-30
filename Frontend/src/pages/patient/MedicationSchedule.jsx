import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Pill, Calendar, Clock, Plus, ChevronLeft, ChevronRight, ArrowLeft,
  Loader2, CheckCircle, XCircle, Sparkles, AlertTriangle, Trash2,
  Activity, TrendingUp, X, ChevronDown, Search, ArrowDownUp, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import NotificationBell from '@/components/NotificationBell'
import api, {
  getMedications, logMedication, addMedication,
  updateMedication, deleteMedication
} from '@/services/api'

// ─── Constants ─────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const COLOR_PRESETS = [
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#10B981', name: 'Green' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#EC4899', name: 'Pink' },
]
const FREQUENCIES = ['Once a day', 'Twice a day', 'Thrice a day', 'As needed']
const DURATION_PRESETS = [7, 14, 30]

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d, opts) => new Date(d).toLocaleDateString('en-US', opts)
const isSameDay = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}
const toDateStr = (d) => {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
const isToday = (d) => isSameDay(d, new Date())

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const days = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

function getMedsForDate(medications, date) {
  if (!date) return []
  const target = toDateStr(date)
  return medications.filter(med => {
    if (!med.start_date) return false
    const start = med.start_date.substring(0, 10)
    if (target < start) return false
    if (med.end_date) {
      const end = med.end_date.substring(0, 10)
      if (target > end) return false
    } else if (med.duration_days) {
      const s = new Date(start)
      s.setDate(s.getDate() + med.duration_days - 1)
      if (target > toDateStr(s)) return false
    } else {
      if (target !== start) return false
    }
    return true
  })
}

function calcAdherence(med) {
  const logs = med.logs || []
  if (logs.length === 0) return 0
  const taken = logs.filter(l => l.status === 'taken').length
  return taken / logs.length
}

function formatTime12(timeStr) {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  let h = parseInt(parts[0]), m = parts[1] || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

function getAIInsight(adherence, name) {
  if (adherence > 0.9) return `Excellent consistency! Maintaining your ${name} schedule as prescribed is accelerating your biological recovery markers.`
  if (adherence > 0.7) return `Good progress, but minor gaps detected. Adherence must be above 85% for optimal therapeutic effect.`
  return `Frequent missed doses detected. Syncing intake with a fixed daily habit like breakfast can improve adherence.`
}

function getHistoryTrend(med) {
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

// ─── Calendar Day Cell ─────────────────────────────────────────────────────────
const DayCell = ({ date, isSelected, medications, onClick }) => {
  if (!date) return <div className="w-full aspect-square" />
  const day = date.getDate()
  const today = isToday(date)
  const meds = getMedsForDate(medications, date)

  return (
    <button
      onClick={() => onClick(date)}
      className={`w-full aspect-square rounded-md flex flex-col items-center justify-center gap-1 transition-all duration-200 relative group
        ${isSelected
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
          : today
            ? 'bg-blue-600/10 text-blue-500 border-2 border-blue-600/20 hover:bg-blue-600/20 hover:scale-105'
            : 'hover:bg-secondary text-foreground'
        }`}
    >
      <span className={`text-sm font-black ${isSelected ? 'text-white' : ''}`}>{day}</span>
      <div className="flex gap-0.5">
        {meds.slice(0, 4).map((m, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-md" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : (m.color_tag || '#3b82f6') }} />
        ))}
      </div>
    </button>
  )
}

// ─── Premium Analytics-style Stat Card ─────────────────────────────────────────────
const StatCard = ({ title, value, subtext, icon: Icon, accent, trend }) => {
  const accents = {
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-500', border: 'border-blue-600/20', bar: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', bar: 'bg-amber-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', bar: 'bg-purple-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', bar: 'bg-rose-500' },
  }
  const t = accents[accent] || accents.blue

  return (
    <div className="bg-card border border-border rounded-md p-5 sm:p-6 hover:shadow-lg hover:border-blue-500/20 transition-all duration-200 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-md ${t.bg} ${t.text} flex items-center justify-center ${t.border} border shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-[10px] font-bold ${trend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-0.5 rounded-md border ${trend >= 0 ? 'border-emerald-100' : 'border-rose-100'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none truncate group-hover:text-blue-500 transition-colors uppercase tracking-tight">{value}</h3>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">{title}</p>

      {subtext && (
        <div className="pt-3 border-t border-border text-[11px] text-muted-foreground font-medium truncate">
          <p className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-md ${t.bar} opacity-50`} />
            {subtext}
          </p>
        </div>
      )}
    </div>
  )
}

const MedicationCard = ({ med, onSelect, onLog, selectedDate }) => {
  const adherence = calcAdherence(med)
  const lastTaken = (med.logs || []).find(l => l.status === 'taken')
  const dateStr = selectedDate ? toDateStr(selectedDate) : null
  const currentLog = (med.logs || []).find(l => l.log_date === dateStr)

  const todayVal = toDateStr(new Date())
  const isLockedDate = dateStr && dateStr !== todayVal

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-md overflow-hidden relative flex flex-col`}
      onClick={() => onSelect(med)}
    >
      <div className="absolute top-0 left-0 right-0 h-[4px] transition-all duration-300" style={{ backgroundColor: med.color_tag || '#3B82F6' }} />

      <div className="p-5 sm:p-6 flex-1 relative z-10 transition-colors group-hover:bg-blue-600/5">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 border border-border bg-background shadow-sm transition-transform group-hover:rotate-12"
              style={{ backgroundColor: `${med.color_tag || '#3b82f6'}15`, borderColor: `${med.color_tag || '#3b82f6'}30` }}
            >
              <Pill className="w-5.5 h-5.5" style={{ color: med.color_tag || '#3b82f6' }} />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground leading-tight group-hover:text-blue-500 transition-colors uppercase tracking-tight">{med.name}</h4>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1.5 opacity-70">
                {med.dosage} <span className="w-1 h-1 rounded-md bg-border" /> {med.frequency}
              </p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all ${adherence > 0.8 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
            {Math.round(adherence * 100)}% Adherence
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 bg-secondary/30 p-4 rounded-md border border-border group-hover:bg-card transition-colors">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1.5 tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Next Dose
            </span>
            <span className="text-xs font-black text-foreground">
              {med.scheduled_time ? formatTime12(med.scheduled_time) : 'TBD'}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 border-l border-border pl-3">
            <span className="text-[9px] uppercase font-black text-muted-foreground flex items-center gap-1.5 tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> Stability
            </span>
            <span className={`text-xs font-black ${adherence > 0.8 ? 'text-emerald-500' : 'text-blue-500'}`}>
              {adherence > 0.8 ? 'OPTIMAL' : 'MONITOR'}
            </span>
          </div>
        </div>

        {lastTaken && lastTaken.log_date && (
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Last Node: {new Date(lastTaken.log_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
          </div>
        )}
      </div>

      <div className="flex border-t border-border bg-secondary/30" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onLog(med.id, 'missed', dateStr)}
          disabled={currentLog?.status === 'missed' || isLockedDate}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${currentLog?.status === 'missed'
            ? 'bg-rose-500/10 text-rose-500 opacity-60 cursor-not-allowed'
            : isLockedDate
              ? 'text-muted-foreground/30 cursor-not-allowed grayscale opacity-50'
              : 'text-rose-500 hover:bg-rose-500/10 active:scale-95'
            }`}
        >
          <XCircle className="w-4 h-4" /> {currentLog?.status === 'missed' ? 'Missed Node' : 'Log Missed'}
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => onLog(med.id, 'taken', dateStr)}
          disabled={currentLog?.status === 'taken' || isLockedDate}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${currentLog?.status === 'taken'
            ? 'bg-emerald-500/10 text-emerald-500 opacity-60 cursor-not-allowed'
            : isLockedDate
              ? 'text-muted-foreground/30 cursor-not-allowed grayscale opacity-50'
              : 'text-emerald-600 hover:bg-emerald-500/10 active:scale-95'
            }`}
        >
          <CheckCircle className="w-4 h-4" /> {currentLog?.status === 'taken' ? 'Taken Node' : 'Log Intake'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Add Medication Modal (like AddMedicationView in Swift) ────────────────────
const AddMedicationModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('Once a day')
  const [duration, setDuration] = useState(7)
  const [startDate, setStartDate] = useState(new Date())
  const [scheduledTime, setScheduledTime] = useState('08:00')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Medication name is required.'); return }
    if (!dosage.trim()) { toast.error('Dosage is required.'); return }
    setIsAdding(true)
    const startDateStr = toDateStr(startDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + Math.max(0, duration - 1))
    await onAdd({
      name, dosage, frequency,
      duration_days: duration,
      start_date: startDateStr,
      end_date: toDateStr(endDate),
      scheduled_time: scheduledTime + ':00',
      color_tag: selectedColor
    })
    setIsAdding(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 backdrop-blur-md overflow-y-auto py-4 sm:py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="bg-card w-full max-w-md rounded-md shadow-2xl overflow-hidden mx-4 border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white">New Prescription</h3>
            <p className="text-blue-100 text-xs font-medium mt-0.5">Add medication to your schedule</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Medication Details */}
          <div className="bg-background rounded-md p-5 border border-border shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Pill className="w-3.5 h-3.5" /> Medication Details
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Medication Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amoxicillin" className="h-11 bg-card border-border focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Dosage</label>
                <Input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg" className="h-11 bg-card border-border focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Intake & Duration */}
          <div className="bg-background rounded-md p-5 border border-border shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Intake & Duration
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">Frequency</label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-[180px] h-10 bg-card border-border rounded-md text-sm font-semibold focus:ring-blue-500 focus:border-blue-400">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    {FREQUENCIES.map(f => (
                      <SelectItem key={f} value={f} className="text-sm font-medium">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">Intake Time</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                  className="text-sm font-semibold text-foreground bg-card border border-border rounded-md px-3 py-2" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[180px] justify-start text-left font-semibold bg-card border-border h-10 rounded-md transition-all hover:bg-background hover:border-blue-500",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-md shadow-2xl border-border bg-card" align="end">
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
              <div>
                <label className="text-sm font-bold text-foreground mb-2.5 block">Course Duration</label>
                <div className="flex gap-2 mb-3">
                  {DURATION_PRESETS.map(d => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`flex-1 py-3 rounded-md text-xs font-bold transition-all ${duration === d ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}>
                      {d} Days
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 bg-background rounded-md p-3">
                  <span className="text-xs font-medium text-muted-foreground">Custom:</span>
                  <input type="number" min="1" max="365" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 1)}
                    className="w-20 text-sm font-bold text-center bg-card border border-border rounded-md py-1.5 text-foreground" />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Color Identifier */}
          <div className="bg-background rounded-md p-5 border border-border shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Color Identifier
            </p>
            <div className="flex flex-wrap gap-3">
              {COLOR_PRESETS.map(c => (
                <button key={c.hex} onClick={() => setSelectedColor(c.hex)}
                  className={`w-10 h-10 rounded-md transition-all ${selectedColor === c.hex ? 'ring-4 ring-blue-500/20 scale-110' : 'hover:scale-110 shadow-sm'}`}
                  style={{ backgroundColor: c.hex }}>
                  {selectedColor === c.hex && <div className="w-2 h-2 rounded-md bg-white shadow-sm" />}
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
                <div className={`w-10 h-10 rounded-md border-2 border-dashed border-border bg-card flex items-center justify-center transition-all group-hover:border-blue-400 group-hover:bg-blue-500/10
                  ${!COLOR_PRESETS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase()) ? 'ring-4 ring-blue-500/20 scale-110' : ''}`}
                  style={!COLOR_PRESETS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase()) ? { backgroundColor: selectedColor, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.2)' } : {}}
                >
                  {COLOR_PRESETS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase()) ? (
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <div className="w-2 h-2 rounded-md bg-white shadow-sm" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isAdding || !name.trim() || !dosage.trim()}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-md shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Pill className="w-5 h-5" /> Save Prescription</>}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main MedicationSchedule Page ──────────────────────────────────────────────
const MedicationSchedule = () => {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const navigate = useNavigate()

  const [medications, setMedications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const fetchMeds = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const res = await getMedications(user.id)
      if (res.status === 'success') setMedications(res.data || [])
    } catch (err) {
      console.error('Failed to fetch medications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => { fetchMeds() }, [fetchMeds])

  const calendarDays = useMemo(() =>
    generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  )

  const dailyMeds = useMemo(() => getMedsForDate(medications, selectedDate), [medications, selectedDate])

  // Filter and sort medications
  const filteredMedications = useMemo(() => {
    let filtered = [...medications]

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(med =>
        med.name?.toLowerCase().includes(search) ||
        med.dosage?.toLowerCase().includes(search) ||
        med.frequency?.toLowerCase().includes(search)
      )
    }

    // Sort medications
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        const dateA = a.start_date ? new Date(a.start_date) : new Date(0)
        const dateB = b.start_date ? new Date(b.start_date) : new Date(0)
        return dateB - dateA
      } else if (sortOrder === 'oldest') {
        const dateA = a.start_date ? new Date(a.start_date) : new Date(0)
        const dateB = b.start_date ? new Date(b.start_date) : new Date(0)
        return dateA - dateB
      } else if (sortOrder === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '')
      } else if (sortOrder === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '')
      }
      return 0
    })

    return filtered
  }, [medications, searchText, sortOrder])

  const stats = useMemo(() => {
    let taken = 0, missed = 0
    medications.forEach(m => (m.logs || []).forEach(l => l.status === 'taken' ? taken++ : missed++))
    const total = taken + missed
    return { taken, missed, adherence: total > 0 ? Math.round((taken / total) * 100) : 0 }
  }, [medications])

  const changeMonth = (dir) => {
    setCurrentMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const handleLog = async (medId, status, date = null) => {
    try {
      const payload = { medication_id: medId, status }
      if (date) payload.date = date
      const res = await logMedication(payload)
      if (res.status === 'success') {
        toast.success(`Medication marked as ${status}.`)
        await fetchMeds()
      }
    } catch (err) {
      toast.error('Failed to log medication.')
    }
  }

  const handleAdd = async (data) => {
    try {
      const res = await addMedication({ ...data, patient_id: user.id })
      if (res.status === 'success') {
        toast.success('Medication added successfully!')
        await fetchMeds()
      }
    } catch (err) {
      toast.error('Failed to add medication.')
    }
  }

  const handleUpdate = async (data) => {
    try {
      const res = await updateMedication(data)
      if (res.status === 'success') {
        toast.success('Medication updated.')
        await fetchMeds()
      }
    } catch (err) {
      toast.error('Failed to update medication.')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await deleteMedication(id)
      if (res.status === 'success') {
        toast.success('Medication removed.')
        await fetchMeds()
      }
    } catch (err) {
      toast.error('Failed to remove medication.')
    }
  }

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const selectedDateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()

  if (isLoading && medications.length === 0) {
    return (
      <div className="flex h-screen bg-background font-sans overflow-hidden">
        <PatientSidebar />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Loading medication schedule...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden text-foreground">
      <PatientSidebar />
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} flex flex-col min-w-0 relative h-screen overflow-hidden`}>

        {/* Header */}
        <header className="z-40 bg-card/95 backdrop-blur-sm border-b border-border shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              {/* Left: Title */}
              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-none">Medication Schedule</h1>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5 hidden sm:flex items-center gap-2">
                    <span className="text-blue-500 font-semibold flex items-center gap-1"><Pill className="w-3 h-3" />Prescription Tracker</span>
                    <span className="text-border">·</span>
                    <span>Patient Portal</span>
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 px-3 sm:px-4 text-[11px] font-black uppercase shadow-md shadow-blue-600/15 gap-1.5 rounded-md transition-all active:scale-95">
                  <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Med</span>
                </Button>
                <NotificationBell color="primary" />
                <div className="flex items-center gap-2.5 pl-1 pr-2 sm:pr-3 py-1 rounded-md border border-border bg-card hover:border-primary/20 hover:bg-secondary/30 transition-all cursor-pointer"
                  onClick={() => navigate('/patient/profile')}>
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Dotted BG */}
          <div className="absolute inset-0 pointer-events-none opacity-100 dark:opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

          {/* Content */}
          <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
            {/* Back + Title */}
            <div className="mb-6">

              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Medication <span className="text-blue-600">Schedule</span>
              </h2>
              <p className="text-sm text-muted-foreground font-medium">{monthLabel}</p>
            </div>

            {/* Overview Stats - Premium Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
              <StatCard
                title="Active Medications"
                value={medications.length}
                subtext="Currently prescribed"
                icon={Pill}
                accent="blue"
              />
              <StatCard
                title="Doses Taken"
                value={stats.taken}
                subtext="This tracking period"
                icon={CheckCircle}
                accent="emerald"
              />
              <StatCard
                title="Adherence Rate"
                value={`${stats.adherence}%`}
                subtext={stats.adherence > 80 ? 'Excellent consistency!' : 'Keep it up!'}
                icon={TrendingUp}
                accent={stats.adherence > 80 ? 'emerald' : 'amber'}
                trend={stats.adherence > 80 ? 5 : -2}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Calendar Card - Premium Glassmorphism */}
              <div className="lg:col-span-5">
                <div className="bg-card backdrop-blur-xl border border-border rounded-md p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Month Switcher */}
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={() => changeMonth(-1)} className="w-10 h-10 rounded-md bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 flex items-center justify-center transition-all duration-200">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="w-10 h-10 rounded-md bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 flex items-center justify-center transition-all duration-200">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day} className="text-center text-[10px] font-black text-muted-foreground tracking-wider py-2">{day}</div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map((date, i) => (
                      <DayCell key={i} date={date} isSelected={date && isSameDay(date, selectedDate)}
                        medications={medications} onClick={setSelectedDate} />
                    ))}
                  </div>

                  {/* Today Button */}
                  <div className="mt-5 pt-4 border-t border-border">
                    <button onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date()) }}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 hover:bg-blue-600/10 px-4 py-2.5 rounded-md transition-all flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Jump to Today
                    </button>
                  </div>
                </div>
              </div>

              {/* Daily Doses */}
              <div className="lg:col-span-7">
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Doses For</p>
                    <p className="text-lg font-black text-foreground">{selectedDateLabel}</p>
                  </div>
                  <Badge className="text-[10px] font-black px-4 py-2 uppercase tracking-widest bg-blue-600/10 text-blue-500 border-blue-500/20">
                    {dailyMeds.length} Medication{dailyMeds.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Search and Filter Controls */}
                <div className="mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search medications..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-9 h-10 bg-card border border-border rounded-md text-sm font-medium focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-muted-foreground shadow-sm outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-slate-500">
                      <ArrowDownUp className="w-4 h-4" />
                      <span className="text-xs font-medium hidden sm:inline">Sort by</span>
                    </div>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="w-[140px] h-10 bg-card border-border rounded-md text-sm font-black focus:ring-blue-500/50 focus:border-blue-500/50">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent align="end" className="rounded-md">
                        <SelectItem value="newest" className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Newest First
                          </div>
                        </SelectItem>
                        <SelectItem value="oldest" className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Oldest First
                          </div>
                        </SelectItem>
                        <SelectItem value="name-asc" className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">A</span> to <span className="text-lg">Z</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="name-desc" className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">Z</span> to <span className="text-lg">A</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show medications list - either filtered or for selected date */}
                {(() => {
                  // When searching, show filtered results
                  if (searchText) {
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm bg-blue-600/10 border border-blue-500/20 rounded-md p-3">
                          <p className="text-muted-foreground font-medium">
                            Found <span className="text-blue-500 font-black">{filteredMedications.length}</span> medication{filteredMedications.length !== 1 ? 's' : ''} matching "<span className="text-blue-500 font-black">{searchText}</span>"
                          </p>
                          <button
                            onClick={() => setSearchText('')}
                            className="text-[10px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-600 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                        {filteredMedications.length > 0 ? (
                          filteredMedications.map((med) => (
                            <MedicationCard key={med.id} med={med} onSelect={(m) => navigate(`/patient/medication/${m.id}`)} onLog={handleLog} selectedDate={selectedDate} />
                          ))
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-card/50 backdrop-blur-xl border border-border rounded-md p-8 text-center shadow-sm">
                            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                            <p className="text-base font-black text-muted-foreground/60 mb-1">No matches found</p>
                            <p className="text-sm text-muted-foreground/40">Try a different search term or clear the filter.</p>
                          </motion.div>
                        )}
                      </div>
                    )
                  }

                  // When not searching, show daily medications
                  if (dailyMeds.length > 0) {
                    return (
                      <div className="space-y-4">
                        {dailyMeds.map((med) => (
                          <MedicationCard key={med.id} med={med} onSelect={(m) => navigate(`/patient/medication/${m.id}`)} onLog={handleLog} selectedDate={selectedDate} />
                        ))}
                      </div>
                    )
                  }

                  // No medications for selected date
                  return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-md p-12 text-center shadow-sm hover:shadow-md transition-all">
                      <div className="w-16 h-16 rounded-md bg-secondary/50 flex items-center justify-center mx-auto mb-5">
                        <Pill className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-base font-black text-muted-foreground/60 mb-2">No medications scheduled</p>
                      <p className="text-sm text-muted-foreground/40">Select a different date or add a new medication.</p>
                    </motion.div>
                  )
                })()}

                {/* Adherence Chart - Premium Card */}
                {medications.length > 0 && (
                  <div className="mt-8 bg-card/80 backdrop-blur-xl border border-border rounded-md p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Weekly Adherence</p>
                        <p className="text-base font-black text-foreground">Last 7 days overview</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-md bg-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Taken</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-md bg-rose-500" />
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Missed</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(() => {
                          const map = {}
                          const today = new Date(); today.setHours(0, 0, 0, 0)
                          for (let i = 6; i >= 0; i--) {
                            const d = new Date(today); d.setDate(d.getDate() - i)
                            const ds = toDateStr(d)
                            map[ds] = { date: d.toLocaleDateString([], { weekday: 'short' }), taken: 0, missed: 0 }
                          }
                          medications.forEach(m => (m.logs || []).forEach(l => {
                            if (map[l.log_date]) l.status === 'taken' ? map[l.log_date].taken++ : map[l.log_date].missed++
                          }))
                          return Object.values(map)
                        })()}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 800 }} dy={10} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--card)',
                              borderRadius: '16px',
                              border: '1px solid var(--border)',
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}
                            itemStyle={{ color: 'var(--foreground)' }}
                            cursor={{ fill: 'var(--secondary)', opacity: 0.4 }}
                          />
                          <Bar dataKey="taken" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="missed" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddMedicationModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MedicationSchedule