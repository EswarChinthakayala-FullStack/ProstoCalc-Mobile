import React, { useState } from 'react'
import {
  BookOpen, Video, FileText, Play, Search,
  GraduationCap, ChevronRight, Bookmark, X,
  Clock, Tag, ExternalLink, Activity, Sun, Moon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/context/SidebarContext'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import NotificationBell from '@/components/NotificationBell'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

/* ─── Design tokens ─────────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  video: { bar: 'bg-rose-500', icon: Video, iconBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100 dark:border-rose-500/20', label: 'Video' },
  article: { bar: 'bg-sky-500', icon: FileText, iconBg: 'bg-sky-50 dark:bg-sky-500/10 text-sky-500 border-sky-100 dark:border-sky-500/20', label: 'Article' },
  guide: { bar: 'bg-violet-500', icon: BookOpen, iconBg: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500 border-violet-100 dark:border-violet-500/20', label: 'Guide' },
}

const TAG_CONFIG = {
  'Oral Health': { bg: 'bg-sky-50 dark:bg-sky-500/10   text-sky-700 dark:text-sky-400   border-sky-100 dark:border-sky-500/20' },
  'Recovery': { bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
  'AI Tech': { bg: 'bg-indigo-50 dark:bg-indigo-500/10  text-indigo-700 dark:text-indigo-400  border-indigo-100 dark:border-indigo-500/20' },
  'Nutrition': { bg: 'bg-amber-50 dark:bg-amber-500/10   text-amber-700 dark:text-amber-400   border-amber-100 dark:border-amber-500/20' },
  'Gum Health': { bg: 'bg-rose-50 dark:bg-rose-500/10    text-rose-700 dark:text-rose-400    border-rose-100 dark:border-rose-500/20' },
  'Implants': { bg: 'bg-violet-50 dark:bg-violet-500/10  text-violet-700 dark:text-violet-400  border-violet-100 dark:border-violet-500/20' },
  'Root Canal': { bg: 'bg-orange-50 dark:bg-orange-500/10  text-orange-700 dark:text-orange-400  border-orange-100 dark:border-orange-500/20' },
  'Kids': { bg: 'bg-teal-50 dark:bg-teal-500/10    text-teal-700 dark:text-teal-400    border-teal-100 dark:border-teal-500/20' },
}

/* ─── Curated resource library ───────────────────────────────────────────────── */
const RESOURCES = [
  // Oral Health
  {
    type: 'video', tag: 'Oral Health', duration: '5:41',
    title: 'Mastering Oral Hygiene',
    subtitle: 'Instructional guide to effective brushing and flossing from a certified dental hygienist.',
    videoId: 'Hkfxki3ywaU',
    thumb: 'https://img.youtube.com/vi/Hkfxki3ywaU/mqdefault.jpg',
  },
  {
    type: 'video', tag: 'Oral Health', duration: '6:14',
    title: 'How to Brush Your Teeth Properly',
    subtitle: 'Step-by-step brushing technique demonstrated by a dental professional.',
    videoId: '3oG_JLuQ8T8',
    thumb: 'https://img.youtube.com/vi/3oG_JLuQ8T8/mqdefault.jpg',
  },
  {
    type: 'video', tag: 'Oral Health', duration: '4:52',
    title: 'Flossing the Right Way',
    subtitle: 'Why flossing matters and how to do it correctly to prevent gum disease.',
    videoId: 'HmnjzhqA-GU',
    thumb: 'https://img.youtube.com/vi/HmnjzhqA-GU/mqdefault.jpg',
  },
  // Recovery
  {
    type: 'video', tag: 'Recovery', duration: '4:15',
    title: 'Surgery Post-Op Guide',
    subtitle: 'Essential care instructions for patients recovering from extractions and implants.',
    videoId: 'y-cmucuD5aw',
    thumb: 'https://img.youtube.com/vi/y-cmucuD5aw/mqdefault.jpg',
  },
  {
    type: 'video', tag: 'Recovery', duration: '3:22',
    title: 'Healing After Tooth Extraction',
    subtitle: 'Expert tips on managing pain and protecting the socket for smooth recovery.',
    videoId: 'tUfMiIWZG10',
    thumb: 'https://img.youtube.com/vi/tUfMiIWZG10/mqdefault.jpg',
  },
  {
    type: 'video', tag: 'Recovery', duration: '7:10',
    title: 'Dry Socket: Prevention & Treatment',
    subtitle: 'What is dry socket, how to prevent it, and what to do if it develops post-extraction.',
    videoId: 'mb4WcAXTa6o',
    thumb: 'https://img.youtube.com/vi/mb4WcAXTa6o/mqdefault.jpg',
  },
  // Gum Health
  {
    type: 'video', tag: 'Gum Health', duration: '10:00',
    title: 'Gum Disease Prevention',
    subtitle: 'Clinical overview of periodontal health, warning signs, and inflammation prevention.',
    videoId: 'x6vtFro_Hdo',
    thumb: 'https://img.youtube.com/vi/x6vtFro_Hdo/mqdefault.jpg',
  },
  {
    type: 'video', tag: 'Gum Health', duration: '5:32',
    title: 'Gingivitis vs Periodontitis',
    subtitle: 'Understanding the difference between early and advanced gum disease and treatment options.',
    videoId: 'LLXdQMW_T8Q',
    thumb: 'https://img.youtube.com/vi/LLXdQMW_T8Q/mqdefault.jpg',
  },
  // Implants
  {
    type: 'video', tag: 'Implants', duration: '6:30',
    title: 'AI in Modern Dentistry',
    subtitle: 'How artificial intelligence is transforming implant diagnosis and treatment planning.',
    videoId: 'LLXdQMW_T8Q',
    thumb: 'https://img.youtube.com/vi/LLXdQMW_T8Q/mqdefault.jpg',
  },
  {
    type: 'video', tag: 'Implants', duration: '8:45',
    title: 'Dental Implant Procedure Explained',
    subtitle: 'Step-by-step walkthrough of the implant placement process by an oral surgeon.',
    videoId: 'j6Ys8r2eeqk',
    thumb: 'https://img.youtube.com/vi/j6Ys8r2eeqk/mqdefault.jpg',
  },
  // Root Canal
  {
    type: 'video', tag: 'Root Canal', duration: '5:05',
    title: 'Root Canal Myths Debunked',
    subtitle: 'An endodontist explains what a root canal really feels like and why it saves your tooth.',
    videoId: 'RfbgfekOLTo',
    thumb: 'https://img.youtube.com/vi/RfbgfekOLTo/mqdefault.jpg',
  },
  // Nutrition
  {
    type: 'article', tag: 'Nutrition', duration: '8 min read',
    title: 'Recovery-Approved Diets',
    subtitle: 'Foods that maximise nutrient absorption during early tissue regeneration phases.',
    videoId: null,
    thumb: null,
  },
  {
    type: 'article', tag: 'Nutrition', duration: '6 min read',
    title: 'Foods That Damage Your Teeth',
    subtitle: 'Which everyday foods and drinks quietly erode enamel and how to protect against them.',
    videoId: null,
    thumb: null,
  },
  // Kids
  {
    type: 'video', tag: 'Kids', duration: '3:15',
    title: "Baby's First Dental Visit",
    subtitle: "What parents can expect and how to prepare their infant for their first dentist appointment.",
    videoId: 'o1wHn9iDF7I',
    thumb: 'https://img.youtube.com/vi/o1wHn9iDF7I/mqdefault.jpg',
  },
]

const CATEGORIES = ['All', 'Oral Health', 'Recovery', 'Gum Health', 'Implants', 'Root Canal', 'Nutrition', 'Kids']

/* ─── Content card ───────────────────────────────────────────────────────────── */
const ContentCard = ({ resource, onClick }) => {
  const { type, tag, duration, title, subtitle, thumb } = resource
  const tc = TYPE_CONFIG[type] || TYPE_CONFIG.article
  const tg = TAG_CONFIG[tag] || { bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-md overflow-hidden',
        'hover:shadow-xl hover:shadow-blue-600/10 hover:border-blue-600/30 transition-all duration-300',
        'flex flex-col relative group',
        onClick && 'cursor-pointer'
      )}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${tc.bar} z-10`} />

      {/* Thumbnail for videos */}
      {thumb && (
        <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
            onError={e => { e.target.parentElement.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-slate-900 dark:text-white fill-current ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 rounded-md bg-slate-900/70 text-white text-[10px] font-black backdrop-blur-sm border border-white/10 uppercase tracking-widest">
              {duration}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5">
        {/* Tags row */}
        <div className="flex items-center gap-2 mb-3.5">
          <span className={cn('px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border', tg.bg)}>
            {tag}
          </span>
          {!thumb && (
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3" />{duration}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1 mb-4 line-clamp-3">
          {subtitle}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50 mt-auto">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.15em] group-hover:gap-2.5 transition-all">
            {type === 'video' ? 'Play Experience' : 'Read Protocol'}
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
         
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════════════════════════════════ */
const PatientHub = () => {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchText, setSearchText] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const { isCollapsed } = useSidebar()
  const { theme, toggleTheme } = useTheme()

  const filtered = RESOURCES.filter(r => {
    const matchCat = activeCategory === 'All' || r.tag === activeCategory
    const matchSearch = !searchText || r.title.toLowerCase().includes(searchText.toLowerCase()) || r.subtitle.toLowerCase().includes(searchText.toLowerCase())
    return matchCat && matchSearch
  })

  const videoCount = RESOURCES.filter(r => r.type === 'video').length
  const articleCount = RESOURCES.filter(r => r.type !== 'video').length

  return (
    <div className="flex h-screen bg-background overflow-hidden transition-colors duration-300 text-foreground">
      <PatientSidebar />

      <main className={cn(
        'flex-1 transition-all duration-300',
        isCollapsed ? 'xl:ml-[100px]' : 'xl:ml-[300px]',
        'flex flex-col h-screen relative z-10 min-w-0 overflow-hidden'
      )}>

        {/* Dot grid bg */}
        <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#475569' : '#e2e8f0'} 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />

        {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
        <header className="z-40 bg-card/95 backdrop-blur-md border-b border-border shrink-0 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <PatientSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Resource Hub
                  </h1>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 hidden sm:flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> Learning Center
                    </span>
                    <span className="text-slate-300 dark:text-slate-800">·</span>
                    <span>Knowledge Matrix</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <Play className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    {videoCount} Units · {articleCount} Modules
                  </span>
                </div>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 rounded-md border border-border bg-card text-muted-foreground hover:border-blue-600/50 hover:bg-blue-600/5 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-4.5 h-4.5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <NotificationBell />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24 space-y-8 sm:space-y-12">

            {/* ── Hero ── */}
            <div className="bg-zinc-950 rounded-md border border-zinc-800 p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-600/5">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500/50" />
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-md blur-[120px] -mr-48 -mt-48 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-2 h-2 bg-blue-500 rounded-md animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                    <p className="text-xs font-black text-blue-400 tracking-[0.25em] uppercase">Clinical Intelligence Hub</p>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 leading-[1.1]">
                    Empowering your path <br /> to clinical excellence.
                  </h2>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-lg">
                    Discover professional surgical guides, recovery blueprints, and deep-dive technical insights — all curated by the ProstoCalc Clinical Council.
                  </p>
                </div>
                <div className="shrink-0 hidden lg:grid grid-cols-2 gap-4">
                  {[
                    { label: 'Video Units', value: `${videoCount}+`, color: 'text-rose-400' },
                    { label: 'Blueprints', value: `${articleCount}`, color: 'text-sky-400' },
                    { label: 'Disciplines', value: `${CATEGORIES.length - 1}`, color: 'text-amber-400' },
                    { label: 'Glossary', value: 'A-Z', color: 'text-emerald-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-md p-5 text-center min-w-[120px] hover:bg-white/10 transition-colors">
                      <p className={cn('text-2xl font-black mb-1.5', s.color)}>{s.value}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* ── Filter + search ── */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 sticky top-0 py-4 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md z-30 transition-colors duration-300">
                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0 no-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        'px-5 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2',
                        activeCategory === cat
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/10'
                          : 'bg-card text-muted-foreground border-border hover:border-blue-600/50 hover:text-blue-600'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full xl:w-96 shrink-0 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Search clinical knowledge..."
                    className="w-full h-11 pl-11 pr-4 bg-card border border-border rounded-md text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* ── Results count ── */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-500/10 rounded-md flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                  {filtered.length} Indexed Protocol{filtered.length !== 1 ? 's' : ''}
                  {activeCategory !== 'All' && ` · ${activeCategory}`}
                </span>
              </div>

              {/* ── Grid ── */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6 text-center bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 border-dashed rounded-md backdrop-blur-sm">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center shadow-inner">
                    <Search className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Search vector came up empty</p>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-[240px]">Initialize a new search or clear filters to reset</p>
                  </div>
                  <button
                    onClick={() => { setActiveCategory('All'); setSearchText('') }}
                    className="px-6 h-10 rounded-md text-[10px] font-black tracking-widest uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                  >
                    Reset Environment
                  </button>
                </div>
              ) : (
                <motion.div
                  key={activeCategory + searchText}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8"
                >
                  {filtered.map((res, i) => (
                    <ContentCard
                      key={i}
                      resource={res}
                      onClick={res.type === 'video' && res.videoId ? () => setSelectedVideo(res) : null}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ═══ VIDEO MODAL ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl dark:bg-slate-950 rounded-md border border-slate-800 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)]"
            >
              {/* Modal header */}
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
              <div className="flex items-center justify-between gap-6 px-6 py-5 border-b border-slate-900 bg-slate-950/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md flex items-center justify-center shrink-0 shadow-inner">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight">{selectedVideo.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border', TAG_CONFIG[selectedVideo.tag]?.bg || 'bg-slate-800 text-slate-400 border-slate-700/50')}>
                        {selectedVideo.tag}
                      </span>
                      <div className="w-1 h-1 rounded-md bg-slate-700" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {selectedVideo.duration}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700 transition-all shrink-0 active:scale-90"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Embed container */}
              <div className="aspect-video bg-black relative group/player">
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Description footer */}
              <div className="px-6 py-5 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <p className="text-xs text-slate-400 font-medium leading-relaxed flex-1 max-w-3xl">
                  {selectedVideo.subtitle}
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.videoId}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2.5 px-5 h-10 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-black tracking-widest text-slate-300 hover:text-white hover:border-slate-600 transition-all shrink-0 uppercase active:scale-95"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    YouTube Portal
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PatientHub