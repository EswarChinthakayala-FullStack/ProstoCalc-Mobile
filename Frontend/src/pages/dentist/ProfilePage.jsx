import React, { useState } from 'react'
import {
  User, MapPin, Calendar, Activity,
  Mail, Phone, Shield, Edit3, LogOut,
  Map as MapIcon, Globe, FileText,
  CheckCircle2, AlertCircle, Stethoscope,
  Building2, Star, Clock, CreditCard, CircleDollarSign,
  Sparkles, ShieldCheck, Award,
  Briefcase, Fingerprint, MapPinOff,
  Search, Target, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { useDentistProfile } from '@/hooks/useDentistProfile'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationBell from '@/components/NotificationBell'
import UniversalLoader from '@/components/UniversalLoader'
import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

const ProfileField = ({ label, value, icon: Icon, fullWidth = false }) => (
  <div className={`group flex flex-col gap-2 p-4 bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-md hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="p-1.5 bg-white dark:bg-zinc-950 text-teal-600 dark:text-teal-400 rounded-md shadow-sm border border-slate-100 dark:border-zinc-800 group-hover:scale-105 transition-transform">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em]">{label}</span>
    </div>
    <p className="text-[14px] font-bold text-slate-700 dark:text-zinc-200 leading-tight">
      {value || <span className="text-slate-300 dark:text-zinc-800 italic font-medium">Not provided</span>}
    </p>
  </div>
)

const DentistProfilePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { profileData, settings, loading } = useDentistProfile(user?.id)
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme, toggleTheme } = useTheme()

  const dentist = { ...user, ...profileData }
  const isProfileComplete = dentist?.clinic_name && dentist?.clinic_address;

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (loading) {
    return <UniversalLoader text="SYNCHRONIZING PROVIDER HUB..." variant="dentist" />
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden font-sans transition-colors duration-300">
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto"
      >
        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              {/* Left: Branding */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <div className="w-10 h-10 bg-teal-600 rounded-md flex items-center justify-center text-white shadow-lg shadow-teal-600/20 shrink-0 hidden sm:flex">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 hidden sm:block">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">Provider Hub</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Master Console</span>
                    <div className="w-1.5 h-1.5 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard/clinician')}
                  className="hidden sm:flex text-slate-500 dark:text-teal-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-black rounded-md h-10 px-4"
                >
                  Overview
                </Button>
                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
                <NotificationBell />
                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-rose-500 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 rounded-md h-10 px-4 shrink-0"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Terminate</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* HER0 PROFILE CARD (Top Spanning) */}
            <div className="lg:col-span-12">
              <div className="bg-white dark:bg-zinc-950 rounded-md border border-slate-200 dark:border-zinc-900 shadow-sm overflow-hidden relative group backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-500" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-50/50 dark:from-black to-transparent pointer-events-none" />

                <div className="p-6 sm:p-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
                    {/* Avatar Showcase */}
                    <div className="relative group">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md bg-white dark:bg-black p-1.5 shadow-xl shadow-slate-200 dark:shadow-black/60 border border-slate-100 dark:border-zinc-800 transition-transform duration-500 rotate-[-2deg] group-hover:rotate-0">
                        <div className="w-full h-full rounded-md bg-gradient-to-br from-teal-500 to-teal-700 dark:from-teal-600 dark:to-teal-900 flex items-center justify-center text-3xl sm:text-4xl font-black text-white shadow-inner">
                          {dentist?.full_name?.charAt(0) || "D"}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2">
                        <div className="bg-teal-500 dark:bg-teal-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-lg border-2 border-white dark:border-zinc-950 flex items-center gap-1.5 tracking-tighter">
                          <ShieldCheck className="w-3 h-3" />
                          VERIFIED
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div className="flex-1 text-center md:text-left pt-2">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-2 sm:mb-3">
                        {dentist?.full_name || "Clinician Professional"}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-6">
                        <span className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-teal-400 px-3 py-1 rounded-md border border-slate-100 dark:border-zinc-800 text-[11px] font-bold flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 stroke-[2.5px]" /> {dentist?.email}
                        </span>
                        {dentist?.specialization && (
                          <span className="bg-teal-50 dark:bg-zinc-900 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-md border border-teal-100 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                            {dentist.specialization}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-10 border-t border-slate-50 dark:border-zinc-800/50 pt-6">
                        <div className="text-center md:text-left">
                          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1.5">Certification</p>
                          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                            <Award className="w-4 h-4" />
                            <span>Professional Board</span>
                          </div>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1.5">Experience</p>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
                            <Clock className="w-4 h-4 text-teal-500" />
                            <span>{dentist?.experience_years || 0} Linear Years</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="w-full md:w-auto mt-4 md:mt-0">
                      <Button
                        onClick={() => navigate('/dentist/profile/edit')}
                        className="w-full md:w-auto h-11 px-6 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white rounded-md shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20 gap-2 font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95"
                      >
                        <Edit3 className="w-4 h-4" />
                        Modify Console
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column (Main Repository) */}
            <div className="lg:col-span-8 space-y-8">

              {/* Clinical Repository */}
              <div className="bg-white dark:bg-zinc-950/40 rounded-md border border-slate-200 dark:border-zinc-900 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-900 dark:bg-teal-500" />
                <div className="p-4 sm:p-6 pb-0 sm:pb-0">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-md bg-teal-50 dark:bg-zinc-900/60 border border-teal-100 dark:border-zinc-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinical Repository</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">Sensitive Identity Data</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 pt-0 sm:pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ProfileField label="Identity Signature" value={dentist?.full_name} icon={User} />
                  <ProfileField label="Registry Serial" value={dentist?.license_number} icon={CreditCard} />
                  <ProfileField label="Specialization" value={dentist?.specialization} icon={Star} />
                  <ProfileField label="Seniority Level" value={dentist?.experience_years && `${dentist.experience_years} Dynamic Years`} icon={Clock} />
                </div>
                <div className="mt-4 border-t border-slate-50 dark:border-zinc-800/50 bg-slate-50/30 dark:bg-zinc-900/30 p-4">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest text-center">Data encrypted via AES-256 standard</p>
                </div>
              </div>

              {/* Infrastructure Assets */}
              <div className="bg-white dark:bg-zinc-950/40 rounded-md border border-slate-200 dark:border-zinc-900 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
                <div className="p-4 sm:p-6 pb-0 sm:pb-0">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinical Assets</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">Physical Infrastructure</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <ProfileField label="Clinical Branding" value={dentist?.clinic_name} icon={Building2} fullWidth />
                    <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-800 rounded-md hover:bg-white dark:hover:bg-zinc-900/50 transition-all shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white dark:bg-zinc-950 text-teal-600 dark:text-teal-400 rounded-md border border-slate-100 dark:border-zinc-800 shadow-sm">
                          <CircleDollarSign className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-[0.15em]">Baseline Fee</span>
                      </div>
                      <p className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                        {dentist?.consultation_fee ? `₹${dentist.consultation_fee}` : <span className="text-slate-300 dark:text-zinc-800 italic text-sm font-normal">TBD</span>}
                      </p>
                    </div>
                    <ProfileField label="Contact Line" value={dentist?.clinic_phone} icon={Phone} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileField label="Deployment Point" value={dentist?.clinic_address} icon={MapPin} fullWidth />
                    <ProfileField label="Jurisdiction" value={dentist?.clinic_city} icon={MapIcon} />
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-50 dark:border-zinc-800/50 bg-slate-50/30 dark:bg-zinc-900/30 p-4">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest text-center">Infrastructure verified by Geospatial Sync</p>
                </div>
              </div>
            </div>

            {/* Right Column (Status & Map) */}
            <div className="lg:col-span-4 space-y-8">

              {/* Operational Status */}
              <div className="bg-white dark:bg-zinc-950/30 rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Console Logic</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Real-time Behavior</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Theme Controls */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-md border border-slate-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Interface Mode</span>
                        <div className="flex p-0.5 bg-slate-100 dark:bg-zinc-950 rounded-md border border-slate-200 dark:border-zinc-800">
                          <button
                            onClick={theme === 'dark' ? toggleTheme : undefined}
                            className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={theme === 'light' ? toggleTheme : undefined}
                            className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-zinc-800 text-teal-400 shadow-sm' : 'text-slate-400 hover:text-zinc-200'}`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-teal-50/50 dark:bg-zinc-900/50 rounded-md border border-teal-100 dark:border-zinc-800 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-teal-100 dark:bg-zinc-950 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm border border-white dark:border-zinc-800">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-teal-900 dark:text-teal-100 uppercase">Operational</p>
                          <p className="text-[9px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Public Radar Online</p>
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-md border border-slate-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Visibility</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${settings?.visible_to_patients ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-zinc-800'}`}>
                            {settings?.visible_to_patients ? 'Global' : 'Secure'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800">
                        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">System Mode</span>
                        <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Target className="w-3 h-3" />
                          {settings?.consultation_mode === 'FULL' ? 'comprehensive' : 'diagnostic'}
                        </span>
                      </div>
                    </div>

                    {!isProfileComplete && (
                      <button
                        onClick={() => navigate('/dentist/profile/edit')}
                        className="w-full flex items-center justify-between p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-md border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm border border-white dark:border-rose-800">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-black text-rose-900 dark:text-rose-100 uppercase">Input Required</p>
                            <p className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase">Profile is incomplete</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-rose-400 transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-950/40 rounded-md border border-slate-200 dark:border-zinc-900 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
                <div className="p-4 border-b border-slate-50 dark:border-zinc-900 flex items-center justify-between bg-white dark:bg-black/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm border border-transparent dark:border-zinc-800">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-widest">Marker Deployment</span>
                  </div>
                  <div className="px-2 py-0.5 bg-slate-50 dark:bg-black rounded-mdborder border-slate-100 dark:border-zinc-800 text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-700">
                    {parseFloat(dentist?.latitude || 0).toFixed(4)}, {parseFloat(dentist?.longitude || 0).toFixed(4)}
                  </div>
                </div>

                <div className="h-56 relative bg-slate-50 dark:bg-black overflow-hidden shadow-inner">
                  {(dentist?.latitude && dentist?.longitude && (parseFloat(dentist.latitude) !== 0 || parseFloat(dentist.longitude) !== 0)) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(dentist.longitude) - 0.002}%2C${parseFloat(dentist.latitude) - 0.002}%2C${parseFloat(dentist.longitude) + 0.002}%2C${parseFloat(dentist.latitude) + 0.002}&layer=mapnik&marker=${dentist.latitude}%2C${dentist.longitude}`}
                      className={`w-full h-full grayscale-[0.3] contrast-[0.9] opacity-90 ${theme === 'dark' ? 'invert hue-rotate-180 brightness-95' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-800">
                      <div className="w-12 h-12 rounded-md bg-white dark:bg-zinc-900 flex items-center justify-center mb-3 shadow-sm border border-slate-100 dark:border-zinc-800">
                        <MapPinOff className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Coordinates missing</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-200/60 dark:border-zinc-800 shadow-lg text-[9px] font-black text-slate-600 dark:text-zinc-600 uppercase tracking-tighter">
                      OSM HYBRID V2.0
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/40 border-t border-slate-100 dark:border-zinc-900">
                  {dentist?.clinic_address ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 leading-tight mb-1">{dentist.clinic_address}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-700 uppercase tracking-widest italic">{dentist?.clinic_city || 'Regional Hub'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-800 italic text-xs font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Deployment Point Undefined</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </motion.div>
    </div>
  )
}

const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

export default DentistProfilePage
