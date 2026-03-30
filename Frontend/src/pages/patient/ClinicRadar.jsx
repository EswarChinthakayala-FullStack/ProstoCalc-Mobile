import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  MapPin, Search, Navigation, Phone, Building2, MessageSquare,
  Clock, ArrowUpRight, Zap, Send, X, CheckCircle2, Loader2,
  RotateCcw, Mountain, Hospital, Crosshair, Star, ChevronRight,
  Filter, SlidersHorizontal, Menu, Globe, List, Map as MapIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import {
  Map as MapLibre,
  MapMarker,
  MarkerContent,
  MapRoute,
  MarkerLabel,
  MapControls,
  useMap as useMapLibre
} from '@/components/ui/map'
import { getNearbyClinics, sendConsultationRequest, checkRequestStatus } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { useTheme } from '@/context/ThemeContext'

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDuration = (seconds) => {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

// ─── 3D Map Controller ───────────────────────────────────────────────────────
const Map3DController = ({ className = "top-4 right-4" }) => {
  const { map, isLoaded } = useMapLibre()

  const handle3DView = () => map?.easeTo({ pitch: 45, bearing: -10, duration: 1000 })
  const handleReset = () => map?.easeTo({ pitch: 0, bearing: 0, duration: 1000 })

  if (!isLoaded) return null

  return (
    <div className={`absolute z-10 flex flex-col gap-2 ${className}`}>
      <button
        onClick={handle3DView}
        className="w-8 h-8 md:w-10 md:h-10 rounded-md shadow-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center text-foreground hover:bg-blue-600 hover:text-white transition-all active:scale-90 group"
        title="3D View"
      >
        <Mountain className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
      </button>
      <button
        onClick={handleReset}
        className="w-8 h-8 md:w-10 md:h-10 rounded-md shadow-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center text-foreground hover:bg-blue-600 hover:text-white transition-all active:scale-90 group"
        title="Reset Orientation"
      >
        <RotateCcw className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  )
}

// ─── Map Location Sync (flies to user location on change) ────────────────────
const MapLocationSync = ({ userLocation }) => {
  const { map, isLoaded } = useMapLibre()
  const hasFlewRef = useRef(false)

  useEffect(() => {
    if (!map || !isLoaded || !userLocation) return
    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
      speed: 1.4,
      curve: 1.4,
      essential: true
    })
    hasFlewRef.current = true
  }, [map, isLoaded, userLocation])

  return null
}

// ─── Sidebar Clinic Card ─────────────────────────────────────────────────────
const SidebarClinicCard = ({ clinic, isSelected, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`w-full text-left p-4.5 rounded-md border transition-all cursor-pointer relative overflow-hidden flex flex-col group ${isSelected
      ? 'bg-blue-600/10 border-blue-600/40 shadow-xl shadow-blue-600/10'
      : 'bg-card border-border hover:border-blue-600/30 hover:shadow-lg'
      }`}
  >
    <div className={`absolute top-0 left-0 right-0 h-[3px] transition-colors ${isSelected ? 'bg-blue-600' : 'bg-transparent group-hover:bg-blue-600/40'
      }`} />

    <div className="flex items-start gap-3">
      <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-secondary border-border text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500'
        }`}>
        <Hospital className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate tracking-tight">
              {clinic.clinic_name || clinic.full_name}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5 uppercase tracking-widest leading-none">
              Dr. {clinic.full_name}
            </p>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md shrink-0 border ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-secondary border-border text-muted-foreground'
            }`}>
            {clinic.distance?.toFixed(1)} km
          </span>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
          {clinic.clinic_city && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              <MapPin className="w-3.5 h-3.5 text-blue-500/60" />
              {clinic.clinic_city}
            </div>
          )}
          {clinic.specialization && (
            <>
              <span className="w-1.5 h-1.5 rounded-md bg-border" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">
                {clinic.specialization}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  </motion.div>
)

// ─── Clinic Detail Panel (Sheet) ─────────────────────────────────────────────
const ClinicDetailContent = ({ clinic, userLocation, onClose }) => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [requestStatus, setRequestStatus] = useState(null)
  const [requestId, setRequestId] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('I would like to request a consultation regarding my dental record.')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [routes, setRoutes] = useState([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [isRouting, setIsRouting] = useState(false)

  const checkStatus = useCallback(async () => {
    if (!user?.id || !clinic?.id) return
    try {
      const res = await checkRequestStatus(user.id, clinic.id)
      if (res.status === 'success' && res.exists) {
        setRequestStatus(res.request_status)
        setRequestId(res.id)
      }
      else {
        setRequestStatus(null)
        setRequestId(null)
      }
    } catch (e) { console.error(e) }
  }, [user?.id, clinic?.id])

  useEffect(() => { checkStatus() }, [checkStatus])

  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !clinic.latitude || !clinic.longitude) return
      setIsRouting(true)
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${clinic.longitude},${clinic.latitude}?overview=full&geometries=geojson&alternatives=true`
        )
        const data = await res.json()
        if (data.routes?.length > 0) {
          setRoutes(data.routes.map(r => ({
            coordinates: r.geometry.coordinates,
            duration: r.duration,
            distance: r.distance
          })))
        }
      } catch (e) { console.error('Routing failed:', e) }
      finally { setIsRouting(false) }
    }
    fetchRoute()
  }, [userLocation, clinic.latitude, clinic.longitude])

  const handleSendRequest = async () => {
    if (!user?.id) { toast.error('Please log in to request a consultation'); return }
    setIsSending(true)
    try {
      const res = await sendConsultationRequest({ patient_id: user.id, dentist_id: clinic.id, message })
      if (res.status === 'success') {
        toast.success('Consultation request sent!')
        setRequestStatus('PENDING')
        setRequestId(res.id)
        setShowRequestForm(false)
      } else toast.error(res.message)
    } catch (e) { toast.error(e.message) }
    finally { setIsSending(false) }
  }

  const handleOpenGoogleMaps = () => {
    const dest = `${clinic.latitude},${clinic.longitude}`
    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
    if (userLocation) url += `&origin=${userLocation.lat},${userLocation.lng}`
    window.open(url, '_blank')
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-7 text-white flex-shrink-0">
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <Zap className="w-48 h-48 absolute -right-8 -top-8 rotate-12 opacity-30" />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-5 right-5 z-[60] w-11 h-11 rounded-md bg-black/20 hover:bg-black/30 flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all active:scale-90"
        >
          <X className="w-5.5 h-5.5 text-white" />
        </button>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0 backdrop-blur-xl border border-white/20 shadow-2xl">
            <Hospital className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black leading-tight tracking-tighter uppercase">{clinic.clinic_name || clinic.full_name}</h2>
            <p className="text-white/80 text-sm font-black mt-1 uppercase tracking-widest">Dr. {clinic.full_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-white/10 rounded-md text-white/90 text-[8px] font-black uppercase tracking-[0.2em] border border-white/10">{clinic.specialization || 'General Dentistry'}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-md p-4 text-center border border-white/10 shadow-2xl">
            <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Telemetry</p>
            <p className="text-lg font-black text-white tabular-nums">
              {routes[selectedRouteIndex] ? formatDistance(routes[selectedRouteIndex].distance) : (clinic.distance ? `${clinic.distance.toFixed(1)} km` : '—')}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-md p-4 text-center border border-white/10 shadow-2xl">
            <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Transit</p>
            <p className="text-lg font-black text-white tabular-nums">
              {routes[selectedRouteIndex] ? formatDuration(routes[selectedRouteIndex].duration) : (isRouting ? '…' : '—')}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {/* Route alternatives */}
        {routes.length > 1 && (
          <div className="px-4 pt-4 flex gap-2">
            {routes.map((route, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRouteIndex(idx)}
                className={`flex-1 p-3.5 rounded-md border text-left transition-all ${selectedRouteIndex === idx
                  ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20'
                  : 'bg-secondary/80 border-border text-muted-foreground hover:border-blue-600/30'
                  }`}
              >
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${selectedRouteIndex === idx ? 'text-white/70' : 'text-muted-foreground/60'}`}>
                  {idx === 0 ? 'Optimal' : `Path ${idx + 1}`}
                </p>
                <p className="text-sm font-black mt-1 tabular-nums">{formatDuration(route.duration)}</p>
                <p className={`text-[10px] font-black uppercase ${selectedRouteIndex === idx ? 'text-white/60' : 'text-muted-foreground/40'}`}>{formatDistance(route.distance)}</p>
              </button>
            ))}
          </div>
        )}

        {/* Mini map */}
        <div className="mx-4 mt-4 h-52 rounded-md overflow-hidden relative border border-border shadow-sm">
          <MapLibre
            theme={theme === 'dark' ? 'dark' : 'light'}
            viewport={{
              center: userLocation
                ? [(userLocation.lng + parseFloat(clinic.longitude)) / 2, (userLocation.lat + parseFloat(clinic.latitude)) / 2]
                : [parseFloat(clinic.longitude), parseFloat(clinic.latitude)],
              zoom: userLocation ? 12 : 14
            }}
            className="w-full h-full"
          >
            {routes.map((route, idx) => (
              <MapRoute
                key={`route-${idx}`}
                id={`route-${idx}-${clinic.id}`}
                coordinates={route.coordinates}
                color={idx === selectedRouteIndex ? '#2563EB' : 'var(--border)'}
                width={idx === selectedRouteIndex ? 6 : 3}
                opacity={idx === selectedRouteIndex ? 1 : 0.6}
                onClick={() => setSelectedRouteIndex(idx)}
              />
            ))}
            <Map3DController className="top-3 left-3" />
            <MapMarker longitude={parseFloat(clinic.longitude)} latitude={parseFloat(clinic.latitude)}>
              <MarkerContent>
                <div className="w-7 h-7 bg-primary rounded-md border-2 border-background shadow-lg flex items-center justify-center text-primary-foreground">
                  <Hospital className="w-3.5 h-3.5" />
                </div>
              </MarkerContent>
            </MapMarker>
            {userLocation && (
              <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
                <MarkerContent>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-rose-500/20 rounded-md animate-ping" />
                    <div className="w-3.5 h-3.5 bg-rose-600 rounded-md border-2 border-background shadow-lg relative z-10" />
                  </div>
                </MarkerContent>
              </MapMarker>
            )}
            <MapControls
              position="bottom-right"
              className="scale-75 origin-bottom-right"
              showZoom
              showCompass
              showLocate
              showFullscreen
            />
          </MapLibre>
          {isRouting && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-md flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Routing Link...</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigate button */}
        <div className="px-4 mt-4">
          <button
            onClick={handleOpenGoogleMaps}
            className="w-full h-14 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98]"
          >
            <Navigation className="w-5 h-5" />
            Launch Surgical Telemetry
          </button>
        </div>

        {/* Address */}
        {clinic.clinic_address && (
          <div className="mx-4 mt-4 p-5 bg-card/50 backdrop-blur-xl rounded-md border border-border group hover:border-blue-600/30 transition-all cursor-default shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600/10 border border-blue-600/20 rounded-md flex items-center justify-center text-blue-600 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 opacity-60">Ops Center</p>
                <p className="text-sm font-black text-foreground leading-snug group-hover:text-blue-500 transition-colors uppercase tracking-tight">
                  {clinic.clinic_address}{clinic.clinic_city ? `, ${clinic.clinic_city}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phone */}
        {clinic.clinic_phone && (
          <div className="mx-4 mt-3 p-5 bg-card/50 backdrop-blur-xl rounded-md border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-600/10 border border-rose-600/20 rounded-md flex items-center justify-center text-rose-500 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 opacity-60">Primary Comms</p>
                  <p className="text-sm font-black text-foreground tabular-nums tracking-widest">{clinic.clinic_phone}</p>
                </div>
              </div>
              <a
                href={`tel:${clinic.clinic_phone}`}
                className="w-12 h-12 bg-rose-500 text-white rounded-md flex items-center justify-center shadow-xl shadow-rose-500/30 hover:bg-rose-600 transition-all active:scale-90"
              >
                <Phone className="w-5 h-5 fill-current" />
              </a>
            </div>
          </div>
        )}

        {/* Consultation Section */}
        <div className="mx-4 mt-4 mb-6">
          <div className="flex items-center gap-2.5 mb-4 px-1">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Clinical Intelligence</h4>
          </div>

          {requestStatus ? (
            <div className={`p-5 rounded-md border flex flex-col items-center gap-3 text-center ${requestStatus === 'APPROVED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${requestStatus === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                {requestStatus === 'APPROVED' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <h5 className={`font-black text-base ${requestStatus === 'APPROVED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {requestStatus === 'APPROVED' ? 'Request Approved' : 'Pending Review'}
                </h5>
                <p className={`text-xs font-semibold mt-1 ${requestStatus === 'APPROVED' ? 'text-emerald-600/70' : 'text-amber-600/70'}`}>
                  {requestStatus === 'APPROVED'
                    ? 'Your request has been approved. Go to your dashboard to start chatting.'
                    : 'Your request is under review. The clinician will respond shortly.'}
                </p>
              </div>
              {requestStatus === 'APPROVED' && (
                <Button
                  onClick={() => navigate(`/patient/consultation/${requestId}/chat`)}
                  className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 shadow-lg shadow-emerald-600/20"
                >
                  Open Chat
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-md p-6 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
              <div className="absolute top-0 right-0 p-6 opacity-30 pointer-events-none">
                <Zap className="w-24 h-24 rotate-12" />
              </div>
              {!showRequestForm ? (
                <div className="relative z-10 space-y-5">
                  <div>
                    <h5 className="text-lg font-black leading-tight uppercase tracking-tighter">Initiate Consultation</h5>
                    <p className="text-[11px] font-black text-white/70 mt-2 uppercase tracking-widest leading-relaxed opacity-80">
                      Sync your medical indices with Dr. {clinic.full_name} for direct diagnostic oversight.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowRequestForm(true)}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest h-12 rounded-md shadow-xl active:scale-95 transition-all"
                  >
                    Establish Secure Link
                  </Button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-black tracking-wider uppercase">Clinical Concern</h5>
                    <button onClick={() => setShowRequestForm(false)} className="text-white/60 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your concern..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px] rounded-md font-semibold text-sm focus:ring-white/30"
                  />
                  <Button
                    onClick={handleSendRequest}
                    disabled={isSending || !message.trim()}
                    className="w-full bg-white text-primary hover:bg-white/90 font-black text-xs h-11 rounded-md shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSending
                      ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-md animate-spin" />
                      : <><Send className="w-3.5 h-3.5" /> Dispatch Request</>
                    }
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
const ClinicRadar = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [clinics, setClinics] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [scanRadius, setScanRadius] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const { isCollapsed } = useSidebar()

  // Auto-open sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchClinics = useCallback(async (lat, lng, radiusOverride) => {
    setIsLoading(true)
    const effectiveRadius = radiusOverride ?? scanRadius
    console.log(`[Radar] Scanning ${effectiveRadius}km around [${lat}, ${lng}]`)
    try {
      const res = await getNearbyClinics(lat, lng, effectiveRadius)
      if (res.status === 'success') setClinics(res.data)
      else toast.error(res.message)
    } catch (e) {
      console.error(e)
      toast.error('Failed to fetch nearby clinics')
    } finally {
      setIsLoading(false)
    }
  }, [scanRadius])

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setUserLocation({ lat: latitude, lng: longitude })
        fetchClinics(latitude, longitude)
        toast.success('Location synced')
      },
      (err) => {
        console.error(err)
        toast.error('Could not get your location')
        if (user?.latitude && user?.longitude) {
          const lat = parseFloat(user.latitude), lng = parseFloat(user.longitude)
          setUserLocation({ lat, lng })
          fetchClinics(lat, lng)
        }
      },
      { enableHighAccuracy: true }
    )
  }, [user, fetchClinics])

  useEffect(() => {
    if (user?.latitude && user?.longitude && (parseFloat(user.latitude) !== 0 || parseFloat(user.longitude) !== 0)) {
      const lat = parseFloat(user.latitude), lng = parseFloat(user.longitude)
      setUserLocation({ lat, lng })
      fetchClinics(lat, lng)
    } else {
      handleGetCurrentLocation()
    }
  }, []) // eslint-disable-line

  const filteredClinics = clinics.filter(c =>
    c.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clinic_city?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDetails = (clinic) => {
    setSelectedClinic(clinic)
    setIsSheetOpen(true)
    // On mobile, close sidebar when selecting a clinic to show the sheet/map
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans relative selection:bg-primary/20">
      <PatientSidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]'} h-screen flex relative shadow-xl z-10`}>

        {/* Mobile Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {(sidebarOpen) && (
            <motion.aside
              key="sidebar"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="w-full md:w-[400px] flex-shrink-0 h-full flex flex-col bg-card/60 backdrop-blur-3xl border-r border-border shadow-2xl z-30 absolute md:relative"
            >
              {/* Sidebar Header */}
              <div className="flex-shrink-0 px-6 pt-7 pb-6 border-b border-border/60">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase opacity-80">Clinical Intelligence</p>
                    <h1 className="text-2xl font-black text-foreground tracking-tighter flex items-center gap-3 mt-1 uppercase">
                      Clinic Radar
                      <span className="text-[11px] font-black bg-blue-600 text-white px-3 py-0.5 rounded-md shadow-lg shadow-blue-600/20">
                        {filteredClinics.length}
                      </span>
                    </h1>
                  </div>
                  {/* Close on mobile */}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-secondary/80 border-border focus:bg-card focus:border-blue-600/50 rounded-md text-xs font-black uppercase tracking-widest transition-all text-foreground placeholder:text-muted-foreground/60 shadow-inner"
                    placeholder="Registry Search..."
                  />
                </div>

                {/* Radius + Filter toggle */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-2 px-4 h-10 rounded-md border text-[10px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-card border-border text-muted-foreground hover:border-blue-600/30'
                      }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Telemetry
                  </button>
                  <div className="flex-1 flex items-center gap-3 px-4 h-10 rounded-md border border-border bg-secondary/50 shadow-inner">
                    <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{scanRadius} km</span>
                    <div className="flex-1">
                      <Slider
                        value={[scanRadius]}
                        onValueChange={([v]) => setScanRadius(v)}
                        onValueCommit={() => { if (userLocation) fetchClinics(userLocation.lat, userLocation.lng) }}
                        min={1} max={200} step={1}
                        disabled={isLoading}
                        className="h-1"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGetCurrentLocation}
                    className="w-10 h-10 rounded-md border border-border bg-secondary/50 flex items-center justify-center text-blue-600 hover:bg-blue-600/10 hover:border-blue-600/30 transition-all flex-shrink-0 shadow-inner"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Clinic List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-secondary/40 rounded-md animate-pulse" />
                  ))
                ) : filteredClinics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_70%)] pointer-events-none" />
                    <div className="relative mb-8 group inline-block">
                      <div className="absolute inset-0 bg-blue-600/20 blur-[40px] rounded-md group-hover:bg-blue-600/30 transition-all duration-500" />
                      <div className="relative w-20 h-20 bg-secondary border border-border rounded-md flex items-center justify-center mx-auto shadow-xl ring-4 ring-white/10 dark:ring-black/10">
                        <Hospital className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-foreground mb-2 uppercase tracking-tighter">Registry Silent</h3>
                    <p className="text-[11px] font-black text-muted-foreground max-w-[200px] uppercase tracking-widest leading-relaxed opacity-70">
                      Your current scan radius has yielded no active clinical hubs.
                    </p>
                    <button
                      onClick={handleGetCurrentLocation}
                      className="mt-8 px-6 h-11 rounded-md bg-blue-600 text-white text-[10px] font-black flex items-center gap-2.5 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest active:scale-95"
                    >
                      <Crosshair className="w-4 h-4" /> Re-sync Radar
                    </button>
                  </div>
                ) : (
                  filteredClinics.map(clinic => (
                    <SidebarClinicCard
                      key={clinic.id}
                      clinic={clinic}
                      isSelected={selectedClinic?.id === clinic.id}
                      onClick={() => handleDetails(clinic)}
                    />
                  ))
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-secondary/30">
                <p className="text-[10px] font-semibold text-muted-foreground text-center">
                  Showing {filteredClinics.length} verified clinics within {scanRadius} km
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── RIGHT MAP ────────────────────────────────────────────────────── */}
        <div className="flex-1 relative h-full overflow-hidden">

          {/* Mobile sidebar toggle & Global Menu */}
          <div className="absolute top-4 left-4 z-[45] flex items-center gap-2">
            <PatientSidebarTrigger className="shadow-xl" />

            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="h-9 px-4 rounded-md bg-card shadow-xl border border-border flex items-center gap-2 text-primary hover:bg-secondary transition-all active:scale-95 md:hidden"
              >
                <Menu className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">Clinics</span>
              </button>
            )}
          </div>

          <MapLibre
            theme={theme === 'dark' ? 'dark' : 'light'}
            viewport={{
              center: [80.2707, 13.0827],
              zoom: 11
            }}
            className="w-full h-full"
          >
            <Map3DController className="top-4 right-4" />
            <MapLocationSync userLocation={userLocation} />

            {/* User marker */}
            {userLocation && (
              <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
                <MarkerContent>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-10 h-10 bg-rose-500/20 rounded-md animate-ping" />
                    <div className="w-4 h-4 bg-rose-600 rounded-md border-2 border-background shadow-lg relative z-10" />
                  </div>
                  <MarkerLabel position="bottom" className="bg-card/90 backdrop-blur-xl px-3 py-1 rounded-md shadow-2xl border border-rose-500/30 font-black text-[8px] text-rose-500 uppercase mt-2 tracking-widest ring-4 ring-rose-500/10">
                    User Location
                  </MarkerLabel>
                </MarkerContent>
              </MapMarker>
            )}

            {/* Clinic markers */}
            {filteredClinics.map(clinic => (
              <MapMarker
                key={clinic.id}
                longitude={parseFloat(clinic.longitude)}
                latitude={parseFloat(clinic.latitude)}
                onClick={() => handleDetails(clinic)}
              >
                <MarkerContent className="group/marker cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <div className={`absolute w-12 h-12 rounded-md transition-all ${selectedClinic?.id === clinic.id
                      ? 'bg-blue-600/30 animate-pulse'
                      : 'bg-blue-600/10 group-hover/marker:bg-blue-600/20'
                      }`} />
                    <div className={`w-9 h-9 rounded-md border-2 border-white dark:border-zinc-800 shadow-2xl relative z-10 flex items-center justify-center transition-all group-hover/marker:scale-110 ${selectedClinic?.id === clinic.id ? 'bg-blue-600 scale-110' : 'bg-blue-600'
                      }`}>
                      <Hospital className="w-4.5 h-4.5 text-white" />
                    </div>
                  </div>
                  <MarkerLabel position="top" className="bg-blue-600 backdrop-blur-xl px-3 py-1 rounded-md shadow-2xl border border-blue-400/30 font-black text-[8px] text-white uppercase opacity-0 group-hover/marker:opacity-100 transition-all -translate-y-2 tracking-widest">
                    {clinic.clinic_name || clinic.full_name}
                  </MarkerLabel>
                </MarkerContent>
              </MapMarker>
            ))}

            <MapControls
              position="bottom-left"
              showZoom
              showCompass
              showLocate
              showFullscreen
              onLocate={(coords) => {
                setUserLocation({ lat: coords.latitude, lng: coords.longitude })
                fetchClinics(coords.latitude, coords.longitude)
              }}
            />
          </MapLibre>


          {/* Map bottom-right info badge */}
          <div className="absolute bottom-6 right-6 z-10">
            <div className="bg-white/95 backdrop-blur rounded-md px-4 py-2.5 shadow-xl border border-slate-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-md bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                {filteredClinics.length} Clinics · {scanRadius} km
              </span>
            </div>
          </div>
        </div>

        {/* ── DETAIL SHEET ─────────────────────────────────────────────────── */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md p-0 border-none [&>button:first-of-type]:hidden bg-white shadow-2xl overflow-hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Clinic Details</SheetTitle>
              <SheetDescription>View clinic details and request a consultation</SheetDescription>
            </SheetHeader>
            {selectedClinic && (
              <ClinicDetailContent
                clinic={selectedClinic}
                userLocation={userLocation}
                onClose={() => setIsSheetOpen(false)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

export default ClinicRadar
