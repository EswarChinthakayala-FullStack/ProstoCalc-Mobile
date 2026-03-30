import React, { useState } from 'react'
import {
    User, MapPin, Calendar, Activity,
    Mail, Phone, Shield, Edit3, LogOut,
    Map as MapIcon, Globe, FileText,
    CheckCircle2, AlertCircle, Stethoscope, Menu, MoreVertical, ArrowLeft, Sun, Moon,
    Layout
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { usePatientProfile } from '@/hooks/usePatientProfile'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import NotificationBell from '@/components/NotificationBell'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ProfileField = ({ label, value, icon: Icon, fullWidth = false }) => (
    <div className={`flex flex-col gap-1.5 p-4 bg-card border border-border rounded-md hover:border-primary/30 transition-all shadow-sm hover:shadow-md dark:shadow-none ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] leading-none mb-0.5">{label}</span>
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pl-0.5">
            {value || <span className="text-slate-300 dark:text-slate-600 italic font-medium">Not provided</span>}
        </p>
    </div>
)

const PatientProfilePage = () => {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { profileData, loading } = usePatientProfile(user?.id)
    const { isCollapsed } = useSidebar()
    const isDesktop = useMediaQuery('(min-width: 1280px)')
    const { theme, toggleTheme } = useTheme()

    const displayUser = { ...user, ...profileData }
    const isProfileComplete = displayUser?.street_address && displayUser?.city;

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    if (loading) {
        return (
            <div className="h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-600 dark:border-t-slate-400 rounded-md"
                    />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Registry...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden transition-colors duration-300 text-foreground">
            <PatientSidebar />

            <motion.div
                initial={false}
                animate={{
                    marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
                    transition: { type: 'spring', damping: 25, stiffness: 200 }
                }}
                className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden"
            >
                {/* ═══ HEADER ═══ */}
                <header className="z-40 bg-card/80 backdrop-blur-md border-b border-border shrink-0">
                    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <PatientSidebarTrigger />
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-8 h-8 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700 transition-all active:scale-95 shrink-0"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <div className="min-w-0">
                                    <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate uppercase">Patient Profile</h1>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 hidden sm:block">Identity Verification Console</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <NotificationBell color="slate" />
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 sm:h-9 font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-2 rounded-md text-xs uppercase tracking-widest"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Terminate Session</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <div className="absolute inset-0 opacity-100 pointer-events-none"
                        style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181b' : '#e2e8f0'} 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

                    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10 w-full mb-20 space-y-8">

                        {/* Hero Section */}
                        <div className="bg-card rounded-md border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-600 dark:bg-blue-500" />
                            <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                                <Layout className="w-48 h-48 sm:w-64 sm:h-64 text-slate-900 dark:text-white rotate-12 transform translate-x-12 -translate-y-12" />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
                                <div className="flex-shrink-0 relative">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md bg-card p-1 shadow-xl rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500">
                                        <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-600 to-blue-700 dark:from-zinc-900 dark:to-black flex items-center justify-center text-4xl sm:text-5xl font-black text-white shadow-inner">
                                            {displayUser?.full_name?.charAt(0) || "P"}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2">
                                        <div className="bg-blue-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-lg border-2 border-white dark:border-zinc-950 flex items-center gap-1.5 uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-md bg-white animate-pulse"></div>
                                            ACTIVE
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 text-center md:text-left space-y-4">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
                                            {displayUser?.full_name || "Guest Patient"}
                                        </h1>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs">
                                            <span className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-bold">
                                                <Mail className="w-3.5 h-3.5" /> {displayUser?.email}
                                            </span>
                                            <span className="bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 px-3 py-1 rounded-md border border-slate-200 dark:border-zinc-800 flex items-center gap-2 font-bold uppercase tracking-widest">
                                                <Shield className="w-3.5 h-3.5" /> ID: #{displayUser?.id?.toString().slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Account Status</p>
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold text-sm tracking-tight uppercase">
                                                <CheckCircle2 className="w-4 h-4" /> Verified Data
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Registration</p>
                                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-sm">
                                                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-600" /> {new Date().getFullYear()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-shrink-0 w-full md:w-auto">
                                    <Button
                                        onClick={() => navigate('/patient/profile/update')}
                                        className="w-full md:w-auto h-11 px-6 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-md shadow-lg transition-all active:scale-95 gap-2 font-bold text-[11px] uppercase tracking-widest"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Modify Registry
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Control Sidebar */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Integrity Card */}
                                <div className="bg-card rounded-md p-6 border border-border shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Registry Integrity</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-md border border-emerald-100 dark:border-emerald-900/40">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-50 leading-none mb-0.5 uppercase">Identity Protected</p>
                                                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest leading-none">Level 1 Encryption</p>
                                                </div>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        </div>

                                        {!isProfileComplete && (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 shadow-sm">
                                                        <AlertCircle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-none mb-0.5 uppercase">Pending Fields</p>
                                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none">Update Required</p>
                                                    </div>
                                                </div>
                                                <Button variant="link" size="sm" className="text-slate-900 dark:text-white h-auto p-0 font-bold text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-4" onClick={() => navigate('/patient/profile/update')}>
                                                    Sync
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Theme Mode */}
                                <div className="bg-card/80 backdrop-blur-md rounded-md p-6 border border-border shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-400 dark:bg-slate-700" />
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Display Protocol</h3>
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-md border border-slate-100 dark:border-slate-800/50">
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Interface Mode</span>
                                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                            <button
                                                onClick={() => theme === 'dark' && toggleTheme()}
                                                className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
                                            >
                                                <Sun className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => theme === 'light' && toggleTheme()}
                                                className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                <Moon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Map */}
                                <div className="bg-card rounded-md overflow-hidden border border-border shadow-sm flex flex-col relative group">
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-400 dark:bg-slate-600" />
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <MapIcon className="w-3.5 h-3.5" /> Deployment Site
                                        </h3>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 h-56 relative overflow-hidden z-0 transition-colors">
                                        {(displayUser?.latitude && displayUser?.longitude && (parseFloat(displayUser.latitude) !== 0 || parseFloat(displayUser.longitude) !== 0)) ? (
                                            <MapContainer
                                                center={[parseFloat(displayUser.latitude), parseFloat(displayUser.longitude)]}
                                                zoom={15}
                                                scrollWheelZoom={false}
                                                style={{ height: '100%', width: '100%' }}
                                                zoomControl={false}
                                            >
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM contributors' />
                                                <Marker position={[parseFloat(displayUser.latitude), parseFloat(displayUser.longitude)]}>
                                                    <Popup>Identity Node Location</Popup>
                                                </Marker>
                                            </MapContainer>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/40">
                                                <MapPin className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-2" />
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">No Geo-Tags Synchronized</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-card text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center border-t border-border transition-colors">
                                        {displayUser?.city || 'Undefined Sector'}
                                    </div>
                                </div>
                            </div>

                            {/* Data Clusters */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Demographics Cluster */}
                                <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-700 dark:bg-slate-600" />
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-100 dark:border-slate-700">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Primary Identity Data</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ProfileField label="Registry Full Name" value={displayUser?.full_name} icon={User} />
                                        <ProfileField label="Communication Uplink" value={displayUser?.email} icon={Mail} />
                                        <ProfileField label="Chronological Age" value={displayUser?.age && `${displayUser.age} Cycles`} icon={Calendar} />
                                        <ProfileField label="Biological Classification" value={displayUser?.gender} icon={Activity} />
                                    </div>
                                </div>

                                {/* Medical Context Cluster */}
                                <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500/80" />
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-900/30">
                                            <FileText className="w-3.5 h-3.5" />
                                        </div>
                                        <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Medical Telemetry</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="bg-slate-50 dark:bg-slate-950/40 rounded-md p-5 border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                                            <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-3">Historical Logs</h4>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                                {displayUser?.medical_history ? `"${displayUser.medical_history}"` : "No medical telemetry records currently synchronized."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Residence Cluster */}
                                <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500/80" />
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                                            <Globe className="w-3.5 h-3.5" />
                                        </div>
                                        <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Geographic Allocation</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ProfileField label="Street Logic" value={displayUser?.street_address} icon={MapPin} fullWidth />
                                        <ProfileField label="Urban Node" value={displayUser?.city} icon={MapIcon} />
                                        <ProfileField label="Global Sector" value={displayUser?.country} icon={Globe} />
                                        <ProfileField label="Postal Routing" value={displayUser?.postal_code} icon={MapPin} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default PatientProfilePage
