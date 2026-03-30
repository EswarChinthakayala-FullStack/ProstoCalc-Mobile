import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, MapPin, Calendar, Activity,
  Save, ChevronLeft, Globe, Locate,
  Mail, Shield, Loader2, MapPinOff, ChevronRight,
  ArrowLeft, Search,
  Layout
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { usePatientProfile } from '@/hooks/usePatientProfile'
import NotificationBell from '@/components/NotificationBell'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import UniversalLoader from '@/components/UniversalLoader'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'

/* ─── Shared input ───────────────────────────────────────────────────────────── */
const FormInput = ({ label, name, value, onChange, icon: Icon, type = 'text', placeholder }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-zinc-500 block mb-1.5">{label}</label>
    <div className="relative group/inp">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-zinc-600 group-focus-within/inp:text-blue-600 dark:group-focus-within/inp:text-blue-400 transition-all pointer-events-none" />
      )}
      <input
        name={name} type={type} value={value || ''} onChange={onChange} placeholder={placeholder}
        className={cn(
          'w-full h-12 rounded-md text-[13px] font-bold text-slate-900 dark:text-white',
          'bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50',
          'placeholder:text-slate-400/30 placeholder:font-medium',
          'focus:outline-none focus:border-blue-600/50 focus:ring-8 focus:ring-blue-600/5 focus:bg-white dark:focus:bg-zinc-900',
          'transition-all duration-300 shadow-sm',
          Icon ? 'pl-12 pr-4' : 'px-4'
        )}
      />
    </div>
  </div>
)

/* ─── Section card ───────────────────────────────────────────────────────────── */
const SectionCard = ({ accentColor, icon: Icon, iconBg, iconText, title, subtitle, children }) => (
  <div className="bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-slate-100 dark:border-zinc-800/50 rounded-md overflow-hidden relative hover:shadow-2xl hover:border-blue-600/20 transition-all duration-500 group">
    <div className={`absolute top-0 left-0 right-0 h-[4px] ${accentColor} opacity-80 group-hover:opacity-100 transition-opacity`} />
    <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/30">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${iconBg} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
          <Icon className={`w-5 h-5 ${iconText}`} />
        </div>
        <div>
          <p className="text-[14px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{title}</p>
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-1.5">{subtitle}</p>
        </div>
      </div>
    </div>
    <div className="p-8 sm:p-10">{children}</div>
  </div>
)

const ProfileEditPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profileData, loading, saving, updateProfile } = usePatientProfile(user?.id)
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme } = useTheme()

  const [formData, setFormData] = useState({
    age: '', gender: '', medical_history: '',
    street_address: '', city: '', district: '',
    state: '', postal_code: '', country: '',
    latitude: '', longitude: ''
  })

  // --- Address Suggestion Logic ---
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Debounced search for address suggestions
  useEffect(() => {
    if (!formData.street_address || !showSuggestions || formData.street_address.length < 3) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      fetchSuggestions(formData.street_address)
    }, 600)

    return () => clearTimeout(timer)
  }, [formData.street_address, showSuggestions])

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

    setFormData(p => ({
      ...p,
      street_address: streetLabel,
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      district: addr.state_district || addr.county || addr.suburb || '',
      state: addr.state || addr.province || addr.region || '',
      postal_code: addr.postcode || '',
      country: addr.country || '',
      latitude: s.lat,
      longitude: s.lon
    }))

    setShowSuggestions(false)
    setSuggestions([])
    toast.success('Location details populated.')
  }
  // --------------------------------

  useEffect(() => {
    if (profileData) setFormData({
      age: profileData.age || '',
      gender: profileData.gender || '',
      medical_history: profileData.medical_history || '',
      street_address: profileData.street_address || '',
      city: profileData.city || '',
      district: profileData.district || '',
      state: profileData.state || '',
      postal_code: profileData.postal_code || '',
      country: profileData.country || '',
      latitude: profileData.latitude || '',
      longitude: profileData.longitude || '',
    })
  }, [profileData])

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }))
  const handleChange = e => {
    if (e.target.name === 'street_address') setShowSuggestions(true)
    set(e.target.name, e.target.value)
  }

  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) { toast.error('Geolocation not supported'); return }
    toast.info('Accessing clinical sensors…')
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        setFormData(p => ({ ...p, latitude: lat, longitude: lon }))
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, { headers: { 'Accept-Language': 'en-US,en' } })
          const data = await res.json()
          const addr = data.address || {}
          const streetParts = [addr.house_number, addr.road || addr.pedestrian || addr.footway || addr.path || addr.neighbourhood].filter(Boolean)
          setFormData(p => ({
            ...p, latitude: lat, longitude: lon,
            street_address: streetParts.join(' ').trim() || p.street_address,
            city: addr.city || addr.town || addr.village || addr.municipality || '',
            district: addr.state_district || addr.county || addr.suburb || '',
            state: addr.state || addr.province || addr.region || '',
            postal_code: addr.postcode || '',
            country: addr.country || '',
          }))
          toast.success('Geographic data synchronized.')
        } catch { toast.warning('Coordinates locked, address lookup failed') }
      },
      err => toast.error('Sensor error: ' + err.message),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const handleSubmit = async e => {
    if (e) e.preventDefault()
    const payload = {
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      medical_history: formData.medical_history,
      street_address: formData.street_address,
      city: formData.city,
      district: formData.district,
      state: formData.state,
      postal_code: formData.postal_code,
      country: formData.country,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
    }
    const ok = await updateProfile(payload)
    if (ok) navigate('/patient/profile')
  }

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-border border-t-blue-600 rounded-md"
        />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Accessing Registry...</p>
      </div>
    </div>
  )

  const hasCoords = formData.latitude && formData.longitude &&
    (parseFloat(formData.latitude) !== 0 || parseFloat(formData.longitude) !== 0)

  return (
    <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden transition-colors duration-500 text-slate-900 dark:text-white">
      <PatientSidebar />

      <motion.div
        initial={false}
        animate={{ marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative"
      >
        <div className="absolute inset-0 opacity-100 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181b' : '#f1f5f9'} 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />

        {/* ══ HEADER ══════════════════════════════ */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <PatientSidebarTrigger />
                <button
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase">Modify Registry</h1>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 hidden sm:block">Configuration Console</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  className="hidden sm:flex h-9 px-4 rounded-md text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase tracking-widest"
                >
                  Discard
                </Button>
                <NotificationBell color="slate" />
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 h-10 px-6 rounded-md text-[11px] font-black text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Commit Changes
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ══ CONTENT ═════════════════════════════ */}
        <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Upper Identity Panel */}
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-md overflow-hidden relative shadow-sm p-6 flex items-center gap-5">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600" />
              <div className="w-16 h-16 bg-blue-600 rounded-md flex items-center justify-center text-white text-2xl font-black shadow-inner rotate-[-2deg]">
                {user?.full_name?.charAt(0) || 'P'}
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-black text-foreground leading-tight uppercase tracking-tight">{user?.full_name || "Guest Patient"}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground truncate">{user?.email}</span>
                  <span className="w-1 h-1 rounded-md bg-border" />
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Authenticated Account</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT — primary data */}
              <div className="space-y-8">
                <SectionCard
                  accentColor="bg-blue-600 dark:bg-blue-500"
                  icon={User} iconBg="bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800" iconText="text-blue-600 dark:text-blue-400"
                  title="Primary Metrics" subtitle="Identity Parameters"
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Age */}
                      <div className="space-y-1.5 w-full">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">Chronological Age</label>
                        <div className="relative group/inp">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within/inp:text-slate-600 transition-colors pointer-events-none" />
                          <input
                            name="age" type="number" value={formData.age} placeholder="Cycles"
                            onChange={handleChange}
                            className="w-full h-12 pl-11 pr-4 rounded-md text-[13px] font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-700 focus:ring-4 focus:ring-slate-500/5 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="space-y-1.5 w-full">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">Classification</label>
                        <Select value={formData.gender} onValueChange={v => set('gender', v)}>
                          <SelectTrigger className="h-12 rounded-md border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[13px] font-black text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all shadow-sm">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="Male" className="text-[13px] font-bold">Male</SelectItem>
                            <SelectItem value="Female" className="text-[13px] font-bold">Female</SelectItem>
                            <SelectItem value="Other" className="text-[13px] font-bold">Other</SelectItem>
                            <SelectItem value="Prefer_not_to_say" className="text-[13px] font-bold italic text-slate-400">Restricted Access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">Clinical Background</label>
                      <textarea
                        name="medical_history" value={formData.medical_history}
                        onChange={handleChange} rows={6}
                        placeholder="Log any physiological conditions, allergens, or previous treatments…"
                        className="w-full px-4 py-4 rounded-md text-[13px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-700 focus:ring-4 focus:ring-slate-500/5 transition-all resize-none shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-700 placeholder:font-medium"
                      />
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <Activity className="w-3 h-3 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">Data assists in diagnosis preparation.</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* RIGHT — location data */}
              <div className="space-y-8">
                <SectionCard
                  accentColor="bg-emerald-500/80"
                  icon={MapPin} iconBg="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" iconText="text-emerald-600 dark:text-emerald-500"
                  title="Geographic Uplink" subtitle="Spatial Coordination"
                >
                  <div className="space-y-5">
                    <div className="relative">
                      <FormInput
                        label="Deployment Address"
                        name="street_address"
                        value={formData.street_address}
                        onChange={handleChange}
                        icon={MapPin}
                        placeholder="Unit, Street..."
                      />

                      {/* Suggestions Dropdown */}
                      {showSuggestions && (suggestions.length > 0 || isSearching) && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border border-border rounded-md shadow-xl overflow-hidden backdrop-blur-md">
                          {isSearching && suggestions.length === 0 ? (
                            <div className="p-4 flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Searching...</span>
                            </div>
                          ) : (
                            <div className="max-h-60 overflow-y-auto">
                              {suggestions.map((s, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(s)}
                                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left border-b border-border last:border-0"
                                >
                                  <MapPin className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-bold text-foreground truncate">{s.display_name.split(',')[0]}</p>
                                    <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{s.display_name.split(',').slice(1).join(',').trim()}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormInput label="Urban Node" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
                      <FormInput label="Postal Tag" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="Routing" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormInput label="Administrative District" name="district" value={formData.district} onChange={handleChange} placeholder="District" />
                      <FormInput label="State / Province" name="state" value={formData.state} onChange={handleChange} placeholder="Region" />
                    </div>

                    <FormInput label="Global Sector" name="country" value={formData.country} onChange={handleChange} icon={Globe} placeholder="Domain" />

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Sensor Coordinates</label>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          className="flex items-center gap-1.5 h-8 px-4 rounded-md text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all shadow-sm uppercase tracking-widest active:scale-95"
                        >
                          <Locate className="w-3 h-3" />
                          Auto-Sync
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">Latitude</label>
                          <input
                            name="latitude" value={formData.latitude}
                            onChange={handleChange} placeholder="0.000"
                            className="w-full h-12 px-4 rounded-md text-[12px] font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-slate-400 transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">Longitude</label>
                          <input
                            name="longitude" value={formData.longitude}
                            onChange={handleChange} placeholder="0.000"
                            className="w-full h-12 px-4 rounded-md text-[12px] font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-slate-400 transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div className={cn('rounded-md overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 transition-all duration-500 shadow-inner', hasCoords ? 'h-48' : 'h-24')}>
                        {hasCoords ? (
                          <iframe
                            width="100%" height="100%"
                            frameBorder="0" scrolling="no"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.longitude) - 0.0025}%2C${parseFloat(formData.latitude) - 0.0025}%2C${parseFloat(formData.longitude) + 0.0025}%2C${parseFloat(formData.latitude) + 0.0025}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`}
                            className={`w-full h-full grayscale-[0.3] opacity-80 ${theme === 'dark' ? 'invert hue-rotate-180 brightness-90' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <MapPinOff className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Awaiting spatial data</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            {/* Final Submission */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center lg:justify-end gap-4">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="h-12 px-8 rounded-md text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase tracking-widest"
              >
                Discard Changes
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="h-12 px-10 rounded-md text-[12px] font-black text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-xl shadow-blue-600/20 uppercase tracking-widest active:scale-95"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Finalize Registry Update
              </Button>
            </div>
          </form>
        </main>
      </motion.div>
    </div>
  )
}

export default ProfileEditPage