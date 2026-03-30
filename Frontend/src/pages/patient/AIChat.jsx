import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Bot, User, Plus, Trash2, BrainCircuit,
  MessageSquare, PanelLeftClose, PanelLeft,
  Sparkles, ShieldCheck, Clock, Zap, BarChart3,
  Menu, MoreVertical, Search, Settings2,
  CloudDownload, History,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAIChat } from '@/hooks/useAIChat'
import { useIsMobile } from '@/hooks/use-mobile'
import { UserProfileMenu } from '@/components/UserProfileMenu'
import NotificationBell from '@/components/NotificationBell'
import { useTheme } from '@/context/ThemeContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// ─── Markdown Renderer ───────────────────────────────
const MarkdownContent = ({ content }) => (
  <div className="prose-chat prose-sm md:prose-base">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-600 dark:text-zinc-400">{children}</p>,
        strong: ({ children }) => <b className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 px-1 rounded">{children}</b>,
        ul: ({ children }) => <ul className="list-disc ml-5 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-5 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-[13px] md:text-sm text-slate-600 dark:text-zinc-400">{children}</li>,
        code: ({ children }) => <code className="bg-slate-100/80 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-mdtext-xs font-mono">{children}</code>,
        h1: ({ children }) => <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-zinc-100 mb-2 border-l-2 border-blue-500 pl-2">{children}</h3>,
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
    className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}
  >
    <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%]`}>
      <div className={`flex items-center gap-2 px-1 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm ${isBot ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
          }`}>
          {isBot ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
          {isBot ? 'Prosto AI' : 'Patient Query'}
        </span>
      </div>

      <div className={`relative px-5 py-4 rounded-md ${isBot
        ? 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 rounded-tl-sm border border-slate-100 dark:border-zinc-900 shadow-xl shadow-slate-200/20 dark:shadow-black/40'
        : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-lg shadow-blue-600/25'
        }`}>
        {isBot ? <MarkdownContent content={text} /> : <div className="text-sm md:text-base whitespace-pre-wrap font-bold">{text}</div>}

        <div className={`absolute bottom-[-18px] ${isBot ? 'left-1' : 'right-1'}`}>
          <span className="text-[9px] font-black text-slate-300 dark:text-zinc-700 uppercase tracking-tighter">{time}</span>
        </div>
      </div>
    </div>
  </motion.div>
)

// ─── Quick Action Chip ────────────────────────────────
const QuickActionChip = ({ label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2.5 px-4 py-2 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-md text-[11px] font-bold text-slate-600 dark:text-zinc-400 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white hover:border-blue-600 transition-all hover:shadow-lg hover:shadow-blue-500/20  cursor-pointer shrink-0 group"
  >
    <Icon className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:text-white transition-colors" />
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
        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-blue-600'
        : 'bg-transparent border-l-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/40'
        }`}
    >
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 shadow-sm transition-all ${isActive ? 'bg-blue-600 text-white rotate-6' : 'bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-600'
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
            className="w-full text-xs font-bold text-blue-600 bg-white dark:bg-zinc-950 border-2 border-blue-100 dark:border-blue-900/50 rounded-md px-2 py-1 -ml-1 focus:outline-none"
          />
        ) : (
          <h4
            onClick={(e) => { if (isActive) { e.stopPropagation(); setIsEditing(true); } }}
            className={`text-[13px] font-black truncate leading-tight ${isActive ? 'text-blue-900 dark:text-blue-400 cursor-text' : 'text-slate-700 dark:text-zinc-300'}`}
          >
            {session.title || 'Untitled Protocol'}
          </h4>
        )}
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-1 font-medium">
          {session.last_message ? session.last_message : 'Awaiting clinical input...'}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="md:opacity-0 md:group-hover:opacity-100 opacity-100 p-2 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
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
  user,
  hasContext
}) => (
  <div className="flex flex-col h-full bg-white dark:bg-black relative">
    <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] dark:bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:20px_20px] opacity-100 pointer-events-none" />

    {/* Sidebar Header */}
    <div className="p-4 border-b border-slate-100 dark:border-zinc-800 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight">Conversations</h2>
        <button
          onClick={createNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-[10px] font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> New Chat
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
        <input
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:text-zinc-100"
        />
      </div>
    </div>

    {/* Session List */}
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-black pr-0.5 relative z-10">
      {sessions.length >= 15 && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                <History className="w-3.5 h-3.5 text-red-600" />
              </div>
              <span className="text-[10px] font-black text-red-900 uppercase tracking-tight">Cluster Protocol Limit</span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 leading-tight">
              Neural memory is at 100% capacity (15/15 sessions). Please purge inactive protocols to proceed.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full py-2 bg-white border border-red-200 rounded-md text-[9px] font-black text-red-600 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
                  Purge All Protocols
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-md p-8">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Terminal Purge?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                    This will permanently erase all 15 clinical protocols and their associated neural history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-3">
                  <AlertDialogCancel className="rounded-md border-slate-200 font-bold text-xs uppercase tracking-widest h-12">Keep Data</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllSessions}
                    className="rounded-md bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-red-500/20"
                  >
                    Confirm Terminal Purge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
      {sessions.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <MessageSquare className="w-6 h-6 text-slate-200" />
          </div>
          <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Zero Links Found</p>
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
    <div className="p-4 border-t border-slate-50 dark:border-zinc-900 bg-[#FBFDFF] dark:bg-black/50 relative z-10">
      <UserProfileMenu>
        <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 rounded-md border border-slate-100 dark:border-zinc-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md hover:shadow-blue-500/5 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center border border-white dark:border-zinc-700 shadow-inner group-hover:from-blue-100 dark:group-hover:from-zinc-800 transition-all">
            <User className="w-5 h-5 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate tracking-tight">
              {user?.full_name || user?.name || 'Patient Profile'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-md ${hasContext ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-zinc-700'}`} />
              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 tracking-tight">
                {hasContext ? 'Dossier engaged' : 'Standard logic'}
              </p>
            </div>
          </div>
          <div className="p-2 group-hover:bg-slate-50 dark:group-hover:bg-zinc-900 rounded-md transition-colors">
            <Settings2 className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          </div>
        </div>
      </UserProfileMenu>
    </div>
  </div>
)

// ─── Main Component ──────────────────────────────────
const AIChat = () => {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme } = useTheme()

  const {
    messages, sessions, activeSessionId, isTyping, isLoading,
    sendMessage, selectSession, createNewSession, deleteSession, renameSession, clearHistory, deleteAllSessions, hasContext
  } = useAIChat()
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Sync hook state with URL sessionId (handles browser back/forward)
  useEffect(() => {
    if (sessionId && sessionId != activeSessionId) {
      const exists = sessions.find(s => s.id == sessionId)
      if (exists) {
        selectSession(sessionId)
      }
    } else if (!sessionId && activeSessionId) {
      // If we're at the root chat path but a session is active, update the URL
      navigate(`/patient/ai-chat/${activeSessionId}`, { replace: true })
    }
  }, [sessionId, activeSessionId, sessions, selectSession, navigate])

  const handleSelectSession = (id) => {
    navigate(`/patient/ai-chat/${id}`)
    selectSession(id)
  }

  const handleCreateNew = async () => {
    const newId = await createNewSession()
    if (newId) {
      navigate(`/patient/ai-chat/${newId}`)
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
      toast.error("No clinical data to export.")
      return
    }

    const reportContent = messages.map(msg =>
      `${msg.isBot ? 'CLINICAL AI' : 'PATIENT'} [${msg.time}]:\n${msg.text}\n\n`
    ).join('')

    const blob = new Blob([`PROSTO AI - CLINICAL DOSSIER EXPORT\nGenerated: ${new Date().toLocaleString()}\n\n${reportContent}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prosto_dossier_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Dossier exported.")
  }



  if (isLoading && messages.length === 0 && sessions.length === 0) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-blue-400/20 rounded-md blur-2xl"
            />
            <motion.div
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="w-16 h-16 bg-blue-600 rounded-md flex items-center justify-center relative z-10 shadow-2xl shadow-blue-500/40"
            >
              <BrainCircuit className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <div className="text-center">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Neural Interlink</h3>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Initializing Clinical Logic...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#F8FAFC] dark:bg-black flex overflow-hidden font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <PatientSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex overflow-hidden relative h-screen"
      >
        {/* ═══ Desktop Sidebar (Inner) ═══ */}
        {!isMobile && (
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="border-r border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden shrink-0 z-30"
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
                  hasContext={hasContext}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        )}

        {/* ═══ Main Chat ═══ */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] dark:bg-black relative">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-100 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181b' : '#e2e8f0'} 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }} />

          {/* Header */}
          <header className="z-20 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shrink-0">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <PatientSidebarTrigger />

                  <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1 hidden md:block" />

                  {isMobile ? (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden rounded-md bg-slate-50 border border-slate-200 shadow-sm w-9 h-9">
                          <Menu className="w-4.5 h-4.5 text-slate-600" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-80 [&>button:first-of-type]:hidden border-r-0">
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
                          hasContext={hasContext}
                        />
                      </SheetContent>
                    </Sheet>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="hidden md:flex rounded-md bg-slate-50 border border-slate-200 shadow-sm hover:bg-white hover:border-blue-200 transition-all w-9 h-9"
                    >
                      {sidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5 text-slate-500" /> : <PanelLeft className="w-4.5 h-4.5 text-slate-500" />}
                    </Button>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="relative group hidden xs:block">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center text-white relative z-10 shadow-lg shadow-blue-600/20">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-md z-20" />
                    </div>
                    <div className="block">
                      <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 tracking-tighter leading-none uppercase">Prosto AI</h1>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasContext && (
                    <div className="hidden lg:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-md border border-blue-100 dark:border-blue-800/50 shadow-sm shadow-blue-500/5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Patient Dossier Synced</span>
                    </div>
                  )}
                  <NotificationBell />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-md hover:bg-slate-50 transition-all active:scale-95">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1.5 rounded-md border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl shadow-slate-200/40 dark:shadow-black/60" align="end" sideOffset={8}>
                      <div className="p-2 pb-1">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] px-2 mb-1.5">Session Tools</p>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all group outline-none">
                              <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold">Clear Neural Cache</span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-md p-8">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Purge Session Data?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                                This action will immediately terminate the current clinical context and purge all neural cache. This process is irreversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-3">
                              <AlertDialogCancel className="rounded-md border-slate-200 font-bold text-xs uppercase tracking-widest h-12">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={clearHistory}
                                className="rounded-md bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-red-500/20"
                              >
                                Confirm Purge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <button
                          onClick={handleExport}
                          className="w-full flex items-center cursor-pointer gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-all group outline-none"
                        >
                          <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                            <CloudDownload className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold">Export Dossier</span>
                        </button>
                      </div>

                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative z-10">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500 rounded-md blur-3xl opacity-10 animate-pulse" />
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-md flex items-center justify-center relative z-10 border border-slate-100 dark:border-zinc-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/60">
                      <Sparkles className="w-10 h-10 text-blue-500" />
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 mb-2 uppercase tracking-tight">Clinical Assistant Ready</h2>
                  <p className="text-[12px] text-slate-400 dark:text-zinc-500 max-w-sm leading-relaxed font-bold uppercase tracking-widest">
                    Analyze cost, procedures, and timelines in real-time.
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
                        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Link Processing</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-950 px-5 py-3.5 rounded-md rounded-tl-md border border-slate-100 dark:border-zinc-900 flex gap-1.5 shadow-xl shadow-slate-200/20 dark:shadow-black/40 items-center">
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-blue-200 dark:bg-blue-900/40 rounded-md" />
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-blue-500 dark:bg-blue-600 rounded-md" />
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-blue-200 dark:bg-blue-900/40 rounded-md" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} className="h-10" />
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-black px-4 py-4 shrink-0 shadow-sm">
            <div className="max-w-4xl mx-auto">
              {/* Quick Actions */}
              {messages.length < 15 && (
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar px-1 items-center">
                  <QuickActionChip
                    label="Cost Analysis"
                    icon={Zap}
                    onClick={() => sendMessage("Can you provide an economic justification for my treatment costs?")}
                  />
                  <QuickActionChip
                    label="Treatment Plan"
                    icon={BarChart3}
                    onClick={() => sendMessage("Give me a holistic case analysis of my proposed treatment plan.")}
                  />
                  <QuickActionChip
                    label="Recovery Flow"
                    icon={Clock}
                    onClick={() => sendMessage("What is the clinical workflow and timeline for my sessions?")}
                  />
                  <QuickActionChip
                    label="Risk Nodes"
                    icon={ShieldCheck}
                    onClick={() => sendMessage("Analyze any clinical risks or prerequisites based on my dental dossier.")}
                  />
                </div>
              )}

              {messages.length >= 15 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/50 border border-red-100 rounded-md p-6 text-center space-y-4 shadow-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-red-100 flex items-center justify-center text-red-600">
                      <History className="w-5 h-5" />
                    </div>
                    <h4 className="text-[14px] font-black text-red-900 uppercase tracking-tight">Context Memory Full</h4>
                    <p className="text-[11px] font-bold text-slate-500 max-w-[320px] leading-relaxed">
                      This specific clinical session has reached its context limit (15 interactions). Please <span className="text-red-600">Clear Neural Cache</span> or start a new protocol.
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
                      placeholder="Type clinical query..."
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm font-medium dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTyping || !input.trim()}
                    className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-95 disabled:bg-slate-200 transition-all shrink-0"
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

export default AIChat
