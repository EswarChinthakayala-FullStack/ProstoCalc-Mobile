import React, { useState, useEffect } from 'react'
import {
  User, MapPin, Building2, Activity,
  Save, ArrowLeft, Loader2, Stethoscope,
  Clock, CreditCard, Phone, ShieldCheck,
  Map as MapIcon, Settings as SettingsIcon, Globe,
  Sparkles, CircleDollarSign, Star, Fingerprint,
  LocateFixed, Eye, EyeOff, CheckCircle2,
  AlertCircle, MapPinOff,
  Target, ChevronLeft, ChevronRight,
  Sun, Moon
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useDentistProfile } from '@/hooks/useDentistProfile'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationBell from '@/components/NotificationBell'
import UniversalLoader from '@/components/UniversalLoader'
import { useTheme } from '@/context/ThemeContext'

const DentistProfileEditPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profileData, settings, loading, saving, updateProfile, updateSettings } = useDentistProfile(user?.id)
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme, toggleTheme } = useTheme()

  // Local state for profile form
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    specialization: '',
    experience_years: '',
    license_number: '',
    clinic_name: '',
    clinic_address: '',
    clinic_city: '',
    clinic_phone: '',
    consultation_fee: '',
    latitude: '',
    longitude: ''
  })

  // Local state for settings form
  const [settingsFormData, setSettingsFormData] = useState({
    visible_to_patients: true,
    accept_patient_requests: true,
    consultation_mode: 'FULL'
  })

  const [detecting, setDetecting] = useState(false)

  // --- Address Suggestion Logic ---
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Debounced search for address suggestions
  useEffect(() => {
    if (!profileFormData.clinic_address || !showSuggestions || profileFormData.clinic_address.length < 3) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      fetchSuggestions(profileFormData.clinic_address)
    }, 600)

    return () => clearTimeout(timer)
  }, [profileFormData.clinic_address, showSuggestions])

  const fetchSuggestions = async (query) => {
    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`, {
        headers: { 'Accept-Language': 'en-US,en' }
      })
      const data = await res.json()
      setSuggestions(data)
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSuggestion = (s) => {
    const addr = s.address || {}
    const streetParts = [addr.house_number, addr.road || addr.pedestrian || addr.footway || addr.path || addr.neighbourhood].filter(Boolean)
    const streetLabel = streetParts.join(' ').trim() || s.display_name.split(',')[0]
    const city = addr.city || addr.town || addr.village || addr.suburb || ''

    setProfileFormData(prev => ({
      ...prev,
      clinic_address: streetLabel,
      clinic_city: city,
      latitude: s.lat,
      longitude: s.lon
    }))

    setShowSuggestions(false)
    setSuggestions([])
    toast.success('Clinical location synchronized.')
  }
  // --------------------------------

  useEffect(() => {
    if (profileData) {
      setProfileFormData({
        full_name: profileData.full_name || user?.full_name || '',
        specialization: profileData.specialization || '',
        experience_years: profileData.experience_years || '',
        license_number: profileData.license_number || '',
        clinic_name: profileData.clinic_name || '',
        clinic_address: profileData.clinic_address || '',
        clinic_city: profileData.clinic_city || '',
        clinic_phone: profileData.clinic_phone || '',
        consultation_fee: profileData.consultation_fee || '',
        latitude: profileData.latitude || '',
        longitude: profileData.longitude || ''
      })
    }
    if (settings) {
      setSettingsFormData({
        visible_to_patients: !!settings.visible_to_patients,
        accept_patient_requests: !!settings.accept_patient_requests,
        consultation_mode: settings.consultation_mode || 'FULL'
      })
    }
  }, [profileData, settings, user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    if (name === 'clinic_address') setShowSuggestions(true)
    setProfileFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSettingsChange = (name, value) => {
    setSettingsFormData(prev => ({ ...prev, [name]: value }))
  }

  const detectLocation = () => {
    setDetecting(true)
    if (!navigator.geolocation) {
      toast.error("Geolocation Protocol Offline")
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setProfileFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }))

        try {
          // Reverse Geocoding via Nominatim
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
          if (response.ok) {
            const data = await response.json()
            const address = data.address
            const fullAddress = data.display_name
            const city = address.city || address.town || address.village || address.suburb || ''

            setProfileFormData(prev => ({
              ...prev,
              clinic_address: fullAddress || prev.clinic_address,
              clinic_city: city || prev.clinic_city
            }))
            toast.success("Intelligence Synchronized: Address Resolved")
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err)
          toast.warning("Coordinates locked, but address resolution failed")
        } finally {
          setDetecting(false)
        }
      },
      (error) => {
        toast.error("Signal Interference: " + error.message)
        setDetecting(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleGlobalSave = async () => {
    const pSuccess = await updateProfile(profileFormData)
    const sSuccess = await updateSettings(settingsFormData)

    if (pSuccess && sSuccess) {
      toast.success("System Logic & Profile Synchronized")
      navigate('/dentist/profile')
    } else if (pSuccess || sSuccess) {
      toast.warning("Partial Synchronization Complete")
    }
  }

  if (loading) {
    return <UniversalLoader text="INITIALIZING CONSOLE..." variant="dentist" />
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
              <div className="flex items-center gap-4 min-w-0">
                <MobileSidebarTrigger />
                <button
                  onClick={() => navigate(-1)}
                  className="hidden xl:flex w-9 h-9 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md items-center justify-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-zinc-700 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Console Configuration</h1>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5 hidden sm:block">Update clinical identity and operational logic</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="hidden sm:flex text-slate-500 dark:text-teal-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-md h-10 px-4"
                >
                  Discard
                </Button>
                <NotificationBell />
                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
                <Button
                  onClick={handleGlobalSave}
                  disabled={saving}
                  className="bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white gap-2 font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 dark:shadow-black/40 h-10 px-6 rounded-md"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Commit Sync</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Profile & Infrastructure */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-8">

              {/* Clinical Identity */}
              <div className="bg-white dark:bg-zinc-950/20 rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-500" />
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-md bg-teal-50 dark:bg-zinc-900/50 border border-teal-100 dark:border-zinc-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinical Identity</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">Professional Registry</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Full Medical Name" name="full_name" value={profileFormData.full_name} onChange={handleProfileChange} icon={User} placeholder="Clinical Professional" />
                    <FormInput label="Medical License ID" name="license_number" value={profileFormData.license_number} onChange={handleProfileChange} icon={CreditCard} placeholder="Registry ID" />
                    <FormInput label="Primary Specialization" name="specialization" value={profileFormData.specialization} onChange={handleProfileChange} icon={Star} placeholder="Core Domain" />
                    <FormInput label="Clinical Experience (Years)" name="experience_years" type="number" value={profileFormData.experience_years} onChange={handleProfileChange} icon={Clock} />
                  </div>
                </div>
              </div>

              {/* Infrastructure Assets */}
              <div className="bg-white dark:bg-zinc-950/20 rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-zinc-900/50 border border-indigo-100 dark:border-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinical Assets</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">Physical Infrastructure</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <FormInput label="Practice Brand Name" name="clinic_name" value={profileFormData.clinic_name} onChange={handleProfileChange} icon={Building2} placeholder="Clinic Identity" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormInput label="Standard Base Fee (₹)" name="consultation_fee" type="number" value={profileFormData.consultation_fee} onChange={handleProfileChange} icon={CircleDollarSign} />
                      <FormInput label="Practice Contact Line" name="clinic_phone" value={profileFormData.clinic_phone} onChange={handleProfileChange} icon={Phone} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 relative">
                        <FormInput
                          label="Clinical Deployment Address"
                          name="clinic_address"
                          value={profileFormData.clinic_address}
                          onChange={handleProfileChange}
                          icon={MapPin}
                          placeholder="Street Address"
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (suggestions.length > 0 || isSearching) && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md shadow-2xl overflow-hidden backdrop-blur-xl">
                            {isSearching && suggestions.length === 0 ? (
                              <div className="p-4 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Searching Registry...</span>
                              </div>
                            ) : (
                              <div className="max-h-60 overflow-y-auto">
                                {suggestions.map((s, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(s)}
                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left border-b border-slate-100 dark:border-zinc-800/50 last:border-0"
                                  >
                                    <MapPin className="w-4 h-4 mt-0.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[12px] font-bold text-slate-700 dark:text-zinc-200 truncate">{s.display_name.split(',')[0]}</p>
                                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate leading-tight mt-0.5">{s.display_name.split(',').slice(1).join(',').trim()}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <FormInput label="Practice City" name="clinic_city" value={profileFormData.clinic_city} onChange={handleProfileChange} icon={MapIcon} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Operational Logic & Geo */}
            <div className="lg:col-span-12 xl:col-span-4 space-y-8">

              {/* Operational Logic */}
              <div className="bg-white dark:bg-zinc-950/30 rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-zinc-900/50 border border-amber-100 dark:border-zinc-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Operational Logic</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">Console Behavior</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Interface Mode */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-md border border-slate-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> Display Protocol
                        </span>
                        <div className="flex p-0.5 bg-slate-100 dark:bg-zinc-950 rounded-md border border-slate-200 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={theme === 'dark' ? toggleTheme : undefined}
                            className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={theme === 'light' ? toggleTheme : undefined}
                            className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-zinc-800 text-teal-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-md border transition-all ${settingsFormData.visible_to_patients ? 'bg-teal-50/30 dark:bg-zinc-900/50 border-teal-100 dark:border-zinc-800' : 'bg-slate-50 dark:bg-zinc-900/10 border-slate-100 dark:border-zinc-900'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${settingsFormData.visible_to_patients ? 'bg-teal-100 dark:bg-zinc-950 text-teal-600 dark:text-teal-400 shadow-sm border border-white dark:border-zinc-800' : 'bg-slate-200 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600'}`}>
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Public Radar</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold mt-0.5">Discoverable by patients</p>
                        </div>
                      </div>
                      <Switch checked={settingsFormData.visible_to_patients} onCheckedChange={(val) => handleSettingsChange('visible_to_patients', val)} />
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-md border transition-all ${settingsFormData.accept_patient_requests ? 'bg-teal-50/30 dark:bg-zinc-900/50 border-teal-100 dark:border-zinc-800' : 'bg-slate-50 dark:bg-zinc-900/10 border-slate-100 dark:border-zinc-900'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${settingsFormData.accept_patient_requests ? 'bg-teal-100 dark:bg-zinc-950 text-teal-600 dark:text-teal-400 shadow-sm border border-white dark:border-zinc-800' : 'bg-slate-200 dark:bg-zinc-900 text-slate-400'}`}>
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Request Stream</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold mt-0.5">Receive active inquiries</p>
                        </div>
                      </div>
                      <Switch checked={settingsFormData.accept_patient_requests} onCheckedChange={(val) => handleSettingsChange('accept_patient_requests', val)} />
                    </div>

                    <div className="pt-4 space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Console Operational Mode</Label>
                      <Select value={settingsFormData.consultation_mode} onValueChange={(val) => handleSettingsChange('consultation_mode', val)}>
                        <SelectTrigger className="h-11 rounded-md border-slate-200 dark:border-zinc-800 font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-900 focus:ring-teal-500/20 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]" position="popper" sideOffset={4}>
                          <SelectItem value="FULL" className="font-bold py-2">Comprehensive Suite (Networked)</SelectItem>
                          <SelectItem value="CALCULATION_ONLY" className="font-bold py-2">Isolated Diagnostics (Offline)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geospatial Sync */}
              <div className="bg-white dark:bg-zinc-950/30 rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-zinc-900/50 border border-blue-100 dark:border-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Geospatial Sync</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">Marker Deployment</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={detectLocation}
                      disabled={detecting}
                      className="text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900 hover:text-teal-700 rounded-md h-9 font-bold text-[10px] uppercase tracking-widest px-4 shadow-sm"
                    >
                      {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <LocateFixed className="w-3.5 h-3.5 mr-2" />}
                      Recalibrate
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Latitude</Label>
                        <Input name="latitude" value={profileFormData.latitude} onChange={handleProfileChange} className="bg-slate-50 dark:bg-zinc-950 font-mono text-xs h-11 border-slate-200 dark:border-zinc-800 rounded-md font-extrabold text-slate-700 dark:text-zinc-100" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Longitude</Label>
                        <Input name="longitude" value={profileFormData.longitude} onChange={handleProfileChange} className="bg-slate-50 dark:bg-zinc-950 font-mono text-xs h-11 border-slate-200 dark:border-zinc-800 rounded-md font-extrabold text-slate-700 dark:text-zinc-100" />
                      </div>
                    </div>

                    <div className="h-56 rounded-md overflow-hidden border border-slate-200 dark:border-zinc-800 relative bg-slate-50 dark:bg-black shadow-inner">
                      {profileFormData.latitude && profileFormData.longitude ? (
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(profileFormData.longitude) - 0.002}%2C${parseFloat(profileFormData.latitude) - 0.002}%2C${parseFloat(profileFormData.longitude) + 0.002}%2C${parseFloat(profileFormData.latitude) + 0.002}&layer=mapnik&marker=${profileFormData.latitude}%2C${profileFormData.longitude}`}
                          className={`w-full h-full grayscale-[0.2] contrast-[0.9] opacity-90 ${theme === 'dark' ? 'invert hue-rotate-180 brightness-95' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-800">
                          <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
                            <MapPinOff className="w-6 h-6" />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Signal Missing</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </motion.div>
    </div>
  )
}

const FormInput = ({ label, name, value, onChange, icon: Icon, type = "text", placeholder }) => (
  <div className="space-y-2">
    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">{label}</Label>
    <div className="relative group">
      <Input
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10 h-12 rounded-md border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 focus:bg-white dark:focus:bg-zinc-900/60 focus:ring-teal-500/10 focus:border-teal-500 dark:focus:border-teal-400 font-bold text-slate-700 dark:text-slate-100 transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-800 placeholder:font-medium"
      />
      {Icon && <Icon className="w-4 h-4 text-slate-300 dark:text-zinc-800 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-teal-500 dark:group-focus-within:text-teal-400 transition-colors" />}
    </div>
  </div>
)

export default DentistProfileEditPage
