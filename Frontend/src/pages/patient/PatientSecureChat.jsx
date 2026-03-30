import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Send,
  Lock,
  Loader2,
  ShieldCheck,
  CheckCheck,
  Clock,
  Smile,
  Info,
  Zap,
  Stethoscope,
  History,
  ClipboardCheck,
  Activity,
  Sparkles,
  ArrowUpRight,
  X,
  Archive,
  PanelLeft,
  PanelLeftClose,
  Menu,
  MoreVertical,
  User,
  Brain
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'
import { getMessages, sendMessage, initChat, getTreatmentPlan, getConsultationRequests, archiveChat, unarchiveChat } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import PatientSidebar, { PatientSidebarTrigger } from '@/components/PatientSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTheme } from '@/context/ThemeContext'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
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
  AlertDialogMedia,
} from '@/components/ui/alert-dialog'

/* ─── Single Message Bubble ──────────────────────────────────────── */
const ChatBubble = ({ msg, isMe, showAvatar }) => {
  const time = new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isSystemMsg = msg.message?.startsWith('System Notice:')

  if (isSystemMsg) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-center my-3 sm:my-4 w-full"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/30 rounded-md shadow-sm max-w-[90%] sm:max-w-[80%]" >
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-snug text-center">
            {msg.message.replace('System Notice: ', '')}
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`flex items-start gap-2 sm:gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 mt-0.5 rounded-md sm:rounded-md flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300 ${isMe ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20 shadow-lg' : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'
        } ${!showAvatar && 'opacity-0 scale-90'}`}>
        {isMe ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]`}>
        <div
          className={`
          relative px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 text-[13px] sm:text-sm leading-[1.55] sm:leading-[1.6] transition-all duration-300
          ${isMe
              ? 'bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-blue-50 rounded-md sm:rounded-md rounded-tr-sm shadow-xl shadow-blue-900/10'
              : 'bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl text-slate-800 dark:text-zinc-100 rounded-md sm:rounded-md rounded-tl-sm border border-white/60 dark:border-zinc-800 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100/50 dark:ring-white/5'
            }
          `}
        >
          <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-blue-500 dark:prose-strong:text-blue-400">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-black text-blue-600 dark:text-blue-400" {...props} />
              }}
            >
              {msg.message}
            </ReactMarkdown>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter tabular-nums">{time}</span>
          {isMe && <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Sidebar Section ───────────────────────────────────────────── */
const SidebarSection = ({ icon: Icon, title, children }) => (
  <div className="mb-6 sm:mb-8 last:mb-0">
    <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4 px-1">
      <div className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50 shadow-sm">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">{title}</h3>
    </div>
    {children}
  </div>
)

/* ─── Date Separator ─────────────────────────────────────────────── */
const DateSep = ({ date }) => (
  <div className="flex items-center gap-3 sm:gap-4 py-6 sm:py-10">
    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-slate-200/50 dark:via-zinc-800/50 to-transparent" />
    <div className="px-4 py-1.5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-blue-100/30 dark:border-blue-900/20 rounded-md shadow-sm">
      <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">{date}</span>
    </div>
    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-slate-200/50 dark:via-zinc-800/50 to-transparent" />
  </div>
)

/* ─── Sidebar Content (Isolated Component) ────────────────────────── */
const SidebarContent = ({ plan, requestId, locked, isChatActive, isArchived, isCompleted, handleUnarchive, handleArchiveSession, navigate }) => (
  <div className="p-5 sm:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950">
    <SidebarSection icon={Stethoscope} title="Consulting Clinician">
      <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-md p-4 border border-slate-100 dark:border-zinc-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-blue-600 rounded-md border-4 border-white dark:border-zinc-800 flex items-center justify-center text-white font-black shadow-xl text-lg">
            {plan?.dentist_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">Dr. {plan?.dentist_name || 'Verified Dentist'}</p>
            <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] leading-none mt-1">Registry PRS-{requestId.slice(-5).toUpperCase()}</p>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-md shadow-sm">
          <p className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-1 tracking-widest">Protocol Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-md bg-blue-500 animate-pulse" />
            <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">{plan?.status || 'Active Consultation'}</p>
          </div>
        </div>
      </div>
    </SidebarSection>

    {plan?.ai_explanation && (
      <SidebarSection icon={Sparkles} title="AI Clinical Insight">
        <div className="bg-zinc-900 dark:bg-black rounded-md p-5 text-zinc-100 shadow-2xl shadow-blue-900/20 border border-zinc-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000">
            <Brain className="w-20 h-20 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Synthesis Node</span>
          </div>
          <div className="text-[12px] leading-relaxed font-bold dark:text-zinc-300 relative z-10 prose prose-invert prose-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {plan.ai_explanation}
            </ReactMarkdown>
          </div>
        </div>
      </SidebarSection>
    )}

    <SidebarSection icon={History} title="Proposed Procedures">
      {plan?.items && plan.items.length > 0 ? (
        <div className="space-y-3">
          {plan.items.map((i, idx) => (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-md hover:shadow-xl transition-all duration-300"
              style={{ borderLeft: `3px solid ${i.color_tag || '#2563eb'}`, borderColor: `${i.color_tag || '#2563eb'}30` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-md transition-colors shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                  style={{ backgroundColor: i.color_tag || '#2563eb' }}
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{i.name}</span>
              </div>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tabular-nums shrink-0 ml-2">₹{i.cost?.toLocaleString()}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-md">
          <p className="text-[10px] font-black text-slate-300 dark:text-zinc-600 uppercase tracking-[0.2em]">No Items Synchronized</p>
        </div>
      )}
    </SidebarSection>

    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-zinc-800">
      <div className="bg-blue-600 dark:bg-blue-700 rounded-md p-6 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
          <ShieldCheck className="w-14 h-14" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Protocol Registry Sum</p>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-blue-300 italic">₹</span>
          <p className="text-3xl font-black tabular-nums tracking-tighter">
            {plan?.total_cost?.toLocaleString() || '0'}
          </p>
        </div>
      </div>
    </div>

    {isCompleted && (
      <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30 rounded-md text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Cycle Terminated</span>
        </div>
        <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/60">Secure clinical record permanently sealed.</p>
      </div>
    )}
  </div>
)

const SecureChat = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme } = useTheme()

  const [chatId, setChatId] = useState(0)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [showInfoSidebar, setShowInfoSidebar] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isChatActive, setIsChatActive] = useState(true)

  const scrollParentRef = useRef(null)
  const pollRef = useRef(null)
  const inputRef = useRef(null)
  const emojiRef = useRef(null)

  const scrollBottom = useCallback((instant = false) => {
    if (scrollParentRef.current) {
      scrollParentRef.current.scrollTo({
        top: scrollParentRef.current.scrollHeight,
        behavior: instant ? 'auto' : 'smooth'
      })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const checkWidth = () => setShowInfoSidebar(window.innerWidth >= 1280)
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const chatRes = await initChat(requestId)
        if (chatRes.status === 'success') {
          setChatId(chatRes.chat_id)
          if (chatRes.is_active !== undefined) {
            setIsChatActive(chatRes.is_active === 1)
          }
          const [msgRes, planRes, reqsRes] = await Promise.all([
            getMessages(chatRes.chat_id),
            getTreatmentPlan({ request_id: requestId }),
            getConsultationRequests('PATIENT', user.id).catch(() => ({ status: 'error' }))
          ])
          if (msgRes.status === 'success') {
            setMessages(msgRes.data)
            setTimeout(() => scrollBottom(true), 150)
          }

          let finalPlan = planRes.status === 'success' ? planRes.data : null
          if ((!finalPlan || !finalPlan.dentist_name) && reqsRes?.status === 'success') {
            const match = reqsRes.data.find(r => r.id === parseInt(requestId))
            if (match && match.dentist_name) {
              if (!finalPlan) finalPlan = {}
              finalPlan.dentist_name = match.dentist_name
            }
          }
          if (finalPlan) setPlan(finalPlan)
        }
      } catch {
        toast.error('Clinical channel failed to sync')
      } finally {
        setIsLoading(false)
      }
    }
    if (requestId) init()
  }, [requestId, scrollBottom, user.id])

  useEffect(() => {
    if (!chatId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await getMessages(chatId)
        if (res.status === 'success') {
          if (res.is_active !== undefined) setIsChatActive(res.is_active === 1);
          setMessages(prev => {
            if (res.data.length > prev.length) {
              setTimeout(() => scrollBottom(), 50)
              return res.data
            }
            return prev
          })
        }
      } catch { /* silent */ }
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [chatId, scrollBottom])

  const handleSend = async (e) => {
    e.preventDefault()
    const txt = newMessage.trim()
    if (!txt || !chatId) return

    setNewMessage('')
    setIsSending(true)

    const tempId = Date.now()
    const temp = { id: tempId, sender_role: 'PATIENT', message: txt, sent_at: new Date().toISOString(), isPending: true }
    setMessages((p) => [...p, temp])
    setTimeout(() => scrollBottom(), 50)

    try {
      const res = await sendMessage({ chat_id: chatId, sender_role: 'PATIENT', message: txt })
      if (res.status === 'success') {
        const syncRes = await getMessages(chatId)
        if (syncRes.status === 'success') {
          setMessages(prev => (syncRes.data.length >= prev.length ? syncRes.data : prev))
        }
      } else {
        toast.error(res.message || 'Clinical dispatch failed')
        setMessages(p => p.filter(m => m.id !== tempId))
      }
    } catch (err) {
      toast.error(err.message || 'Network failure')
      setMessages(p => p.filter(m => m.id !== tempId))
    } finally {
      setIsSending(false)
      setShowEmojiPicker(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji)
  }

  const handleArchiveSession = async () => {
    if (!chatId) return
    toast.promise(
      archiveChat(chatId),
      {
        loading: 'Moving session into secure archives...',
        success: () => {
          setIsChatActive(false)
          return 'Clinical room successfully archived.'
        },
        error: 'Vault sync failed.'
      }
    )
  }

  const handleUnarchive = async () => {
    if (!chatId) return
    if (plan?.request_status === 'COMPLETED' || plan?.plan_status === 'COMPLETED') {
      toast.error('Cannot unarchive a finalized clinical session.')
      return
    }
    toast.promise(
      unarchiveChat(chatId),
      {
        loading: 'Restoring clinical channel...',
        success: () => {
          setIsChatActive(true)
          return 'Clinical room successfully restored.'
        },
        error: 'Vault sync failed.'
      }
    )
  }

  const isArchived = !isChatActive
  const isCompleted = plan?.request_status === 'COMPLETED' || plan?.plan_status === 'COMPLETED'
  const locked = isArchived || isCompleted

  const grouped = messages.reduce((acc, msg) => {
    const d = new Date(msg.sent_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc.length || acc[acc.length - 1].date !== d) {
      acc.push({ date: d, msgs: [msg] })
    } else {
      acc[acc.length - 1].msgs.push(msg)
    }
    return acc
  }, [])

  if (isLoading) {
    return (
      <div className="h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-md animate-spin border-t-blue-600" />
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Authenticating Node</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Bridging Clinical Network...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden">
      <PatientSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex overflow-hidden relative h-screen"
      >
        {!isMobile && (
          <AnimatePresence>
            {showInfoSidebar && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="border-r border-slate-100 dark:border-zinc-800/50 flex flex-col h-full overflow-hidden shrink-0 z-30 bg-white dark:bg-zinc-950 shadow-2xl"
              >
                <SidebarContent
                  plan={plan}
                  requestId={requestId}
                  locked={locked}
                  isChatActive={isChatActive}
                  isArchived={isArchived}
                  isCompleted={isCompleted}
                  handleUnarchive={handleUnarchive}
                  handleArchiveSession={handleArchiveSession}
                  navigate={navigate}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        )}

        <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-black relative overflow-hidden">
          <div className="absolute inset-0 opacity-100 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181b' : '#e2e8f0'} 1.5px, transparent 1.5px)`, backgroundSize: '32px 32px' }} />

          <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 h-18 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800/50 shrink-0">
            <div className="flex items-center gap-4 py-4">
              <PatientSidebarTrigger />
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                      <Menu className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[min(85vw,380px)] bg-white dark:bg-black">
                    <SidebarContent
                      plan={plan}
                      requestId={requestId}
                      locked={locked}
                      isChatActive={isChatActive}
                      isArchived={isArchived}
                      isCompleted={isCompleted}
                      handleUnarchive={handleUnarchive}
                      handleArchiveSession={handleArchiveSession}
                      navigate={navigate}
                    />
                  </SheetContent>
                </Sheet>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfoSidebar(!showInfoSidebar)}
                  className="hidden md:flex rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm hover:bg-white dark:hover:bg-zinc-800 transition-all transition-transform active:scale-90"
                >
                  {showInfoSidebar ? <PanelLeftClose className="w-5 h-5 text-slate-500" /> : <PanelLeft className="w-5 h-5 text-slate-500" />}
                </Button>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex w-10 h-10 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-md items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-90"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative group shrink-0 hidden sm:block">
                    <div className="absolute inset-0 bg-blue-500 rounded-md blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-md flex items-center justify-center text-white text-lg font-black relative z-10 shadow-2xl ring-4 ring-white dark:ring-zinc-900">
                      {plan?.dentist_name?.[0] || 'D'}
                    </div>
                  </div>

                  <div className="block min-w-0">
                    <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase truncate">
                      Dr. {plan?.dentist_name || 'Verified Dentist'}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2 h-2 rounded-md ${locked ? 'bg-slate-300 dark:bg-zinc-700' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase leading-none">
                        {locked ? 'Registry Sealed' : 'Encrypted Link Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div
            ref={scrollParentRef}
            className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-10 py-6 md:py-12 space-y-6 scroll-smooth custom-scrollbar relative z-10 min-h-0"
          >
            <div className="max-w-4xl mx-auto w-full">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="relative mb-10">
                    <div className="absolute inset-0 bg-blue-500 rounded-md blur-[80px] opacity-10 animate-pulse" />
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-md flex items-center justify-center relative z-10 shadow-2xl">
                      <Lock className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">Secure Clinical Node</h2>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs leading-relaxed font-bold uppercase tracking-[0.2em]">
                    End-to-end encrypted medical communication portal.
                  </p>
                </motion.div>
              )}

              {grouped.map((group, gi) => (
                <div key={gi} className="space-y-6">
                  <DateSep date={group.date} />
                  <div className="space-y-6">
                    {group.msgs.map((msg, mi) => {
                      const isMe = msg.sender_role === 'PATIENT'
                      const prev = group.msgs[mi - 1]
                      const showAvatar = !prev || prev.sender_role !== msg.sender_role
                      return <ChatBubble key={msg.id || mi} msg={msg} isMe={isMe} showAvatar={showAvatar} />
                    })}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start mb-8">
                  <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-md rounded-tl-sm border border-slate-100 dark:border-zinc-800 flex gap-2 shadow-xl items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-md animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-600 rounded-md animate-bounce" style={{ animationDelay: '200ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-md animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
              <div className="h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-black border-t border-slate-100 dark:border-zinc-800 px-4 py-6 shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <div className="max-w-4xl mx-auto">
              {locked ? (
                <div className="flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-md p-8 border border-slate-200/50 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-1.5">Communication Vaulted</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tight">This clinical workspace is read-only.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-4 group">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type clinical inquiry..."
                      className="w-full h-14 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-md px-6 pr-14 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1" ref={emojiRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 ${showEmojiPicker ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:text-blue-500 hover:scale-110 active:scale-90'}`}
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="absolute bottom-full right-0 mb-6 z-[100] shadow-2xl border border-slate-100 dark:border-zinc-800 rounded-md overflow-hidden"
                          >
                            <EmojiPicker
                              onEmojiClick={onEmojiClick}
                              theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                              width={320}
                              height={400}
                              previewConfig={{ showPreview: false }}
                              skinTonesDisabled
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-zinc-900 text-white disabled:text-slate-400 rounded-md flex items-center justify-center transition-all duration-300 shadow-xl shadow-blue-500/30 disabled:shadow-none active:scale-90 shrink-0"
                  >
                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
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

export default SecureChat
