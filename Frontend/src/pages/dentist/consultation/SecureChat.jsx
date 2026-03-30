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
  User
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'
import { getMessages, sendMessage, initChat, getTreatmentPlan, getConsultationRequests, archiveChat, unarchiveChat } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import ClinicianSidebar from '@/components/ClinicianSidebar'
import { useSidebar } from '@/context/SidebarContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useIsMobile } from '@/hooks/use-mobile'
import UniversalLoader from '@/components/UniversalLoader'
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
        <div className="flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-md shadow-sm max-w-[90%] sm:max-w-[80%]">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 leading-snug text-center">
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
      <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 mt-0.5 rounded-md flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300 ${isMe
        ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-500 dark:border-emerald-400 text-white'
        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500'
        } ${!showAvatar && 'opacity-0 scale-90'}`}>
        {isMe ? <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]`}>
        <div
          className={`
            relative px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 text-[13px] sm:text-sm leading-[1.55] sm:leading-[1.6] transition-all duration-300
            ${isMe
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white rounded-md sm:rounded-md rounded-tr-md sm:rounded-tr-none shadow-xl shadow-emerald-900/10 dark:shadow-emerald-500/10'
              : 'bg-white dark:bg-zinc-900/50 backdrop-blur-md text-zinc-800 dark:text-zinc-200 rounded-md sm:rounded-md rounded-tl-md sm:rounded-tl-none border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-200/40 dark:shadow-black/20 ring-1 ring-zinc-100/50 dark:ring-zinc-800/50'
            }
          `}
        >
          <div className={`prose prose-sm max-w-none ${isMe ? 'prose-invert' : 'prose-zinc dark:prose-invert'} prose-p:leading-relaxed`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                strong: ({ node, ...props }) => <strong className={`font-black ${isMe ? 'text-white' : 'text-zinc-900 dark:text-white'}`} {...props} />
              }}
            >
              {msg.message}
            </ReactMarkdown>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter tabular-nums">{time}</span>
          {isMe && <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400" />}
        </div>
      </div>
    </motion.div>
  )
}


/* ─── Sidebar Section ───────────────────────────────────────────── */
const SidebarSection = ({ icon: Icon, title, children }) => (
  <div className="mb-6 sm:mb-8 last:mb-0">
    <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4 px-1">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-md flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <h3 className="text-[9px] sm:text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wide sm:tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
)



/* ─── Date Separator ─────────────────────────────────────────────── */
const DateSep = ({ date }) => (
  <div className="flex items-center gap-3 sm:gap-4 py-6 sm:py-10">
    <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
    <div className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
      <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">{date}</span>
    </div>
    <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
  </div>
)


/* ─── Sidebar Content (Isolated Component) ────────────────────────── */
const SidebarContent = ({ plan, requestId, locked, isChatActive, isArchived, isCompleted, handleUnarchive, handleArchiveSession, navigate }) => (
  <div className="p-5 sm:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
    <SidebarSection icon={User} title="Patient Information">
      <div className="bg-emerald-50/10 dark:bg-emerald-950/20 rounded-md sm:rounded-md p-4 sm:p-5 lg:p-6 border border-emerald-100/50 dark:border-emerald-800/30 backdrop-blur-sm">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-zinc-800 rounded-md sm:rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm text-sm sm:text-base">
            {plan?.patient_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate">{plan?.patient_name || 'Verified Patient'}</p>
            <p className="text-[9px] sm:text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest leading-none mt-0.5 sm:mt-1">ID: PRS-{requestId.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <div className="p-2.5 sm:p-3 bg-white dark:bg-zinc-800 border border-emerald-50 dark:border-emerald-900/30 rounded-md sm:rounded-md shadow-sm">
          <p className="text-[8px] sm:text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase mb-0.5 sm:mb-1 tracking-widest">Clinical Status</p>
          <p className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">{plan?.status || 'Active Consultation'}</p>
        </div>
      </div>
    </SidebarSection>



    {plan?.ai_explanation && (
      <SidebarSection icon={Sparkles} title="AI Clinical Insight">
        <div className="bg-emerald-950 dark:bg-emerald-500 rounded-md sm:rounded-md p-4 sm:p-5 lg:p-6 text-white dark:text-black shadow-xl shadow-emerald-950/10 dark:shadow-emerald-500/10 border border-emerald-800 dark:border-emerald-400">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 dark:text-emerald-900" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide sm:tracking-wide">Synthesis Report</span>
          </div>
          <div className={`text-[12px] sm:text-[13px] leading-relaxed font-medium opacity-90 prose prose-sm ${plan?.ai_explanation ? 'prose-invert' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {plan.ai_explanation}
            </ReactMarkdown>
          </div>
        </div>
      </SidebarSection>
    )}



    <SidebarSection icon={History} title="Proposed Procedures">
      {plan?.items && plan.items.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {plan.items.map((i, idx) => (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="group flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-md sm:rounded-md hover:shadow-lg transition-all duration-300"
              style={{ borderLeft: `3px solid ${i.color_tag || '#10b981'}`, borderColor: `${i.color_tag || '#10b981'}15` }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-md transition-colors shrink-0"
                  style={{ backgroundColor: i.color_tag || '#10b981' }}
                />
                <span className="text-[11px] sm:text-[12px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{i.name}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums italic shrink-0 ml-2">₹{i.cost?.toLocaleString()}</span>
            </motion.div>

          ))}
        </div>
      ) : (
        <div className="p-4 sm:p-6 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-md sm:rounded-md">
          <p className="text-[10px] sm:text-[11px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">No Items Recorded</p>
        </div>
      )}
    </SidebarSection>


    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-zinc-100 dark:border-zinc-800">
      <div className="bg-emerald-950 dark:bg-emerald-500 rounded-md sm:rounded-md p-5 sm:p-6 lg:p-7 text-white dark:text-black shadow-lg shadow-emerald-900/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 sm:p-4 transition-transform duration-500 group-hover:rotate-12">
          <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-white/5 dark:text-black/5" />
        </div>
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide sm:tracking-wider text-emerald-300 dark:text-emerald-900 mb-1.5 sm:mb-2">Total Estimated Investment</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xs sm:text-sm font-black text-emerald-500 dark:text-emerald-950 italic">₹</span>
          <p className="text-2xl sm:text-3xl font-black tabular-nums tracking-tighter transition-all duration-300 group-hover:tracking-normal">
            {plan?.total_cost?.toLocaleString() || '0'}
          </p>
        </div>
      </div>
    </div>

    {isCompleted && (
      <div className="mt-4 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-md sm:rounded-md text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">Treatment Finalized</span>
        </div>
        <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70">This clinical record is permanently sealed.</p>
      </div>
    )}

  </div>

)

/* ═══════════════════════════════════════════════════════════════════
 MAIN COMPONENT
 ═══════════════════════════════════════════════════════════════════ */
const SecureChat = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show sidebar on desktop by default
  useEffect(() => {
    const checkWidth = () => setShowInfoSidebar(window.innerWidth >= 1280)
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  /* ── init ── */
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
            getTreatmentPlan({ request_id: requestId })
          ])
          if (msgRes.status === 'success') {
            setMessages(msgRes.data)
            setTimeout(() => scrollBottom(true), 150)
          }


          let finalPlan = planRes.status === 'success' ? planRes.data : null
          // In dentist side, `plan` endpoint already returns `patient_name`.
          if (finalPlan) setPlan(finalPlan)

        }
      } catch {
        toast.error('Clinical channel failed to sync')
      } finally {
        setIsLoading(false)
      }
    }
    if (requestId) init()
  }, [requestId, scrollBottom])

  /* ── polling ── */
  useEffect(() => {
    if (!chatId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await getMessages(chatId)
        if (res.status === 'success') {
          if (res.is_active !== undefined) setIsChatActive(res.is_active === 1);
          setMessages(prev => {
            // Only update if server has more messages (prev includes optimistic)
            if (res.data.length > prev.length) {
              setTimeout(() => scrollBottom(), 50)
              return res.data
            }
            return prev
          })
        }
      } catch { /* silent */ }
    }, 3000) // Increased frequency for better clinical feel
    return () => clearInterval(pollRef.current)
  }, [chatId, scrollBottom])

  /* ── send ── */
  const handleSend = async (e) => {
    e.preventDefault()
    const txt = newMessage.trim()
    if (!txt || !chatId) return

    setNewMessage('')
    setIsSending(true)

    // Optimistic Update
    const tempId = Date.now()
    const temp = { id: tempId, sender_role: 'DENTIST', message: txt, sent_at: new Date().toISOString(), isPending: true }
    setMessages((p) => [...p, temp])
    setTimeout(() => scrollBottom(), 50)

    try {
      const res = await sendMessage({ chat_id: chatId, sender_role: 'DENTIST', message: txt })
      if (res.status === 'success') {
        // Refresh with guard: Only overwrite if server actually delivers the new record
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

  // A chat is read-only if it's archived or the treatment is completed.
  const isArchived = !isChatActive
  const isCompleted = plan?.request_status === 'COMPLETED' || plan?.plan_status === 'COMPLETED'
  const locked = isArchived || isCompleted

  /* ── group messages by date ── */
  const grouped = messages.reduce((acc, msg) => {
    const d = new Date(msg.sent_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc.length || acc[acc.length - 1].date !== d) {
      acc.push({ date: d, msgs: [msg] })
    } else {
      acc[acc.length - 1].msgs.push(msg)
    }
    return acc
  }, [])

  /* ── loading state ── */
  if (isLoading) {
    return (
      <div className="h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-4 sm:gap-6 px-4">
        <div className="relative">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-[3px] sm:border-4 border-emerald-100 dark:border-emerald-900/30 rounded-md animate-spin border-t-emerald-600 dark:border-t-emerald-400" />
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide sm:tracking-wide mb-1">Authenticating Node</p>
          <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bridging Clinical Network...</p>
        </div>

      </div>
    )
  }


  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black font-sans overflow-hidden transition-colors duration-500">
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex overflow-hidden relative h-screen"
      >

        {/* ═══ DESKTOP SIDEBAR (Left) ═══ */}
        {!isMobile && (
          <AnimatePresence>
            {showInfoSidebar && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden shrink-0 z-30 bg-white dark:bg-black"
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

          {/* ── DYNAMIC CLINICAL CANVAS ── */}
          <div className="absolute inset-0 bg-[grid_#e2e8f0_24px_24px] dark:bg-[grid_#18181b_24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-100 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

          <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 h-18 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-4 py-4">

              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[min(85vw,380px)] bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
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
                  className="hidden md:flex rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                >
                  {showInfoSidebar ? <PanelLeftClose className="w-5 h-5 text-zinc-500" /> : <PanelLeft className="w-5 h-5 text-zinc-500" />}
                </Button>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-md items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm active:scale-95 shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>


                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative group shrink-0 hidden sm:block">
                    <div className="absolute inset-0 bg-emerald-500 rounded-md blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="w-11 h-11 bg-emerald-600 dark:bg-emerald-500 rounded-md flex items-center justify-center text-white text-[15px] font-black relative z-10 shadow-lg dark:shadow-emerald-500/10 ring-2 ring-white dark:ring-zinc-800">
                      {plan?.patient_name?.[0] || 'P'}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 rounded-md z-20 shadow-[0_0_8px_currentColor] ${isCompleted ? 'bg-emerald-400 text-emerald-400' :
                      isArchived ? 'bg-zinc-600 text-zinc-600' :
                        'bg-emerald-500 text-emerald-500'
                      }`} />
                  </div>

                  <div className="block min-w-0">
                    <h1 className="text-[14px] font-black text-zinc-900 dark:text-white tracking-tighter leading-none uppercase truncate">
                      {plan?.patient_name || 'Verified Patient'}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase leading-none">Finalized Phase</span>
                      ) : isArchived ? (
                        <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase leading-none">Archived Record</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase flex items-center gap-1 leading-none">
                          <ShieldCheck className="w-3 h-3" /> Encrypted Tunnel
                        </span>
                      )}
                    </div>
                  </div>
                </div>


              </div>
            </div>

            <div className="flex items-center gap-3">
            </div>
          </header>

          {/* ═══ MESSAGES PANEL ═══ */}
          <div
            ref={scrollParentRef}
            className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-10 py-4 md:py-10 space-y-3 sm:space-y-4 md:space-y-6 scroll-smooth custom-scrollbar relative z-10 min-h-0"
          >
            <div className="max-w-4xl mx-auto w-full">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-emerald-500 rounded-md blur-3xl opacity-10 animate-pulse" />
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-md flex items-center justify-center relative z-10 border border-zinc-100 dark:border-zinc-800 shadow-lg shadow-zinc-200/50 dark:shadow-black/50">
                      <Lock className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                    </div>
                  </div>

                  <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">Private Clinical Entry</h2>
                  <p className="text-[12px] text-zinc-400 dark:text-zinc-500 max-w-sm leading-relaxed font-bold uppercase tracking-widest">
                    This is the start of your secure medical consultation. All data shared here is clinically protected.
                  </p>
                </motion.div>
              )}


              {grouped.map((group, gi) => (
                <div key={gi} className="space-y-3 sm:space-y-4 md:space-y-6">
                  <DateSep date={group.date} />
                  <div className="space-y-3 sm:space-y-4 md:space-y-6">
                    {group.msgs.map((msg, mi) => {
                      const isMe = msg.sender_role === 'DENTIST'
                      const prev = group.msgs[mi - 1]
                      const showAvatar = !prev || prev.sender_role !== msg.sender_role
                      return <ChatBubble key={msg.id || mi} msg={msg} isMe={isMe} showAvatar={showAvatar} />
                    })}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start mb-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-6 h-6 rounded-md bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Decryption Stream</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 px-5 py-3.5 rounded-md rounded-tl-md border border-zinc-100 dark:border-zinc-800 flex gap-1.5 shadow-md items-center">
                      <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-emerald-100 dark:bg-emerald-900 rounded-md" />
                      <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-md" />
                      <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-emerald-100 dark:bg-emerald-900 rounded-md" />
                    </div>

                  </div>
                </div>
              )}


              <div />
            </div>
          </div>

          {/* ═══ COMPOSER AREA ═══ */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black px-4 py-4 shrink-0 shadow-sm z-20">
            <div className="max-w-4xl mx-auto">
              {!locked && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 px-1">
                </div>
              )}

              {locked ? (
                <div className="flex flex-col items-center justify-center gap-3 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-md p-6 sm:p-8 border border-zinc-200/60 dark:border-zinc-800/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      {isCompleted ? 'Clinical Record Sealed' : 'Channel Archived'}
                    </span>
                  </div>

                  {isCompleted ? (
                    <div className="text-center">
                      <p className="text-[10px] sm:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Finalized Clinical Phase</p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-tight opacity-70">This session has been transitioned to permanent medical records.</p>
                    </div>

                  ) : (
                    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                      <p className="text-[10px] filter grayscale opacity-70 font-bold text-zinc-400 uppercase tracking-tight text-center leading-relaxed">
                        This secure clinical channel has been archived and is temporarily offline.
                      </p>
                    </div>
                  )}
                </div>
              ) : (

                <form onSubmit={handleSend} className="flex items-center gap-3 group">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type clinical guidance…"
                      className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-4 pr-12 text-[13px] sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-white dark:focus:bg-zinc-800 transition-all duration-300 placeholder:text-zinc-400"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1" ref={emojiRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-300 ${showEmojiPicker ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:scale-110'}`}
                      >
                        <Smile className="w-4.5 h-4.5" />
                      </button>
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full right-0 mb-3 sm:mb-4 z-[100] shadow-lg border border-zinc-100 dark:border-zinc-800 rounded-md sm:rounded-[20px] overflow-hidden"
                          >
                            <EmojiPicker
                              onEmojiClick={onEmojiClick}
                              autoFocusSearch={false}
                              theme={EmojiTheme.AUTO}
                              width={280}
                              height={350}
                              previewConfig={{ showPreview: false }}
                              skinTonesDisabled
                              searchPlaceHolder="Search emojis..."
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white dark:text-black disabled:text-zinc-400 rounded-md flex items-center justify-center transition-all duration-300 shadow-md shadow-emerald-500/25 dark:shadow-emerald-500/10 disabled:shadow-none active:scale-95 shrink-0"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
