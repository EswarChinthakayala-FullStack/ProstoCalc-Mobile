import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Send, Bot, User, Plus, Trash2, BrainCircuit,
  MessageSquare, PanelLeftClose, PanelLeft,
  Sparkles, ShieldCheck, Clock, Zap, BarChart3,
  Menu, MoreVertical, Search, Settings2,
  CloudDownload, History, Stethoscope, Activity, HardDrive, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAIChat } from '@/hooks/useAIChat'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { UserProfileMenu } from '@/components/UserProfileMenu'
import NotificationBell from '@/components/NotificationBell'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import ClinicianSidebar from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'

// ─── Markdown Renderer ───────────────────────────────
const MarkdownContent = ({ content }) => (
  <div className="prose-chat prose-sm md:prose-base dark:prose-invert">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-600 dark:text-zinc-300">{children}</p>,
        strong: ({ children }) => <b className="font-bold text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-500/10 px-1 rounded">{children}</b>,
        ul: ({ children }) => <ul className="list-disc ml-5 mb-2 space-y-1 text-slate-600 dark:text-zinc-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-5 mb-2 space-y-1 text-slate-600 dark:text-zinc-300">{children}</ol>,
        li: ({ children }) => <li className="text-[13px] md:text-sm">{children}</li>,
        code: ({ children }) => <code className="bg-slate-100/80 dark:bg-zinc-900/50 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-mdtext-xs font-mono">{children}</code>,
        h1: ({ children }) => <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-2 border-l-2 border-teal-500 pl-2">{children}</h3>,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
)

// ─── Message Bubble ──────────────────────────────────
const MessageBubble = ({ text, isBot, time }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'} overflow-hidden`}
  >
    <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] min-w-0`}>
      <div className={`flex items-center gap-2 px-1 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm ${isBot ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400'
          }`}>
          {isBot ? <BrainCircuit className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          {isBot ? 'Prosto AI' : 'Clinician Intel'}
        </span>
      </div>

      <div className={`relative px-5 py-4 rounded-md break-words overflow-hidden ${isBot
        ? 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 rounded-tl-md border border-slate-100 dark:border-zinc-800 shadow-md'
        : 'bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-600 dark:to-teal-800 text-white rounded-tr-md shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30'
        }`}>
        {isBot ? <MarkdownContent content={text} /> : <div className="text-sm md:text-base whitespace-pre-wrap font-medium break-words">{text}</div>}

        <div className={`absolute bottom-[-18px] ${isBot ? 'left-1' : 'right-1'}`}>
          <span className="text-[9px] font-black text-slate-300 dark:text-zinc-800 uppercase tracking-tighter">{time}</span>
        </div>
      </div>
    </div>
  </motion.div>
)

// ─── Quick Action Chip ────────────────────────────────
const QuickActionChip = ({ label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2.5 px-4 py-2 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-md text-[11px] font-bold text-slate-600 dark:text-zinc-400 hover:bg-teal-600 hover:text-white dark:hover:text-black hover:border-teal-600 dark:hover:bg-zinc-100 transition-all hover:shadow-lg hover:shadow-teal-500/20 cursor-pointer shrink-0 group"
  >
    <Icon className="w-4 h-4 text-teal-500 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors" />
    {label}
  </button>
)

// ─── Session Item ────────────────────────────────────
const SessionItem = ({ session, isActive, onSelect, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState(session.title)

  const handleRename = (e) => {
    e.stopPropagation()
    if (newTitle.trim() && newTitle !== session.title) {
      onRename(session.id, newTitle)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRename(e)
    if (e.key === 'Escape') {
      setNewTitle(session.title)
      setIsEditing(false)
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-3 px-4 py-4 cursor-pointer transition-all border-l-4 ${isActive
        ? 'bg-teal-50/50 dark:bg-zinc-900 border-l-teal-600'
        : 'bg-transparent border-l-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/40'
        }`}
    >
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 shadow-sm transition-all ${isActive ? 'bg-teal-600 text-white rotate-6' : 'bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-600'
        }`}>
        <MessageSquare className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs font-bold text-teal-600 dark:text-teal-300 bg-white dark:bg-zinc-800 border-2 border-teal-100 dark:border-zinc-800 rounded-md px-2 py-1 -ml-1 focus:outline-none"
          />
        ) : (
          <h4
            onClick={(e) => { if (isActive) { e.stopPropagation(); setIsEditing(true); } }}
            className={`text-[13px] font-black truncate leading-tight ${isActive ? 'text-teal-950 dark:text-teal-50 cursor-text' : 'text-slate-700 dark:text-zinc-400'}`}
          >
            {session.title || 'Untitled Protocol'}
          </h4>
        )}
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-1 font-medium">
          {session.last_message ? session.last_message : 'Awaiting diagnostic input...'}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="md:opacity-0 md:group-hover:opacity-100 opacity-100 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40 text-slate-300 dark:text-zinc-800 hover:text-red-500 dark:hover:text-red-400 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

const SidebarContent = ({
  sessions,
  activeSessionId,
  searchQuery,
  setSearchQuery,
  createNewSession,
  selectSession,
  deleteSession,
  renameSession,
  deleteAllSessions,
  user
}) => (
  <div className="flex flex-col h-full bg-white dark:bg-zinc-950 relative">
    <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] dark:bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:20px_20px] opacity-100 pointer-events-none" />

    {/* Sidebar Header */}
    <div className="p-4 border-b border-slate-100 dark:border-zinc-900 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight">Clinical Registry</h2>
        <button
          onClick={createNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 dark:bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> New Analysis
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
        <input
          placeholder="Search protocols..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-[11px] font-medium text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
        />
      </div>
    </div>

    {/* Session List */}
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950 pr-0.5">
      {sessions.length >= 15 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <History className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-[10px] font-black text-red-900 dark:text-red-400 uppercase tracking-tight">Memory Saturation</span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 leading-tight">
              Diagnostic buffer reached 100% capacity (15 sessions). Please purge archived analysis to continue.
            </p>

            <AlertDialog>
              <PopoverTrigger asChild>
                <button className="w-full py-2 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 rounded-md text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-all shadow-sm">
                  Full Registry Wipe
                </button>
              </PopoverTrigger>
              <AlertDialogContent className="rounded-md p-8 dark:bg-zinc-950 dark:border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Erase Clinical Memory?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm font-medium text-slate-500 dark:text-zinc-500 leading-relaxed">
                    This will permanently delete all 15 diagnostic protocols. Scientific recovery is not possible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-3">
                  <AlertDialogCancel className="rounded-md border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest h-12">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllSessions}
                    className="rounded-md bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-red-500/20"
                  >
                    Confirm Purge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
      {sessions.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-900/20 rounded-md flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-zinc-800">
            <Activity className="w-6 h-6 text-slate-200 dark:text-zinc-800" />
          </div>
          <p className="text-[11px] font-black text-slate-300 dark:text-zinc-700 uppercase tracking-widest">No Active Protocols</p>
        </div>
      ) : (
        sessions.filter(s =>
          (s.title || 'Untitled Protocol').toLowerCase().includes(searchQuery.toLowerCase())
        ).map(s => (
          <SessionItem
            key={s.id}
            session={s}
            isActive={s.id === activeSessionId}
            onSelect={() => selectSession(s.id)}
            onDelete={() => deleteSession(s.id)}
            onRename={renameSession}
          />
        ))
      )}
    </div>

    {/* Sidebar Footer */}
    <div className="p-4 border-t border-slate-50 dark:border-zinc-900 bg-[#FBFDFF] dark:bg-black relative z-10">
      <UserProfileMenu>
        <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-900/40 rounded-md border border-slate-100 dark:border-zinc-800 shadow-sm hover:border-teal-200 dark:hover:border-teal-600 hover:shadow-md hover:shadow-teal-500/5 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-teal-50 to-teal-50 dark:from-zinc-900 dark:to-zinc-900 flex items-center justify-center border border-white dark:border-zinc-800 shadow-inner group-hover:from-teal-100 transition-all">
            <User className="w-5 h-5 text-teal-400 group-hover:text-teal-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate tracking-tight">
              {user?.full_name || user?.name || 'Clinician Admin'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]`} />
              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 tracking-tight">
                Authorized License Active
              </p>
            </div>
          </div>
          <div className="p-2 group-hover:bg-slate-50 dark:group-hover:bg-zinc-800 rounded-md transition-colors">
            <Settings2 className="w-4 h-4 text-slate-300 dark:text-zinc-700 group-hover:text-teal-500 transition-colors" />
          </div>
        </div>
      </UserProfileMenu>
    </div>
  </div>
)

const ClinicianAIChat = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { sessionId } = useParams()

  const {
    messages, sessions, activeSessionId, isTyping, isLoading,
    sendMessage, selectSession, createNewSession, deleteSession, renameSession, clearHistory, deleteAllSessions
  } = useAIChat()
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const isMobile = useIsMobile()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  useEffect(() => {
    if (sessionId && sessionId != activeSessionId) {
      const exists = sessions.find(s => s.id == sessionId)
      if (exists) {
        selectSession(sessionId)
      }
    } else if (!sessionId && activeSessionId) {
      navigate(`/dashboard/clinician/ai-chat/${activeSessionId}`, { replace: true })
    }
  }, [sessionId, activeSessionId, sessions, selectSession, navigate])

  const handleSelectSession = (id) => {
    navigate(`/dashboard/clinician/ai-chat/${id}`)
    selectSession(id)
  }

  const handleCreateNew = async () => {
    const newId = await createNewSession()
    if (newId) {
      navigate(`/dashboard/clinician/ai-chat/${newId}`)
    }
  }

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(scrollToBottom, [messages])
  useEffect(() => { inputRef.current?.focus() }, [activeSessionId])

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim() || isTyping) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleExport = () => {
    if (messages.length === 0) {
      toast.error("No clinical analysis to export.")
      return
    }

    const reportContent = messages.map(msg =>
      `${msg.isBot ? 'PROSTO AI ADVISOR' : 'CLINICIAN'} [${msg.time}]:\n${msg.text}\n\n`
    ).join('')

    const blob = new Blob([`PROSTO AI - CLINICAL CASE ANALYSIS\nGenerated: ${new Date().toLocaleString()}\n\n${reportContent}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prosto_analysis_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Case Analysis exported.")
  }

  if (isLoading && messages.length === 0 && sessions.length === 0) {
    return (
      <div className="h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-teal-400/20 rounded-md blur-2xl"
            />
            <motion.div
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="w-16 h-16 bg-teal-600 rounded-md flex items-center justify-center relative z-10 shadow-lg shadow-teal-500/40"
            >
              <BrainCircuit className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <div className="text-center">
            <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-wider mb-1">Diagnostic Interlink</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest">Hydrating Clinical Evidence...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-black font-sans overflow-hidden transition-colors duration-500">
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex overflow-hidden lg:min-w-0"
      >
        {!isMobile && (
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="border-r border-slate-200 dark:border-zinc-900 flex flex-col h-full overflow-hidden shrink-0 z-30"
              >
                <SidebarContent
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  createNewSession={handleCreateNew}
                  selectSession={handleSelectSession}
                  deleteSession={deleteSession}
                  renameSession={renameSession}
                  deleteAllSessions={deleteAllSessions}
                  user={user}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        )}

        <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[grid_#e2e8f0_24px_24px] dark:bg-[grid_#18181b_24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-100 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

          <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 h-18 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 shrink-0 transition-colors">
            <div className="flex items-center gap-4">
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                      <Menu className="w-5 h-5 text-slate-600 dark:text-zinc-500" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-80 [&>button:first-of-type]:hidden">
                    <SidebarContent
                      sessions={sessions}
                      activeSessionId={activeSessionId}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      createNewSession={handleCreateNew}
                      selectSession={handleSelectSession}
                      deleteSession={deleteSession}
                      renameSession={renameSession}
                      deleteAllSessions={deleteAllSessions}
                      user={user}
                    />
                  </SheetContent>
                </Sheet>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden md:flex rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm hover:bg-white dark:hover:bg-zinc-800 hover:border-teal-200 transition-all"
                >
                  {sidebarOpen ? <PanelLeftClose className="w-5 h-5 text-slate-500 dark:text-zinc-500" /> : <PanelLeft className="w-5 h-5 text-slate-500 dark:text-zinc-500" />}
                </Button>
              )}

              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-teal-500 rounded-md blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="w-11 h-11 bg-gradient-to-br from-teal-600 to-teal-600 rounded-md flex items-center justify-center text-white relative z-10 shadow-lg shadow-teal-600/20">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-teal-500 border-2 border-white dark:border-teal-950 rounded-md z-20 shadow-[0_0_8px_#14b8a6]" />
                </div>
                <div className="block">
                  <h1 className="text-[14px] font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase">Prosto AI</h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-md hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all active:scale-95">
                    <MoreVertical className="w-5 h-5 text-slate-400 dark:text-zinc-600" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1.5 rounded-md border-slate-200/60 dark:border-zinc-800 dark:bg-zinc-950 shadow-md" align="end" sideOffset={8}>
                  <div className="p-2 pb-1">
                    <p className="text-[9px] font-black text-slate-300 dark:text-zinc-700 uppercase tracking-wide px-2 mb-1.5">Diagnostic Tools</p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="w-full flex items-center cursor-pointer gap-3 px-3 py-2.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all group outline-none">
                          <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-zinc-900 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 flex items-center justify-center transition-colors">
                            <HardDrive className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold">Flush Analysis Buffer</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-md p-8 dark:bg-zinc-950 dark:border-zinc-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Purge Case Data?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm font-medium text-slate-500 dark:text-zinc-500 leading-relaxed">
                            This will clear all messages in this diagnostic session. Clinical context will be reset.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                          <AlertDialogCancel className="rounded-md border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest h-12">Keep Analysis</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={clearHistory}
                            className="rounded-md bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-red-500/20"
                          >
                            Proceed with Purge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <button
                      onClick={handleExport}
                      className="w-full flex items-center cursor-pointer gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-300 transition-all group outline-none"
                    >
                      <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-zinc-900 group-hover:bg-teal-100 dark:group-hover:bg-zinc-800 flex items-center justify-center transition-colors">
                        <CloudDownload className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold">Export Case Analysis</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative z-10 min-h-0">
            <div className="max-w-4xl mx-auto w-full">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-teal-500 rounded-md blur-3xl opacity-10 animate-pulse" />
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900/30 rounded-md flex items-center justify-center relative z-10 border border-slate-100 dark:border-zinc-800 shadow-lg shadow-slate-200/50 dark:shadow-black/40">
                      <BrainCircuit className="w-10 h-10 text-teal-500" />
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Clinical Advisor Ready</h2>
                  <p className="text-[12px] text-slate-400 dark:text-zinc-600 max-w-sm leading-relaxed font-bold uppercase tracking-widest">
                    Validate treatments, estimate complexities, and optimize chair-time.
                  </p>
                </motion.div>
              )}

              <div className="flex flex-col">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} {...msg} />
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <div className="flex justify-start mb-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 ml-1">
                        <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">AI Clinical Verification</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900/30 px-5 py-3.5 rounded-md rounded-tl-md border border-slate-100 dark:border-zinc-800 flex gap-1.5 shadow-md items-center shadow-teal-900/20">
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-teal-200 dark:bg-zinc-800 rounded-md" />
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-teal-500 rounded-md" />
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-teal-200 dark:bg-zinc-800 rounded-md" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} className="h-10" />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-900 bg-white dark:bg-black px-4 py-4 shrink-0 shadow-sm relative z-20 transition-colors">
            <div className="max-w-4xl mx-auto">
              {messages.length < 15 && (
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar px-1 items-center">
                  <QuickActionChip
                    label="Biomechanic Review"
                    icon={HardDrive}
                    onClick={() => sendMessage("Analyze the biomechanical feasibility and structural longevity of this proposed treatment.")}
                  />
                  <QuickActionChip
                    label="Material Efficacy"
                    icon={HardDrive}
                    onClick={() => sendMessage("What are the recommended materials and material efficiency for these specific procedures?")}
                  />
                  <QuickActionChip
                    label="Chair-Time Optimization"
                    icon={Clock}
                    onClick={() => sendMessage("Analyze the clinical workflow and provide chair-time optimization strategies.")}
                  />
                  <QuickActionChip
                    label="Risk Mitigation"
                    icon={ShieldCheck}
                    onClick={() => sendMessage("Predict potential clinical complications and provide risk mitigation protocols.")}
                  />
                </div>
              )}

              {messages.length >= 15 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-md p-6 text-center space-y-4 shadow-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                      <History className="w-5 h-5" />
                    </div>
                    <h4 className="text-[14px] font-black text-red-900 dark:text-red-400 uppercase tracking-tight">Diagnostic Buffer Full</h4>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 max-w-[320px] leading-relaxed">
                      Protocol limit reached for this session (15 interactions). Please <span className="text-red-600 dark:text-red-400">Flush Analysis Buffer</span> to continue.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isTyping}
                      placeholder="Inquire clinical advisory..."
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-sm font-medium text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-all shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTyping || !input.trim()}
                    className="w-12 h-12 bg-teal-600 dark:bg-teal-600 rounded-md flex items-center justify-center text-white shadow-md shadow-teal-500/25 hover:bg-teal-700 dark:hover:bg-teal-500 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-zinc-900 transition-all shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  )
}

export default ClinicianAIChat
