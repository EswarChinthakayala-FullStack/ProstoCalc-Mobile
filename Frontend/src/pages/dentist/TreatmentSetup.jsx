import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Plus, Save, Search, IndianRupee,
  CheckCircle2, X, Loader2, Settings2, Layers,
  AlertCircle, Sparkles, Power, Tag, TrendingUp,
  Stethoscope, Activity, Clock, CheckSquare, XCircle,
  Pencil, Palette, ArrowRight, Filter, ShieldCheck,
  MoreVertical, MinusCircle, RefreshCcw, LayoutGrid,
  List, Check, ChevronDown, Menu, Bell, Target,
  Sun, Moon
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useTreatmentCatalog } from '@/hooks/useTreatmentCatalog'
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useAuth } from '@/context/AuthContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/context/ThemeContext'
import NotificationBell from '@/components/NotificationBell'
import UniversalLoader from '@/components/UniversalLoader'
import { cn } from '@/lib/utils'

/* ── Configuration ────────────────────────────────────────────────── */

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim() || !text) return <span>{text || ""}</span>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-400 rounded-[2px] px-0.5 font-bold no-underline inline-block leading-tight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

const professionalColors = [
  '#0D9488', // Teal-600
  '#0F172A', // Slate-900
  '#6366F1', // Indigo-500
  '#F59E0B', // Amber-500
  '#EC4899', // Pink-500
  '#ef4444', // Red-500
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f97316', // orange
  '#22c55e', // green
  '#06b6d4', // cyan
]

const defaultCategories = [
  { value: 'GENERAL', label: 'General Practice', color: '#0D9488' },
  { value: 'SURGERY', label: 'Surgery & Extractions', color: '#f43f5e' },
  { value: 'ORTHODONTICS', label: 'Orthodontics', color: '#6366F1' },
  { value: 'PROSTHODONTICS', label: 'Prosthodontics', color: '#F59E0B' },
  { value: 'ENDODONTICS', label: 'Endodontics', color: '#22c55e' },
]

const categoryTheme = {
  GENERAL: { bg: 'bg-teal-50 dark:bg-zinc-900/50', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-zinc-800', dot: 'bg-teal-500', color: '#0D9488', icon: Stethoscope },
  SURGERY: { bg: 'bg-rose-50 dark:bg-zinc-900/50', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-zinc-800', dot: 'bg-rose-500', color: '#f43f5e', icon: Activity },
  ORTHODONTICS: { bg: 'bg-indigo-50 dark:bg-zinc-900/50', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-zinc-800', dot: 'bg-indigo-500', color: '#6366F1', icon: Layers },
  PROSTHODONTICS: { bg: 'bg-amber-50 dark:bg-zinc-900/50', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-zinc-800', dot: 'bg-amber-500', color: '#F59E0B', icon: CheckSquare },
  ENDODONTICS: { bg: 'bg-emerald-50 dark:bg-zinc-900/50', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-zinc-800', dot: 'bg-emerald-500', color: '#22c55e', icon: Clock },
}

const getCategoryColor = (cat) => categoryTheme[cat]?.color || '#64748b'
const getTheme = (cat) => categoryTheme[cat] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', dot: 'bg-slate-500', color: '#64748b', icon: Layers }

/* ── Enhanced ColorPicker ─────────── */

const ColorPicker = ({ currentColor, onColorChange, onClose }) => {
  const [customColor, setCustomColor] = useState(currentColor || '#0D9488')
  const [showCustom, setShowCustom] = useState(false)

  const handleColorSelect = (color) => {
    onColorChange(color)
    setTimeout(() => onClose?.(), 150)
  }

  const handleCustomConfirm = () => {
    onColorChange(customColor)
    setTimeout(() => onClose?.(), 150)
  }

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-6 gap-2">
        {professionalColors.map(c => (
          <button
            key={c}
            onClick={() => handleColorSelect(c)}
            className={`w-9 h-9 rounded-md border-2 transition-all duration-200 hover:scale-110 shadow-sm ${currentColor === c
              ? 'border-slate-900 dark:border-white scale-110 ring-4 ring-slate-900/10 dark:ring-white/10'
              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Custom Vector</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCustom ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-11 h-11 rounded-md cursor-pointer border-2 border-slate-100 dark:border-slate-700 p-1 bg-white dark:bg-slate-900 shadow-inner"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#HEX"
                    className="flex-1 h-11 px-4 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:ring-2 focus:ring-teal-500/10 focus:border-teal-400 outline-none uppercase text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  onClick={handleCustomConfirm}
                  className="w-full h-11 bg-slate-900 dark:bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-teal-500 transition-all active:scale-95 shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20"
                >
                  <Check className="w-3.5 h-3.5" /> Commit Custom
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ── Treatment Card ───────────────────────────────────────────────── */

const TreatmentCard = ({ t, onUpdate, index, highlight = '' }) => {
  const theme = getTheme(t.category)
  const isActive = t.is_enabled === 1
  const color = t.color_tag || theme.color
  const Icon = theme.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative bg-white dark:bg-zinc-950/50 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden transition-all duration-300 ${isActive
        ? 'hover:border-teal-400/30 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-teal-600/5'
        : 'opacity-60 grayscale-[0.2]'
        }`}
    >
      <div
        className="h-[3px] w-full transition-colors duration-500 absolute top-0 left-0"
        style={{ backgroundColor: isActive ? color : '#e2e8f0' }}
      />

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-md flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 relative"
              style={{ backgroundColor: `${color}10`, color: color, borderColor: `${color}20`, borderWidth: '1px' }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-md border-2 border-white dark:border-teal-900 shadow-md cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <Palette className="w-2 h-2 text-white/50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 rounded-md shadow-2xl border-slate-100 dark:border-slate-800 z-[60] bg-white dark:bg-slate-900" side="top" align="center" sideOffset={8}>
                  <ColorPicker
                    currentColor={color}
                    onColorChange={(c) => onUpdate(t.id || t.tempId, 'color_tag', c)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-teal-100 leading-snug mb-2 line-clamp-2">
                <HighlightText text={t.name} highlight={highlight} />
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${color}05`,
                    color: color,
                    borderColor: `${color}15`
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-md" style={{ backgroundColor: color }} />
                  <HighlightText text={t.category} highlight={highlight} />
                </span>
                {t.id === 0 && (
                  <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-teal-100 dark:border-teal-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> New Node
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[9px] font-black text-slate-400 dark:text-teal-500/60 uppercase tracking-widest">Active</span>
            <Switch
              checked={isActive}
              onCheckedChange={(val) => onUpdate(t.id || t.tempId, 'is_enabled', val ? 1 : 0)}
              className="data-[state=checked]:bg-teal-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 dark:border-teal-500/10">
          <div className="relative group/input">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 dark:bg-teal-950/50 text-slate-400 dark:text-teal-500/50 rounded-md group-focus-within/input:text-teal-600 dark:group-focus-within/input:text-teal-400 group-focus-within/input:bg-teal-50 dark:group-focus-within/input:bg-teal-400/10 transition-colors">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
            <input
              type="number"
              value={t.effective_cost ?? t.default_cost ?? 0}
              onChange={(e) => onUpdate(t.id || t.tempId, 'effective_cost', parseFloat(e.target.value) || 0)}
              className="w-full h-12 bg-slate-50/50 dark:bg-teal-950/20 border border-slate-100 dark:border-teal-500/10 rounded-md pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-teal-100 placeholder:text-slate-300 dark:placeholder:text-teal-900 focus:ring-4 focus:ring-teal-500/5 focus:bg-white dark:focus:bg-teal-950 focus:border-teal-300 dark:focus:border-teal-500 outline-none transition-all tabular-nums shadow-inner"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const TreatmentSetup = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme, toggleTheme } = useTheme()

  const { catalog, isLoading, isSaving, saveCatalog, fetchCatalog } = useTreatmentCatalog()
  const [treatments, setTreatments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [customCategories, setCustomCategories] = useState([])
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [isStatsExpanded, setIsStatsExpanded] = useState(true)

  const [newT, setNewT] = useState({
    name: '',
    category: 'GENERAL',
    categoryLabel: 'General Practice',
    cost: '',
    color: ''
  })

  // Sync treatments from catalog hook
  useEffect(() => {
    if (catalog) {
      const data = catalog.map(t => ({
        ...t,
        color_tag: t.color_tag || getCategoryColor(t.category)
      }))
      setTreatments(data)
    }
  }, [catalog])

  const allCategories = useMemo(() => {
    const customCats = customCategories.map(cat => ({
      value: cat.value,
      label: cat.label,
      color: cat.color
    }))
    return [...defaultCategories, ...customCats]
  }, [customCategories])

  const filtered = useMemo(() => {
    let result = treatments
    if (activeFilter !== 'ALL') result = result.filter(t => t.category === activeFilter)
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    }
    return result
  }, [treatments, searchTerm, activeFilter])

  const stats = useMemo(() => ({
    total: treatments.length,
    active: treatments.filter(t => t.is_enabled === 1).length,
    revenue: treatments.reduce((s, t) => s + (t.is_enabled === 1 ? (t.effective_cost ?? t.default_cost ?? 0) : 0), 0),
    categories: [...new Set(treatments.map(t => t.category))].length
  }), [treatments])

  const updateTreatment = (id, field, value) => {
    setTreatments(prev => prev.map(t => (t.id === id || t.tempId === id) ? { ...t, [field]: value } : t))
  }

  const handleSaveAll = async () => {
    if (isSaving) return
    const payload = treatments.map(t => ({
      treatment_id: t.id || 0,
      name: t.name,
      category: t.category,
      custom_cost: parseFloat(t.effective_cost ?? t.default_cost ?? 0),
      is_enabled: t.is_enabled === 1 ? 1 : 0,
      color_tag: t.color_tag || getCategoryColor(t.category)
    }))
    await saveCatalog(payload)
  }

  const handleAddTreatment = () => {
    if (!newT.name || !newT.cost) {
      toast.error('Label and Standard Rate required')
      return
    }
    const tempItem = {
      id: 0,
      tempId: Math.random(),
      name: newT.name,
      category: newT.category,
      category_label: newT.categoryLabel,
      default_cost: parseFloat(newT.cost),
      effective_cost: parseFloat(newT.cost),
      is_enabled: 1,
      color_tag: newT.color || getCategoryColor(newT.category) || '#6366F1'
    }
    setTreatments(prev => [tempItem, ...prev])
    setNewT({ name: '', category: 'GENERAL', categoryLabel: 'General Practice', cost: '', color: '' })
    setShowCustomCategoryInput(false)
    setShowAddSheet(false)
    toast.success('Protocol staged — Sync to finalize')
  }

  const handleCategoryChange = (value) => {
    if (value === 'ADD_CUSTOM') {
      setShowCustomCategoryInput(true)
      return
    }
    setShowCustomCategoryInput(false)
    const cat = allCategories.find(c => c.value === value)
    if (cat) {
      setNewT(prev => ({
        ...prev,
        category: value,
        categoryLabel: cat.label,
        color: cat.color || prev.color
      }))
    }
  }

  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) {
      toast.error('Identity required')
      return
    }
    const newValue = customCategoryName.toUpperCase().replace(/\s+/g, '_')
    const newColor = newT.color || '#0D9488'

    setCustomCategories(prev => [...prev, { value: newValue, label: customCategoryName, color: newColor }])
    setNewT({ ...newT, category: newValue, categoryLabel: customCategoryName, color: newColor })
    setCustomCategoryName('')
    setShowCustomCategoryInput(false)
    toast.success(`Registered: ${customCategoryName}`)
  }

  if (isLoading) {
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
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10"
      >
        {/* Dot grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 transition-opacity"
          style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181B' : '#0d9488'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              {/* Left: Branding */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <button
                  onClick={() => navigate(-1)}
                  className="hidden xl:flex w-9 h-9 bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-md items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-300 hover:border-teal-200 dark:hover:border-zinc-700 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate underline decoration-teal-500/30 decoration-2 underline-offset-4">Treatment Setup</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-teal-600 dark:text-teal-500 uppercase tracking-widest leading-none truncate">Registry Portfolio</span>
                    <div className="w-1 h-1 rounded-md bg-emerald-500 animate-pulse hidden sm:block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowAddSheet(true)}
                  className="hidden md:flex border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-400/10 hover:text-teal-700 dark:hover:text-teal-300 font-bold text-xs uppercase tracking-widest rounded-md h-10 px-4 gap-2"
                >
                  <Plus className="w-4 h-4" /> Register Node
                </Button>
                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 hidden md:block" />
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 dark:shadow-teal-900/20 h-10 px-4 sm:px-6 rounded-md transition-all active:scale-95 shrink-0"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="hidden xs:inline">{isSaving ? 'SYNCING' : 'SAVE'}</span>
                  {!isSaving && <span className="xs:hidden">SAVE</span>}
                </Button>
                <div className="w-px h-5 bg-slate-200 dark:bg-teal-500/20 hidden md:block" />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-slate-500 dark:text-zinc-400 hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-teal-50/50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-4.5 h-4.5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <NotificationBell />
                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 hidden md:block mx-0.5" />
                <Link to="/dentist/profile" className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 hover:border-teal-200 dark:hover:border-zinc-700 transition-all cursor-pointer group">
                  <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-bold text-teal-600 dark:text-teal-500 mt-1 uppercase tracking-widest">Clinician</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 relative z-10">

          {/* 1. Statistics Panel (Accordion) */}
          <div className="bg-white dark:bg-zinc-950/50 backdrop-blur-sm rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <button
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="w-full flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/10 hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors border-b border-slate-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-teal-100 uppercase tracking-wide">Practice Metrics</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-teal-500 transition-transform duration-300 ${isStatsExpanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isStatsExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {[
                      { label: 'Procedures', value: stats.total, icon: Layers, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10' },
                      { label: 'Active', value: stats.active, icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                      { label: 'Taxonomy', value: stats.categories, icon: LayoutGrid, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                      { label: 'Net Valuation', value: `₹${(stats.revenue / 1000).toFixed(1)}k`, icon: IndianRupee, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    ].map((s, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <div className={`w-9 h-9 rounded-md ${s.bg} ${s.color} flex items-center justify-center border border-current/10`}>
                          <s.icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-teal-500/60 uppercase tracking-[0.15em] mb-0.5">{s.label}</p>
                          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-teal-100 tabular-nums tracking-tight">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Filters & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-teal-500/40 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search procedures by label or clinical class…"
                className="w-full h-12 bg-white dark:bg-zinc-950/50 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-md pl-12 pr-4 text-[13px] font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-700/60 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-400 dark:focus:border-zinc-700 outline-none transition-all shadow-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-teal-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {['ALL', ...new Set(treatments.map(t => t.category))].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeFilter === cat
                    ? 'bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-600 shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20'
                    : 'bg-white dark:bg-zinc-950/50 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-zinc-700 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/30'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 items-start">
            {filtered.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filtered.map((t, idx) => (
                  <TreatmentCard
                    key={t.id || t.tempId}
                    t={t}
                    onUpdate={updateTreatment}
                    index={idx}
                    highlight={searchTerm}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-teal-900/20 border border-slate-200 dark:border-teal-500/20 border-dashed rounded-md backdrop-blur-sm">
                <div className="w-16 h-16 bg-slate-50 dark:bg-teal-400/10 rounded-md flex items-center justify-center mb-5">
                  <Target className="w-7 h-7 text-slate-300 dark:text-teal-600/40" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-teal-100 tracking-tight">Catalog Sterilized</h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-teal-500/60 uppercase tracking-widest mt-2 px-6 text-center">Refine search vectors or initialize new clinical nodes</p>
              </div>
            )}
          </div>

          <div className="h-10" />

          {/* Add Mobile Floating Action Button */}
          <div className="sm:hidden fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setShowAddSheet(true)}
              className="w-14 h-14 bg-teal-600 text-white rounded-md shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </main>
      </motion.div>

      {/* ═══ ADD SHEET ═══ */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent
          side="bottom"
          className="h-[95vh] sm:h-[85vh] sm:max-w-[1200px] sm:mx-auto rounded-t-2xl sm:rounded-md overflow-hidden border-none p-0 bg-slate-50 dark:bg-black shadow-2xl focus:ring-0 focus:outline-none"
        >
          <div className="flex flex-col h-full font-sans">
            {/* Executive Header */}
            <div className="shrink-0 h-24 sm:h-32 bg-slate-900 dark:bg-zinc-950 relative overflow-hidden flex items-center px-6 sm:px-12">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-md blur-[100px] -mr-48 -mt-48" />
              <div className="relative z-10 flex flex-col">
                <SheetTitle className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Register Clinical Protocol</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-teal-500 dark:text-teal-400 uppercase tracking-[0.2em]">New Catalog Node</span>
                  <div className="w-1 h-1 rounded-md bg-slate-700 dark:bg-teal-700" />
                  <span className="text-[10px] font-black text-slate-500 dark:text-teal-600 uppercase tracking-[0.2em]">V2.4 Console</span>
                </div>
              </div>
              <button onClick={() => setShowAddSheet(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/5 text-white/40 hover:bg-white/10 rounded-md flex items-center justify-center transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* ── LEFT: FORM ── */}
                <div className="lg:col-span-7 space-y-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xs shadow-sm border border-teal-100 dark:border-teal-500/20">1</div>
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Protocol Intelligence</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 dark:text-teal-500/60 uppercase tracking-widest ml-1">Procedure Designation</Label>
                        <Input
                          value={newT.name}
                          onChange={(e) => setNewT({ ...newT, name: e.target.value })}
                          placeholder="e.g. Composite Resin Reconstruction"
                          className="h-14 bg-white dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 rounded-md px-4 font-bold text-slate-800 dark:text-zinc-100 shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 dark:text-teal-500/60 uppercase tracking-widest ml-1">Taxonomy Class</Label>
                          <Select value={newT.category} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="h-14 bg-white dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 rounded-md px-4 font-bold text-slate-800 dark:text-zinc-100">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md border-slate-100 dark:border-teal-800 shadow-2xl p-2 z-[70] bg-white dark:bg-slate-900">
                              {allCategories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value} className="rounded-md py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3.5 h-3.5 rounded-md shadow-sm" style={{ backgroundColor: cat.color }} />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{cat.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                              <div className="my-1 border-t border-slate-50 dark:border-slate-800" />
                              <SelectItem value="ADD_CUSTOM" className="rounded-md py-3 text-teal-600 dark:text-teal-400 font-black uppercase tracking-widest text-[10px]">
                                <div className="flex items-center gap-3">
                                  <Plus className="w-4 h-4" /> Register Custom Class
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 dark:text-teal-500/60 uppercase tracking-widest ml-1">Execution Rate (₹)</Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-teal-700" />
                            <Input
                              type="number"
                              value={newT.cost}
                              onChange={(e) => setNewT({ ...newT, cost: e.target.value })}
                              placeholder="0.00"
                              className="h-14 bg-white dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 rounded-md pl-11 pr-4 font-black text-slate-800 dark:text-zinc-100 tabular-nums shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {showCustomCategoryInput && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                            <div className="bg-white dark:bg-teal-900/40 border-2 border-teal-500/20 rounded-md p-5 space-y-4 shadow-xl shadow-teal-500/5">
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-teal-500" />
                                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">New Clinical Taxonomy</span>
                              </div>
                              <Input
                                value={customCategoryName}
                                onChange={(e) => setCustomCategoryName(e.target.value)}
                                placeholder="Identity label..."
                                className="h-12 border-slate-200 dark:border-teal-500/20 bg-white dark:bg-teal-950 rounded-md font-bold dark:text-teal-100"
                              />
                              <div className="flex gap-3">
                                <Button onClick={handleAddCustomCategory} className="flex-1 bg-teal-600 hover:bg-teal-700 font-black uppercase tracking-widest text-[10px] h-11 rounded-md">Register Class</Button>
                                <Button variant="ghost" onClick={() => setShowCustomCategoryInput(false)} className="h-11 rounded-md text-[10px] font-black uppercase text-slate-400 dark:text-teal-700">Abort</Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-slate-900 dark:bg-teal-400 text-white dark:text-teal-950 flex items-center justify-center font-black text-xs shadow-sm">2</div>
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-teal-100 uppercase tracking-widest">Visual Vector</h4>
                    </div>
                    <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-md p-6 shadow-sm backdrop-blur-sm">
                      <Label className="text-[10px] font-bold text-slate-400 dark:text-teal-500/60 uppercase tracking-widest block mb-4 ml-1">Signature Identity Color</Label>
                      <ColorPicker
                        currentColor={newT.color || getCategoryColor(newT.category)}
                        onColorChange={(color) => setNewT({ ...newT, color })}
                      />
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: PREVIEW ── */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="bg-white/50 dark:bg-zinc-900/20 border border-slate-200 dark:border-zinc-800 border-dashed rounded-md p-8 flex flex-col items-center justify-center relative min-h-[400px] backdrop-blur-sm">
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-md bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-400 dark:text-teal-500/60 uppercase tracking-widest">Real-time Node Preview</span>
                    </div>
                    <div className="w-full max-w-[340px] shadow-2xl shadow-slate-200 dark:shadow-teal-950/40 transition-transform hover:scale-105">
                      <TreatmentCard
                        t={{
                          id: 0,
                          name: newT.name || "Awaiting Node Label",
                          category: newT.category,
                          effective_cost: parseFloat(newT.cost) || 0,
                          is_enabled: 1,
                          color_tag: newT.color || getCategoryColor(newT.category)
                        }}
                        onUpdate={() => { }}
                        index={0}
                      />
                    </div>
                    <div className="mt-10 text-center max-w-[280px]">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-teal-500/50 uppercase tracking-widest leading-relaxed">This node will be projected into the active diagnostic catalog upon commitment.</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddTreatment}
                    className="w-full h-16 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-black rounded-md shadow-2xl shadow-slate-900/10 dark:shadow-teal-900/20 text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98] group"
                  >
                    Register Protocol <ArrowRight className="w-4 h-4 ml-3 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default TreatmentSetup
