import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  PlusCircle,
  Stethoscope,
  Scissors,
  CheckCircle2,
  Trash2,
  Lock,
  Unlock,
  SlidersHorizontal,
  FileCheck,
  RefreshCcw,
  UserCheck,
  XCircle,
  AlertOctagon,
  X,
  Plus,
  Zap,
  ChevronRight,
  Filter,
  MoreVertical,
  Activity,
  Search,
  ArrowUpRight,
  CloudUpload,
  ExternalLink,
  Loader2,
  Link2,
  Unlink2,
  Sun,
  Moon
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar';
import { useSidebar } from '@/context/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useDentistSchedule } from '@/hooks/useDentistSchedule';
import { useTheme } from '@/context/ThemeContext';
import {
  initGoogleCalendar,
  signInToGoogle,
  signOutFromGoogle,
  isGoogleAuthenticated,
  createCalendarEvent,
  createSlotEvent,
  syncAppointmentsToGoogle
} from '@/services/googleCalendar';

// Calendar Library
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

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

export default function DentistSchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { isCollapsed } = useSidebar();
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const { theme, toggleTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);
  const [mobileTab, setMobileTab] = useState('calendar'); // 'calendar' or 'agenda'
  const [searchTerm, setSearchTerm] = useState('');

  // Use the schedule hook
  const {
    appointments,
    slots,
    monthEvents,
    isLoading,
    submitting,
    dentistId,
    loadDaySchedule,
    loadMonthEvents,
    addSlot,
    updateSlotStatus,
    updateApptStatus,
    postponeAppointment
  } = useDentistSchedule();

  // Modals / Sheets
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Selected item tracking
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedAppointmentData, setSelectedAppointmentData] = useState(null);

  // Use either the cached data or find it in the current day's list
  const selectedAppointment = selectedAppointmentData || appointments.find(a => a.id === selectedAppointmentId);

  // Form states: New Slot
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('09:30');
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotColor, setNewSlotColor] = useState('#0d9488'); // Teal 600

  // Form states: Reschedule
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // ── Google Calendar State ──
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [gcalReady, setGcalReady] = useState(false);

  // Initialize Google Calendar on mount
  useEffect(() => {
    const initGcal = async () => {
      const ready = await initGoogleCalendar();
      setGcalReady(ready);
      if (ready) {
        setGcalConnected(isGoogleAuthenticated());
      }
    };
    initGcal();
  }, []);

  // Connect/Disconnect Google Calendar
  const handleGoogleConnect = async () => {
    if (gcalConnected) {
      signOutFromGoogle();
      setGcalConnected(false);
      toast.success('Disconnected from Google Calendar');
      return;
    }
    try {
      await signInToGoogle();
      setGcalConnected(true);
      toast.success('Connected to Google Calendar!');
    } catch (err) {
      toast.error(err.message || 'Failed to connect to Google');
    }
  };

  // Sync All Day Appointments to Google Calendar
  const handleSyncAllToGoogle = async () => {
    if (!gcalConnected) {
      toast.error('Connect your Google Calendar first');
      return;
    }
    if (appointments.length === 0) {
      toast.info('No appointments to sync for this day');
      return;
    }
    setGcalSyncing(true);
    try {
      const results = await syncAppointmentsToGoogle(appointments);
      const success = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      if (success > 0) toast.success(`${success} appointment${success > 1 ? 's' : ''} synced to Google Calendar`);
      if (failed > 0) toast.error(`${failed} appointment${failed > 1 ? 's' : ''} failed to sync`);
    } catch (err) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setGcalSyncing(false);
    }
  };

  // Sync a single appointment to Google Calendar
  const handleSyncSingleToGoogle = async (apt) => {
    if (!gcalConnected) {
      toast.error('Connect your Google Calendar first');
      return;
    }
    try {
      const result = await createCalendarEvent({
        patientName: apt.patient_name,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        time: apt.scheduled_time?.slice(0, 5) || '09:00',
        durationMinutes: apt.duration_minutes || 30,
        description: `Visit Status: ${apt.visit_status || 'Scheduled'}\nCategory: ${apt.visit_category || 'General Consultation'}`,
      });
      toast.success(`Synced to Google Calendar`, {
        action: {
          label: 'Open',
          onClick: () => window.open(result.htmlLink, '_blank')
        }
      });
    } catch (err) {
      toast.error(err.message || 'Failed to sync');
    }
  };

  useEffect(() => {
    loadMonthEvents(selectedDate);
    loadDaySchedule(selectedDate);
  }, [dentistId]);

  useEffect(() => {
    loadDaySchedule(selectedDate);
  }, [selectedDate]);

  /* ─── Handlers ─── */
  const handleAddSlot = async (e) => {
    e.preventDefault();
    const dateStr = moment(selectedDate).format('YYYY-MM-DD');
    const success = await addSlot({
      date: dateStr,
      start_time: newSlotStart + ':00',
      end_time: newSlotEnd + ':00',
      slot_label: newSlotLabel || 'Operatory Slot',
      color_tag: newSlotColor
    });
    if (success) {
      setShowAddSlotModal(false);
      // Auto-sync to Google Calendar if connected
      if (gcalConnected) {
        try {
          await createSlotEvent({
            slotLabel: newSlotLabel || 'Operatory Slot',
            date: dateStr,
            startTime: newSlotStart + ':00',
            endTime: newSlotEnd + ':00',
          });
          toast.success('Also synced to Google Calendar');
        } catch (gcalErr) {
          console.warn('Google Calendar sync failed:', gcalErr);
        }
      }
      setNewSlotLabel('');
      loadDaySchedule(selectedDate);
    }
  };

  const handleUpdateSlotStatus = async (slotId, action) => {
    const success = await updateSlotStatus(slotId, action);
    if (success) loadDaySchedule(selectedDate);
  };

  const handleUpdateApptStatus = async (status, appt = null) => {
    const target = appt || selectedAppointment;
    if (!target) return;
    // 1. Optimistic update for the modal data itself (Prevents stale UI)
    if (selectedAppointmentData && selectedAppointmentId === target.id) {
      setSelectedAppointmentData(prev => ({ ...prev, visit_status: status }));
    }

    const success = await updateApptStatus(target.id, status);
    if (success) {
      // Small delay before closing so user sees the change, or just keep it open
      // setShowStatusModal(false); 
      // setSelectedAppointmentData(null);
      loadDaySchedule(selectedDate);
    }
  };

  const handlePostpone = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    const success = await postponeAppointment(
      selectedAppointment.id,
      rescheduleReason,
      newDate,
      newTime + ':00'
    );
    if (success) {
      if (selectedAppointmentData) {
        setSelectedAppointmentData(prev => ({ ...prev, visit_status: 'postponed' }));
      }
      setShowRescheduleModal(false);
      setRescheduleReason('');
      loadDaySchedule(selectedDate);
      loadMonthEvents(selectedDate);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6';
    if (event.type === 'slot') {
      backgroundColor = event.color || '#0d9488';
      if (event.status === 'blocked') backgroundColor = '#94a3b8';
    } else {
      const statusColors = {
        scheduled: '#3b82f6',
        arrived: '#f97316',
        in_progress: '#a855f7',
        visited: '#10b981',
        not_visited: '#ef4444',
        postponed: '#f59e0b',
      };
      backgroundColor = statusColors[event.status] || '#3b82f6';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '10px',
        fontWeight: '700',
        padding: '1px 4px',
      }
    };
  };

  const dayPropGetter = (date) => {
    const isSelected = moment(date).isSame(selectedDate, 'day');
    return {
      style: {
        backgroundColor: isSelected ? '#f0fdfa' : 'white',
        transition: 'all 0.2s ease',
      }
    };
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
  };

  const handleSelectEvent = (event) => {
    if (event.type === 'appointment') {
      setSelectedAppointmentId(event.resource.id);
      setSelectedAppointmentData(event.resource);
      setShowStatusModal(true);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans transition-colors duration-500">
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative"
      >
        {/* Ambient Bg */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#14b8a6' : '#94a3b8'} 1.5px, transparent 1.5px)`, backgroundSize: '48px 48px' }} />
        {/* ═══ HEADER ═══ */}
        <header className="bg-white dark:bg-teal-900/30 border-b border-slate-200 dark:border-teal-800/50 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              {/* Left: Title */}
              <div className="flex items-center gap-3 min-w-0">
                <MobileSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Scheduler</h1>
                  <p className="text-[11px] text-slate-400 dark:text-teal-500 font-medium mt-0.5 hidden sm:flex items-center gap-2">
                    <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {moment(selectedDate).format('MMM D, YYYY')}
                    </span>
                    <span className="text-slate-300 dark:text-teal-800">·</span>
                    <span>Practice Management</span>
                  </p>
                </div>
              </div>

              {/* Right: Search + Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden md:block w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9 h-9 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-teal-800 rounded-md text-sm font-medium focus:ring-teal-500 focus:border-teal-400 transition-all"
                    placeholder="Search schedule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-md border border-slate-200 dark:border-teal-800 bg-white dark:bg-teal-900/20 text-slate-500 dark:text-teal-400 hover:border-teal-300 dark:hover:border-teal-600 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <div className="hidden lg:flex bg-slate-100 dark:bg-teal-900/50 p-0.5 rounded-md border border-slate-200 dark:border-teal-800/50">
                  {['month', 'week', 'day'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v === 'month' ? Views.MONTH : v === 'week' ? Views.WEEK : Views.DAY)}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${view === (v === 'month' ? Views.MONTH : v === 'week' ? Views.WEEK : Views.DAY) ? 'bg-white dark:bg-teal-600 text-teal-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-teal-400/60 hover:text-slate-700 dark:hover:text-teal-300'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <NotificationBell />
                <div className="w-px h-5 bg-slate-200 dark:bg-teal-800 hidden sm:block" />

                {/* Google Calendar Connect Button */}
                {gcalReady && (
                  <button
                    onClick={handleGoogleConnect}
                    title={gcalConnected ? 'Disconnect Google Calendar' : 'Connect Google Calendar'}
                    className={`h-9 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 border ${gcalConnected
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-50 dark:bg-teal-900/20 text-slate-500 dark:text-teal-400 border-slate-200 dark:border-teal-800 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                  >
                    {gcalConnected ? <Link2 className="w-3.5 h-3.5" /> : <Unlink2 className="w-3.5 h-3.5" />}
                    <span className="hidden lg:inline">{gcalConnected ? 'Google Synced' : 'Connect Google'}</span>
                  </button>
                )}

                <Button onClick={() => setShowAddSlotModal(true)} className="h-9 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md px-4 shadow-sm text-xs transition-all gap-1.5 active:scale-95">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Slot</span>
                </Button>

                <Link to="/dentist/profile" className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-md border border-slate-200 dark:border-teal-800 bg-white dark:bg-teal-900/20 hover:border-teal-200 dark:hover:border-teal-700 hover:bg-teal-50/30 transition-all cursor-pointer shadow-sm">
                  <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-teal-50 leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-medium text-teal-600 dark:text-teal-400 mt-0.5">Clinician</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* MOBILE TAB SWITCHER */}
          <div className="lg:hidden flex border-t border-slate-100 bg-white">
            <button
              onClick={() => setMobileTab('calendar')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${mobileTab === 'calendar' ? 'text-teal-600' : 'text-slate-400'}`}
            >
              Calendar
              {mobileTab === 'calendar' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 mx-4 rounded-md" />}
            </button>
            <button
              onClick={() => setMobileTab('agenda')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${mobileTab === 'agenda' ? 'text-teal-600' : 'text-slate-400'}`}
            >
              Agenda
              {mobileTab === 'agenda' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 mx-4 rounded-md" />}
            </button>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row overflow-hidden min-h-0 px-4 sm:px-6 lg:px-8">

          {/* LEFT: CALENDAR */}
          <div className={`flex-1 overflow-hidden flex flex-col p-4 transition-all duration-300 min-h-0 border-r border-slate-100 dark:border-teal-800/50 ${mobileTab === 'agenda' ? 'hidden lg:flex' : 'flex'}`}>
            <style>{`
              .rbc-calendar { font-family: inherit; }
              .rbc-header { padding: 12px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; border-bottom: 1px solid #f1f5f9; }
              .dark .rbc-header { color: #5eead4; border-bottom: 1px solid #1e293b; }
              .rbc-off-range-bg { background-color: #f8fafc; }
              .dark .rbc-off-range-bg { background-color: #0f172a; }
              .rbc-today { background-color: #f0fdfa !important; }
              .dark .rbc-today { background-color: #1e293b !important; }
              .rbc-month-view { border: none !important; }
              .rbc-day-bg { border-left: 1px solid #f1f5f9 !important; border-top: 1px solid #f1f5f9 !important; }
              .dark .rbc-day-bg { border-left: 1px solid #1e293b !important; border-top: 1px solid #1e293b !important; }
              .rbc-event { border-radius: 6px !important; }
              .rbc-show-more { font-size: 9px; font-weight: 800; color: #0d9488; }
              .dark .rbc-show-more { color: #5eead4; }
              .rbc-toolbar { margin-bottom: 24px !important; }
              .rbc-date-cell { font-size: 11px; font-weight: 700; padding: 8px !important; }
              .dark .rbc-date-cell { color: #cbd5e1; }
              .rbc-time-view { border: none !important; }
              .rbc-time-content { border-top: 1px solid #f1f5f9 !important; }
              .dark .rbc-time-content { border-top: 1px solid #1e293b !important; }
              .dark .rbc-time-header-content { border-left: 1px solid #1e293b !important; }
              .dark .rbc-time-slot { border-top: 1px solid #1e293b !important; }
              .dark .rbc-timeslot-group { border-bottom: 1px solid #1e293b !important; }
              .dark .rbc-time-gutter .rbc-timeslot-group { border-top: 1px solid #1e293b !important; }
              .dark .rbc-time-view-resources .rbc-time-gutter, .dark .rbc-time-view-resources .rbc-day-slot { border-right: 1px solid #1e293b !important; }
            `}</style>
            <Calendar
              localizer={localizer}
              events={monthEvents}
              startAccessor="start"
              endAccessor="end"
              className="h-full w-full"
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              views={['month', 'week', 'day']}
              view={view}
              onView={setView}
              date={selectedDate}
              onNavigate={(date) => {
                setSelectedDate(date);
                loadMonthEvents(date);
              }}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={(date) => {
                const isSelected = moment(date).isSame(selectedDate, 'day');
                return {
                  className: isSelected ? 'dark:bg-teal-900/50' : '',
                  style: {
                    backgroundColor: isSelected ? '#f0fdfa' : 'transparent',
                    transition: 'all 0.2s ease',
                  }
                };
              }}
              components={{
                toolbar: (props) => (
                  <div className="flex items-center justify-between w-full mb-6">
                    <div className="flex items-center gap-2">
                      <button onClick={() => props.onNavigate('PREV')} className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-teal-900 border border-slate-200 dark:border-teal-800 text-slate-400 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => props.onNavigate('NEXT')} className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-teal-900 border border-slate-200 dark:border-teal-800 text-slate-400 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                      <button onClick={() => props.onNavigate('TODAY')} className="ml-1 px-3 h-8 flex items-center justify-center rounded-md bg-teal-50 dark:bg-teal-900 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[10px] font-bold uppercase tracking-widest hover:bg-teal-100 dark:hover:bg-teal-800 transition-all shadow-sm">Today</button>
                    </div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white capitalize px-2">
                      {moment(props.date).format('MMMM YYYY')}
                    </h2>
                    <div className="flex gap-2">
                      <button className="flex lg:hidden items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-teal-900 border border-slate-200 dark:border-teal-800 rounded-md text-slate-500 dark:text-teal-400 text-[10px] font-bold uppercase tracking-widest"><Filter className="w-3 h-3" /> Filter</button>
                      <div className="hidden lg:block w-32"></div>
                    </div>
                  </div>
                )
              }}
            />
          </div>

          {/* RIGHT: DETAILS PANEL */}
          <aside className={`w-full lg:w-[400px] xl:w-[440px] shrink-0 p-4 lg:p-6 overflow-y-auto overscroll-contain transition-all ${mobileTab === 'calendar' ? 'hidden lg:block' : 'block'} border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md`}>
            <div className="space-y-6 pb-20 lg:pb-0 pr-2">

              {/* Selected Date Header */}
              <div className="bg-zinc-900 dark:bg-teal-900/40 rounded-md p-5 text-white relative overflow-hidden flex items-center justify-between border border-slate-800 dark:border-teal-800 shadow-sm backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-md blur-2xl -mr-8 -mt-8" />
                <div className="relative z-10 flex-1">
                  <p className="text-[10px] font-semibold text-teal-400 uppercase tracking-widest mb-1">Agenda</p>
                  <h2 className="text-xl font-bold tracking-tight">{moment(selectedDate).format('dddd, MMM D')}</h2>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  {/* Sync All to Google */}
                  {gcalConnected && appointments.length > 0 && (
                    <button
                      onClick={handleSyncAllToGoogle}
                      disabled={gcalSyncing}
                      title="Sync all appointments to Google Calendar"
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {gcalSyncing
                        ? <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                        : <CloudUpload className="w-4 h-4 text-teal-400" />
                      }
                    </button>
                  )}
                  <div className="w-10 h-10 bg-white/5 dark:bg-teal-800/50 rounded-md flex items-center justify-center border border-white/10 dark:border-teal-700 shadow-inner">
                    <Clock className="w-5 h-5 text-teal-400" />
                  </div>
                </div>
              </div>

              {/* List Content */}
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-[3px] border-slate-100 dark:border-teal-900 border-t-teal-500 rounded-md animate-spin" />
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-teal-600 uppercase">Synchronizing</p>
                  </div>
                ) : (
                  <>
                    {/* Appointments Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-teal-600 uppercase tracking-wider">Clinical Visits</h3>
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-teal-900 px-2.5 py-0.5 rounded-md border border-teal-100 dark:border-teal-800 shadow-sm">
                          {appointments.filter(app => !searchTerm || app.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())).length} Matches
                        </span>
                      </div>

                      {appointments.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-teal-900/20 border border-slate-200 dark:border-teal-800 border-dashed rounded-md p-8 flex flex-col items-center text-center shadow-inner">
                          <div className="w-10 h-10 bg-white dark:bg-teal-800 rounded-md shadow-sm border border-slate-100 dark:border-teal-700 flex items-center justify-center mb-3">
                            <UserCheck className="w-5 h-5 text-slate-300 dark:text-teal-600" />
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-teal-500">No appointments for this day</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {appointments.filter(app => !searchTerm || app.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(app => {
                            const isPast = ['visited', 'not_visited', 'cancelled'].includes(app.visit_status);
                            const isCurrent = ['arrived', 'in_progress'].includes(app.visit_status);

                            let statusColor = 'blue';
                            if (app.visit_status === 'scheduled') statusColor = 'blue';
                            else if (app.visit_status === 'arrived') statusColor = 'orange';
                            else if (app.visit_status === 'in_progress') statusColor = 'purple';
                            else if (app.visit_status === 'visited') statusColor = 'emerald';
                            else if (['not_visited', 'cancelled'].includes(app.visit_status)) statusColor = 'red';
                            else if (app.visit_status === 'postponed') statusColor = 'amber';

                            const colorMaps = {
                              blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/50', dot: 'bg-blue-500' },
                              orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/50', dot: 'bg-orange-500' },
                              purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/50', dot: 'bg-purple-500' },
                              emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/50', dot: 'bg-emerald-500' },
                              red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-100 dark:border-red-900/50', dot: 'bg-red-500' },
                              amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/50', dot: 'bg-amber-500' },
                            };
                            const c = colorMaps[statusColor];

                            return (
                              <div
                                key={app.id}
                                onClick={() => { setSelectedAppointmentId(app.id); setSelectedAppointmentData(app); setShowStatusModal(true); }}
                                className={`bg-white dark:bg-teal-900/20 border rounded-md p-4 transition-all cursor-pointer group hover:border-teal-200 dark:hover:border-teal-500 hover:shadow-lg dark:hover:shadow-teal-900/30 ${isCurrent ? 'border-teal-400 ring-2 ring-teal-50 dark:ring-teal-900/50' : 'border-slate-100 dark:border-teal-800/80'} ${isPast ? 'opacity-50' : ''} shadow-sm relative overflow-hidden`}
                              >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex gap-4">
                                  <div className="flex flex-col items-center min-w-[50px] pt-0.5">
                                    <span className="text-sm font-bold text-slate-800 dark:text-white">{moment(app.scheduled_time, "HH:mm:ss").format("h:mm")}</span>
                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-teal-500 uppercase tracking-wider">{moment(app.scheduled_time, "HH:mm:ss").format("A")}</span>
                                  </div>

                                  <div className={`w-[3px] h-10 rounded-md ${c.dot} shrink-0 mt-0.5`} />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h4 className="text-sm font-bold text-slate-900 dark:text-teal-50 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors truncate">
                                        <HighlightText text={app.patient_name} highlight={searchTerm} />
                                      </h4>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {gcalConnected && !isPast && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleSyncSingleToGoogle(app); }}
                                            title="Sync to Google Calendar"
                                            className="w-6 h-6 rounded-mdflex items-center justify-center text-slate-300 dark:text-teal-600 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-all opacity-0 group-hover:opacity-100"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </button>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-mdtext-[9px] font-bold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border} whitespace-nowrap dark:shadow-sm`}>
                                          {app.visit_status.replace('_', ' ')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-teal-500 mt-2">
                                      <Stethoscope className="w-3.5 h-3.5 text-slate-400 dark:text-teal-600" />
                                      <span className="truncate">{app.visit_category || 'General Consultation'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Operatory Slots Section */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 dark:text-teal-600 uppercase tracking-wider px-1">Procedural Slots</h3>
                      <div className="space-y-2">
                        {slots.length === 0 ? (
                          <div className="bg-slate-50 dark:bg-teal-900/20 border border-slate-200 dark:border-teal-800 border-dashed rounded-md p-6 flex flex-col items-center text-center shadow-inner">
                            <Zap className="w-6 h-6 text-slate-300 dark:text-teal-700 mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 dark:text-teal-600 uppercase">No shared slots</p>
                          </div>
                        ) : (
                          slots.filter(slot => !searchTerm || slot.slot_label?.toLowerCase().includes(searchTerm.toLowerCase())).map(slot => (
                            <div key={slot.id} className={`bg-white dark:bg-teal-900/20 border rounded-md p-3.5 flex items-center justify-between transition-all ${slot.slot_status === 'blocked' ? 'bg-slate-50 dark:bg-black opacity-60' : 'border-slate-100 dark:border-teal-800/80 hover:border-teal-200 dark:hover:border-teal-500 hover:shadow-sm shadow-sm'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 rounded-md" style={{ backgroundColor: slot.color_tag || '#0d9488' }} />
                                <div>
                                  <p className={`text-xs font-bold leading-none ${slot.slot_status === 'blocked' ? 'text-slate-500 dark:text-teal-700 line-through' : 'text-slate-800 dark:text-teal-50'}`}>
                                    <HighlightText text={slot.slot_label} highlight={searchTerm} />
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Clock className="w-3 h-3 text-slate-400 dark:text-teal-600" />
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-teal-500 uppercase">{moment(slot.start_time, "HH:mm:ss").format("h:mm A")} - {moment(slot.end_time, "HH:mm:ss").format("h:mm A")}</p>
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => handleUpdateSlotStatus(slot.id, slot.slot_status === 'blocked' ? 'unblock' : 'block')} className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${slot.slot_status === 'blocked' ? 'bg-slate-200 dark:bg-teal-900/80 text-slate-500 dark:text-teal-400' : 'bg-slate-50 dark:bg-teal-900 text-slate-400 dark:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-800 hover:text-teal-600 dark:hover:text-teal-300 border border-slate-100 dark:border-teal-800 shadow-sm'}`}>
                                {slot.slot_status === 'blocked' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </main>
      </motion.div>

      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {/* ADD SLOT MODAL */}
        {showAddSlotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowAddSlotModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white dark:bg-black rounded-md w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-teal-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-teal-900 flex items-center justify-between bg-white dark:bg-black/50 backdrop-blur-xl">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <PlusCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  New Operatory Slot
                </h2>
                <button onClick={() => setShowAddSlotModal(false)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-teal-900 transition-colors text-slate-400 dark:text-teal-600"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAddSlot} className="p-6 space-y-5 bg-slate-50/20 dark:bg-black/20">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-teal-600 uppercase tracking-widest mb-1.5 block">Slot Name / Purpose</label>
                  <Input value={newSlotLabel} onChange={(e) => setNewSlotLabel(e.target.value)} required className="h-11 bg-white dark:bg-teal-900/30 border-slate-200 dark:border-teal-800 rounded-md text-sm dark:text-white dark:placeholder:text-teal-700 shadow-inner" placeholder="e.g. Diagnostic Surgery" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-teal-600 uppercase tracking-widest mb-1.5 block">Start Time</label>
                    <Input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} required className="h-11 bg-white dark:bg-teal-900/30 border-slate-200 dark:border-teal-800 rounded-md dark:text-white dark:[color-scheme:dark] shadow-inner" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-teal-600 uppercase tracking-widest mb-1.5 block">End Time</label>
                    <Input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} required className="h-11 bg-white dark:bg-teal-900/30 border-slate-200 dark:border-teal-800 rounded-md dark:text-white dark:[color-scheme:dark] shadow-inner" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-teal-600 uppercase tracking-widest mb-2 block">Category Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={newSlotColor} onChange={(e) => setNewSlotColor(e.target.value)} className="w-11 h-11 rounded-md cursor-pointer bg-white dark:bg-teal-900 p-1 border border-slate-200 dark:border-teal-800 shadow-sm" />
                    <div className="flex-1 flex gap-2">
                      {['#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'].map(c => (
                        <button type="button" key={c} onClick={() => setNewSlotColor(c)} className={`w-7 h-7 rounded-sm shadow-md transition-transform ${newSlotColor === c ? 'scale-110 ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-teal-950' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button disabled={submitting} type="submit" className="w-full h-11 bg-teal-600 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 text-white font-bold rounded-md uppercase tracking-wider text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all">
                    {submitting ? 'Allocating...' : 'Allocate Slot'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* STATUS ACTIONS MODAL */}
        {showStatusModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowStatusModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white dark:bg-black rounded-md w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 dark:border-teal-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-teal-900 flex items-center justify-between bg-white dark:bg-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-teal-50 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800 shadow-sm"><Stethoscope className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{selectedAppointment.patient_name}</h2>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-teal-500 uppercase tracking-widest mt-0.5">{selectedAppointment.scheduled_time?.slice(0, 5)} • Consultation</p>
                  </div>
                </div>
                <button onClick={() => setShowStatusModal(false)} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 dark:text-teal-600 hover:bg-slate-50 dark:hover:bg-teal-900 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 flex flex-col gap-2 dark:bg-black/20">
                {selectedAppointment.visit_status === 'scheduled' && (
                  <button onClick={() => handleUpdateApptStatus('arrived')} className="w-full text-left py-3.5 px-4 rounded-md bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-between group">
                    Check-In Patient <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                {selectedAppointment.visit_status === 'arrived' && (
                  <button onClick={() => handleUpdateApptStatus('in_progress')} className="w-full text-left py-3.5 px-4 rounded-md bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-between group">
                    Start Session <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                {selectedAppointment.visit_status === 'in_progress' && (
                  <button onClick={() => handleUpdateApptStatus('visited')} className="w-full text-left py-3.5 px-4 rounded-md bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-between group">
                    Complete visit <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <div className="h-px bg-slate-100 dark:bg-teal-900 my-2" />

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setShowStatusModal(false); setShowRescheduleModal(true); }} className="py-2.5 px-4 rounded-md bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-800/50 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm border border-orange-100 dark:border-orange-800">Postpone</button>
                  <button onClick={() => handleUpdateApptStatus('not_visited')} className="py-2.5 px-4 rounded-md bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm border border-red-100 dark:border-red-800">No Show</button>
                </div>
                <button onClick={() => handleUpdateApptStatus('cancelled')} className="w-full mt-1 py-2 rounded-md text-slate-400 dark:text-teal-700 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-teal-900 transition-all">Cancel Appointment</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* RESCHEDULE MODAL */}
        {showRescheduleModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowRescheduleModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white dark:bg-black rounded-md w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 dark:border-teal-800">
              <div className="px-6 py-4 border-b border-orange-100 dark:border-orange-900/50 flex items-center justify-between bg-orange-50 dark:bg-orange-900/20">
                <h2 className="text-base font-bold text-orange-800 dark:text-orange-400">Reschedule Visit</h2>
                <button onClick={() => setShowRescheduleModal(false)} className="text-orange-900/50 dark:text-orange-400/50 hover:text-orange-900 dark:hover:text-orange-400 hover:bg-orange-100/50 dark:hover:bg-orange-900/50 w-7 h-7 flex items-center justify-center rounded-md"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handlePostpone} className="p-6 space-y-4 dark:bg-black/20">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-teal-600 uppercase tracking-widest mb-1.5 block">New Assignment Date</label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="h-11 bg-white dark:bg-teal-900/30 border-slate-200 dark:border-teal-800 rounded-md text-sm dark:text-white dark:[color-scheme:dark] shadow-inner" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-teal-600 uppercase tracking-widest mb-1.5 block">New Clinical Time</label>
                    <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required className="h-11 bg-white dark:bg-teal-900/30 border-slate-200 dark:border-teal-800 rounded-md text-sm dark:text-white dark:[color-scheme:dark] shadow-inner" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-teal-600 uppercase tracking-widest mb-1.5 block">Reschedule Notes</label>
                  <Input value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} className="h-11 bg-white dark:bg-teal-900/30 border-slate-200 dark:border-teal-800 rounded-md text-sm dark:text-white dark:placeholder:text-teal-700 shadow-inner" placeholder="Brief justification..." />
                </div>
                <Button disabled={submitting} type="submit" className="w-full mt-2 h-11 bg-orange-600 dark:bg-orange-600 hover:bg-orange-700 dark:hover:bg-orange-500 text-white font-bold rounded-md uppercase tracking-wider text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                  {submitting ? 'Updating...' : 'Confirm Reschedule'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
