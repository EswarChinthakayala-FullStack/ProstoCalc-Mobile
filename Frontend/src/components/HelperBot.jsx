import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageCircle, X, Send, Navigation, Info, Briefcase, User, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PROJECT_CONTEXT } from '@/constants/helper_knowledge';
import api from '@/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Global AI Helper Bot
 * Provides project information and quick navigation shortcuts.
 */
const HelperBot = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const DEFAULT_MSG = [
        { role: 'assistant', content: "Hello! I'm Prosto AI Helper. I can guide you through the project features, explain our AI clinical models, or help you navigate to specific pages. How can I assist you today?" }
    ];

    // 1. PERSISTENT MEMORY: Load from localStorage or use default
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('prosto_helper_memory');
        return saved ? JSON.parse(saved) : DEFAULT_MSG;
    });

    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // 2. PERSISTENT MEMORY: Save to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem('prosto_helper_memory', JSON.stringify(messages));
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputValue('');
        setIsTyping(true);

        try {
            // Send both query and user role for proper navigation context
            const res = await api.post('/web/explain_cost_ai', {
                userPrompt: inputValue,
                role: user?.role || 'Guest'
            });

            const rawContent = res.data?.data?.explanation || "I'm having trouble connecting to the brain. Please try again.";

            // Handle Navigation Injection
            let finalContent = rawContent;
            const navMatch = rawContent.match(/\[NAV:\s*(.+?)\]/);

            if (navMatch) {
                const targetPath = navMatch[1].trim();
                finalContent = rawContent.replace(navMatch[0], "").trim();

                // Add a small delay for the redirection effect
                setTimeout(() => {
                    navigate(targetPath);
                    setIsOpen(false);
                }, 1500);

                finalContent += `\n\nRedirecting you to ${targetPath}...`;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);

        } catch (error) {
            console.error("Helper Bot Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered a clinical data sync error. Please try again!" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const clearChat = () => {
        setMessages(DEFAULT_MSG);
        localStorage.removeItem('prosto_helper_memory');
    };

    const constraintsRef = useRef(null);
    const dragControls = useDragControls();

    return (
        <>
            {/* Constraints Container for Dragging - Extended to cover more area */}
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9998]" />

            <motion.div 
                className="fixed z-[9999] pointer-events-auto flex flex-col items-end"
                drag
                dragControls={dragControls}
                dragListener={false} // Disable default listener to use specific handles
                dragConstraints={constraintsRef}
                dragMomentum={false}
                layout // Use layout for smooth transitions
                initial={{ x: 0, y: 0 }}
                animate={{ x: 0, y: 0 }}
                style={{ 
                    bottom: '24px', 
                    right: '24px',
                }}
            >
                <AnimatePresence mode="wait">
                    {isOpen && (
                        <motion.div
                            key="chat-window"
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="mb-4 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col cursor-auto origin-bottom-right"
                            style={{ maxHeight: '500px' }}
                            onPointerDown={e => e.stopPropagation()} 
                        >
                            {/* Header - Specific Drag Area */}
                            <div 
                                className="bg-emerald-600 p-4 text-white flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-md">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Prosto AI Helper</h3>
                                        <p className="text-[10px] text-emerald-100 opacity-80 uppercase tracking-widest font-black">Clinical Agent</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); clearChat(); }}
                                        className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/80 hover:text-white"
                                        title="Clear History"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                        className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Window */}
                            <div
                                ref={scrollRef}
                                className="flex-1 p-4 space-y-4 overflow-y-auto scroll-smooth bg-zinc-50/50 dark:bg-zinc-950/20"
                                style={{ height: '350px' }}
                            >
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`
                                            max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-sm
                                            ${m.role === 'user'
                                                ? 'bg-emerald-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700 rounded-bl-none'}
                                        `}>
                                            {m.role === 'assistant' ? (
                                                <div className="prose prose-zinc prose-xs dark:prose-invert leading-relaxed">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                                </div>
                                            ) : m.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-md rounded-bl-none px-4 py-3 text-xs shadow-sm flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Ask for help..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        onPointerDown={e => e.stopPropagation()} 
                                        className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-md py-3 pl-4 pr-12 text-xs border-none focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-zinc-400"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isTyping}
                                        className="absolute right-1.5 p-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bubble Toggle - Handle for Dragging when collapsed */}
                <motion.button
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onPointerDown={(e) => dragControls.start(e)}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-grab active:cursor-grabbing select-none
                        ${isOpen ? 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 rotate-90 border border-zinc-200 dark:border-zinc-700' : 'bg-emerald-600 text-white border-2 border-white/20'}
                    `}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                                <X size={24} />
                            </motion.div>
                        ) : (
                            <motion.div key="msg" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                                <MessageCircle size={28} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-lg"
                        />
                    )}
                </motion.button>
            </motion.div>
        </>
    );
};

export default HelperBot;
