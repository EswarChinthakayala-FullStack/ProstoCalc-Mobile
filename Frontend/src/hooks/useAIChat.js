import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export const useAIChat = () => {
    const { user } = useAuth()
    const { sessionId: urlSessionId } = useParams()
    const [messages, setMessages] = useState([])
    const [sessions, setSessions] = useState([])
    const [activeSessionId, setActiveSessionId] = useState(urlSessionId || null)
    const [isTyping, setIsTyping] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [planContext, setPlanContext] = useState(null)
    const [isCreating, setIsCreating] = useState(false)

    // Load Plan Context
    const loadPlanContext = useCallback(async () => {
        if (!user || user.role !== 'patient') return
        try {
            const requestsRes = await api.get(`/get_consultation_requests?role=PATIENT&id=${user.id}`)
            const latestRequest = requestsRes.data?.data?.[0]
            if (latestRequest) {
                const planRes = await api.get(`/get_treatment_plan?request_id=${latestRequest.id}`)
                if (planRes.data?.status === 'success') {
                    setPlanContext(planRes.data.data)
                }
            }
        } catch (error) {
            console.error("Failed to load plan context:", error)
        }
    }, [user])

    // Load All Sessions
    const loadSessions = useCallback(async () => {
        if (!user) return
        try {
            const res = await api.get(`/ai_sessions?user_id=${user.id}&role=${user.role}`)
            if (res.data?.status === 'success') {
                setSessions(res.data.data || [])
            }
        } catch (error) {
            console.error("Failed to load sessions:", error)
        }
    }, [user])

    // Load Messages for a Session
    const loadSessionMessages = useCallback(async (sessionId) => {
        if (!user || !sessionId) return
        try {
            setIsLoading(true)
            const res = await api.get(`/ai_chat_history?user_id=${user.id}&role=${user.role}&session_id=${sessionId}`)
            if (res.data?.status === 'success') {
                const history = res.data.data.flatMap(item => [
                    { text: item.message, isBot: false, id: `u-${item.id}`, time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                    { text: item.response, isBot: true, id: `b-${item.id}`, time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                ])
                setMessages(history)
            }
        } catch (error) {
            console.error("Failed to load session messages:", error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    // Select a Session
    const selectSession = useCallback((sessionId) => {
        setActiveSessionId(sessionId)
        loadSessionMessages(sessionId)
    }, [loadSessionMessages])


    // Create New Chat Session
    const createNewSession = useCallback(async () => {
        if (!user || isCreating) return
        
        if (sessions.length >= 15) {
            toast.error("Protocol Capacity Reached. Please archive or delete existing chats to start a new session.", {
                description: "Maximum limit: 15 active protocols."
            })
            return null
        }

        // Check if an empty 'New Chat' already exists to prevent duplicates
        const emptySession = sessions.find(s => (s.title === 'New Chat' || s.title === 'Untitled Protocol') && !s.last_message)
        if (emptySession) {
            setActiveSessionId(emptySession.id)
            selectSession(emptySession.id)
            return emptySession.id
        }

        try {
            setIsCreating(true)
            const res = await api.post('/ai_sessions', { user_id: user.id, role: user.role })
            if (res.data?.status === 'success') {
                const newId = res.data.data.session_id
                setActiveSessionId(newId)
                setMessages([])
                await loadSessions()
                return newId
            }
        } catch (error) {
            toast.error("Failed to create new chat.")
        } finally {
            setIsCreating(false)
        }
        return null
    }, [user, sessions, loadSessions, selectSession, isCreating])

    // Delete Session
    const deleteSession = useCallback(async (sessionId) => {
        if (!user) return
        try {
            await api.post('/delete_session', { session_id: sessionId })
            if (activeSessionId === sessionId) {
                setActiveSessionId(null)
                setMessages([])
            }
            await loadSessions()
            toast.success("Chat deleted.")
        } catch (error) {
            toast.error("Failed to delete chat.")
        }
    }, [user, activeSessionId, loadSessions])

    // Rename Session
    const renameSession = useCallback(async (sessionId, newTitle) => {
        if (!user || !newTitle.trim()) return
        try {
            await api.post('/update_session_title', { session_id: sessionId, title: newTitle })
            await loadSessions()
            toast.success("Chat renamed.")
        } catch (error) {
            toast.error("Failed to rename chat.")
        }
    }, [user, loadSessions])

    // Clear History
    const clearHistory = useCallback(async () => {
        if (!user || !activeSessionId) return
        try {
            // Delete the session and recreate — no clear-only endpoint exists
            await api.post('/delete_session', { session_id: activeSessionId })
            setMessages([])
            // Create a new session to replace the cleared one
            const createRes = await api.post('/ai_sessions', { user_id: user.id, role: user.role })
            if (createRes.data?.status === 'success') {
                const newId = createRes.data.data.session_id
                setActiveSessionId(newId)
            }
            await loadSessions()
            toast.success("History purged.")
        } catch (error) {
            toast.error("Failed to clear history.")
        }
    }, [user, activeSessionId, loadSessions])

    // Delete All Sessions
    const deleteAllSessions = useCallback(async () => {
        if (!user) return
        try {
            // Delete each session individually — no bulk delete endpoint exists
            for (const session of sessions) {
                await api.post('/delete_session', { session_id: session.id })
            }
            setSessions([])
            setMessages([])
            setActiveSessionId(null)
            toast.success("All protocols purged.")
        } catch (error) {
            toast.error("Failed to clear sessions.")
        }
    }, [user, sessions])

    // Init: Load sessions, select latest or URL-matching session
    useEffect(() => {
        if (!user) return
        const init = async () => {
            setIsLoading(true)
            await loadPlanContext()
            const res = await api.get(`/ai_sessions?user_id=${user.id}&role=${user.role}`)
            const data = res.data?.data || []
            setSessions(data)
            
            if (data.length > 0) {
                // Prioritize session from URL if it exists in the data
                const targetId = urlSessionId || data[0].id
                const exists = data.find(s => s.id == targetId)
                
                const finalId = exists ? exists.id : data[0].id
                setActiveSessionId(finalId)
                await loadSessionMessages(finalId)
            } else {
                // Auto-create first session
                const createRes = await api.post('/ai_sessions', { user_id: user.id, role: user.role })
                if (createRes.data?.status === 'success') {
                    const newId = createRes.data.data.session_id
                    setActiveSessionId(newId)
                    setSessions([{ id: newId, title: 'New Chat', last_message: null }])
                }
            }
            setIsLoading(false)
        }
        init()
    }, [user]) // Only on user change/initial load

    // Send Message
    const sendMessage = async (text) => {
        if (!text.trim() || !user || !activeSessionId) return

        const userMsg = { 
            text, 
            isBot: false, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: Date.now()
        }
        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)

        try {
            let prompt = ""
            const isClinician = user.role === 'dentist'

            if (planContext) {
                const items = planContext.items || []
                const total = planContext.total_cost || 0
                const procedures = items.map(i => `- ${i.treatment_name || i.name} (Tooth #${i.tooth_number}): ₹${i.cost} [Estimate: ${i.sessions_estimate || 1} visit(s)]`).join("\n")

                if (isClinician) {
                    prompt = `PROFESSIONAL CONSULTATION (PROSTO AI)\nPROTOCOL:\n${procedures}\n\nTOTAL PROJECTED: ₹${total}\n\nCLINICIAN MESSAGE: ${text}\n\nTASK:\nProvide a professional clinical synthesis. Keep it concise (max 2 sentences). Always use ₹.`
                } else {
                    prompt = `PATIENT CASE FILE\nCONTENT:\n${procedures}\n\nTOTAL COST: ₹${total}\n\nPATIENT MESSAGE: ${text}\n\nTASK:\nExemplify professionalism and clarity. Explain the clinical purpose and value briefly (max 3 sentences). Always use ₹.`
                }
            } else {
                if (isClinician) {
                    prompt = `CLINICIAN INQUIRY: "${text}". Provide a professional, technical, and very concise medical/dental response. Response limit: 2 sentences. Currency: ₹.`
                } else {
                    prompt = `PATIENT INQUIRY: "${text}". Provide a meaningful, professional, and very concise clinical response. Response limit: 3 sentences. Currency: ₹.`
                }
            }

            const res = await api.post('/web/explain_cost_ai', { userPrompt: prompt })
            const explanation = res.data?.data?.explanation || "I'm processing your request. Please try again."

            const botMsg = {
                text: explanation,
                isBot: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                id: Date.now() + 1
            }
            setMessages(prev => [...prev, botMsg])

            // Save to database with session
            await api.post('/ai_chat_history', {
                user_id: user.id,
                role: user.role,
                message: text,
                response: explanation,
                session_id: activeSessionId
            })

            // Refresh sessions list to update title/preview
            await loadSessions()

        } catch (error) {
            console.error("AI Error:", error)
            toast.error("Failed to get AI response.")
        } finally {
            setIsTyping(false)
        }
    }

    return {
        messages,
        sessions,
        activeSessionId,
        isTyping,
        isLoading,
        sendMessage,
        selectSession,
        createNewSession,
        deleteSession,
        renameSession,
        clearHistory,
        deleteAllSessions,
        hasContext: !!planContext
    }
}
