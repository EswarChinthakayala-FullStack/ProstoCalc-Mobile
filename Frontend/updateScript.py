import sys

file_path = r'e:\ProstoCalcWeb\Frontend\src\pages\dentist\consultation\SecureChat.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make imports changes
content = content.replace('  Archive\n} from \'lucide-react\'', '  Archive,\n  PanelLeft,\n  PanelLeftClose,\n  Menu\n} from \'lucide-react\'')
content = content.replace('import { useAuth } from \'@/context/AuthContext\'', 'import { useAuth } from \'@/context/AuthContext\'\nimport { useIsMobile } from \'@/hooks/use-mobile\'\nimport {\n  Sheet,\n  SheetContent,\n  SheetTrigger,\n} from \'@/components/ui/sheet\'\nimport { Button } from \'@/components/ui/button\'')

content = content.replace('  const { user } = useAuth()\n  const navigate = useNavigate()\n\n  const [chatId, setChatId]', '  const { user } = useAuth()\n  const navigate = useNavigate()\n  const isMobile = useIsMobile()\n\n  const [chatId, setChatId]')

new_return = '''  return (
    <div className="h-[100dvh] bg-[#F8FAFC] flex overflow-hidden font-sans selection:bg-teal-100/50 selection:text-teal-900">
      
      {/* ═══ DESKTOP SIDEBAR (Left) ═══ */}
      {!isMobile && (
        <AnimatePresence>
          {showInfoSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0 z-30 bg-white"
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

      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] relative overflow-hidden">
        
        {/* ── DYNAMIC CLINICAL CANVAS ── */}
        <div className="absolute inset-0 bg-[grid_#e2e8f0_24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-100 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 h-18 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4 py-4">
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden rounded-md bg-slate-50 border border-slate-100 shadow-sm">
                    <Menu className="w-5 h-5 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[min(85vw,380px)]">
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
                className="hidden md:flex rounded-md bg-slate-50 border border-slate-100 shadow-sm hover:bg-white hover:border-teal-200 transition-all"
              >
                {showInfoSidebar ? <PanelLeftClose className="w-5 h-5 text-slate-500" /> : <PanelLeft className="w-5 h-5 text-slate-500" />}
              </Button>
            )}

            {/* Back button and profile */}
            <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-slate-200 rounded-md sm:rounded-md flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-all duration-300 shadow-sm active:scale-90 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 min-w-0">
                <div className="relative group shrink-0 hidden sm:block">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-[#0f172a] to-[#334155] rounded-md sm:rounded-md flex items-center justify-center text-white text-xs font-black shadow-xl shadow-teal-900/10 ring-2 ring-white">
                    {plan?.patient_name?.[0] || 'P'}
                  </div>
                </div>

                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 leading-none mb-1 sm:mb-1.5 tracking-tight flex items-center gap-1.5 sm:gap-2">
                    <span className="truncate">{plan?.patient_name || 'Verified Patient'}</span>
                  </h1>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {isCompleted ? (
                      <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-[8px] sm:text-[9px] font-black text-emerald-600 tracking-tight uppercase">Finalized</span>
                      </div>
                    ) : isArchived ? (
                      <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200/50">
                        <Lock className="w-2 h-2 text-slate-400" />
                        <span className="text-[8px] sm:text-[9px] font-black text-slate-400 tracking-tight uppercase">Archived</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-teal-50 rounded-md sm:rounded-md border border-teal-100/50">
                        <ShieldCheck className="w-2.5 h-2.5 text-teal-600" />
                        <span className="text-[8px] sm:text-[9px] font-black text-teal-600 tracking-tight uppercase">Encrypted</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
                   <div className="absolute inset-0 bg-teal-500 rounded-md blur-3xl opacity-10 animate-pulse" />
                   <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center relative z-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
                     <Lock className="w-10 h-10 text-teal-500" />
                   </div>
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Private Clinical Entry</h2>
                <p className="text-[12px] text-slate-400 max-w-sm leading-relaxed font-bold uppercase tracking-widest">
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
                     <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center shadow-sm">
                       <Sparkles className="w-3.5 h-3.5 text-white" />
                     </div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decryption Stream</span>
                   </div>
                   <div className="bg-white px-5 py-3.5 rounded-md rounded-tl-md border border-slate-100 flex gap-1.5 shadow-xl shadow-slate-200/20 items-center">
                     <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-teal-200 rounded-md" />
                     <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-teal-500 rounded-md" />
                     <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-teal-200 rounded-md" />
                   </div>
                 </div>
              </div>
            )}
            
            <div />
          </div>
        </div>

        {/* ═══ COMPOSER AREA ═══ */}
        <div className="border-t border-slate-100 bg-white px-4 py-4 shrink-0 shadow-sm z-20">
          <div className="max-w-4xl mx-auto">
            {!locked && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 px-1">
                <button onClick={() => setNewMessage('Please follow the prescribed hygiene protocol for rapid recovery.')} className="shrink-0 px-3 md:px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-teal-600 hover:text-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 transition-all shadow-sm flex items-center gap-2 group cursor-pointer">
                  <Zap className="w-3.5 h-3.5 text-teal-500 group-hover:text-white" /> Prescribe Hygiene
                </button>
                <button onClick={() => setNewMessage('Your next clinical session is scheduled. Please bring your post-op reports.')} className="shrink-0 px-3 md:px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-teal-600 hover:text-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 transition-all shadow-sm flex items-center gap-2 group cursor-pointer">
                  <Clock className="w-3.5 h-3.5 text-teal-500 group-hover:text-white" /> Confirm Session
                </button>
                <button onClick={() => setNewMessage('I have reviewed your progress. Continue the current medication as prescribed.')} className="shrink-0 px-3 md:px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-teal-600 hover:text-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 transition-all shadow-sm flex items-center gap-2 group cursor-pointer">
                  <ClipboardCheck className="w-3.5 h-3.5 text-teal-500 group-hover:text-white" /> Clinical Review
                </button>
              </div>
            )}

            {locked ? (
              <div className="flex flex-col items-center justify-center gap-3 bg-slate-50/80 backdrop-blur-sm rounded-[32px] p-6 sm:p-8 border border-slate-200/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow-sm border border-slate-100">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                    {isCompleted ? 'Clinical Record Sealed' : 'Channel Archived'}
                  </span>
                </div>
                
                {isCompleted ? (
                  <div className="text-center">
                    <p className="text-[10px] sm:text-[11px] font-black text-teal-600 uppercase tracking-[0.15em] mb-1">Finalized Clinical Phase</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight opacity-70">This session has been transitioned to permanent medical records.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                    <p className="text-[10px] filter grayscale opacity-70 font-bold text-slate-400 uppercase tracking-tight text-center leading-relaxed">
                      This secure clinical channel has been archived and is temporarily offline.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="px-8 py-3 bg-[#134e4a] hover:bg-teal-900 text-white rounded-md text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-900/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Unlock Clinical Channel
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogMedia variant="success" />
                          <AlertDialogTitle>Restore Communication?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will restore the active clinical link. You and the patient will be able to exchange messages once more.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleUnarchive}>Confirm Restore</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-md px-4 pr-12 text-[13px] sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500/20 focus:bg-white transition-all duration-300 placeholder:text-slate-400"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1" ref={emojiRef}>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-300 ${showEmojiPicker ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-teal-500 hover:scale-110'}`}
                    >
                      <Smile className="w-4.5 h-4.5" />
                    </button>
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full right-0 mb-3 sm:mb-4 z-[100] shadow-2xl border border-slate-100 rounded-md sm:rounded-[20px] overflow-hidden"
                        >
                          <EmojiPicker 
                            onEmojiClick={onEmojiClick}
                            autoFocusSearch={false}
                            theme={EmojiTheme.LIGHT}
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
                  className="w-12 h-12 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-md flex items-center justify-center transition-all duration-300 shadow-md shadow-teal-500/25 disabled:shadow-none active:scale-95 shrink-0"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )'''

# Locate the return segment to replace
return_start = content.find('  return (\n    <div className="h-screen')

if return_start != -1:
    content = content[:return_start] + new_return + '\n}\n\nexport default SecureChat\n'
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced return block.")
else:
    print("Could not find return block.")
