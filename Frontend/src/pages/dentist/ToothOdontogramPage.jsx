import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Info,
  HelpCircle,
  Activity,
  ShieldCheck,
  Stethoscope,
  BrainCircuit,
  Sparkles,
  Loader2,
  Bell,
  Search,
  Target,
  ChevronRight,
  LifeBuoy,
  Sun, Moon
} from 'lucide-react';
import anatomyData from '@/data/teethData.json';
import { explainCostPuter } from '@/services/api';
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar';
import { useSidebar } from '@/context/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NotificationBell from '@/components/NotificationBell';
import { useTheme } from '@/context/ThemeContext';

const teethData = anatomyData.individual_tooth_data;

// Math logic for the arch layout
const calculateTransform = (index, isUpper) => {
  const mid = 7.5;
  const xDist = 32;
  const yDepth = 80;

  const archFactor = Math.pow((index - mid), 2);
  let y = isUpper ? (archFactor * 2) - yDepth : -(archFactor * 2) + yDepth;

  const finalX = (index - mid) * xDist;
  const angleDeg = (index - mid) * (isUpper ? 5 : -5);

  return { x: finalX, y: y, rotate: angleDeg };
};

const getQuadrantColor = (id) => {
  if (id >= 1 && id <= 8) return '#0D9488'; // Teal (UR) - primary theme
  if (id >= 9 && id <= 16) return '#6366F1'; // Indigo (UL)
  if (id >= 17 && id <= 24) return '#F59E0B'; // Amber (LR)
  if (id >= 25 && id <= 32) return '#EC4899'; // Pink (LL)
  return '#14B8A6';
};

// Subcomponent: The realistic tooth shape
const ToothShape = ({ type, isSelected, color }) => {
  const w = type === 'Molar' ? 32 : type === 'Bicuspid' ? 26 : type === 'Cuspid' ? 22 : 20;
  const h = type === 'Molar' ? 28 : type === 'Bicuspid' ? 26 : type === 'Cuspid' ? 28 : 26;

  let pathData = "";
  if (type === "Molar") {
    pathData = `M 4 0 L ${w - 4} 0 Q ${w} 0 ${w} 4 L ${w} ${h - 4} Q ${w} ${h} ${w - 4} ${h} L 4 ${h} Q 0 ${h} 0 ${h - 4} L 0 4 Q 0 0 4 0 Z`;
  } else if (type === "Bicuspid") {
    pathData = `M ${w / 2} 0 A ${w / 2} ${h / 2} 0 1 1 ${w / 2} ${h} A ${w / 2} ${h / 2} 0 1 1 ${w / 2} 0 Z`;
  } else if (type === "Cuspid") {
    pathData = `M ${w / 2} 0 Q ${w} ${h * 0.2} ${w} ${h} L 0 ${h} Q 0 ${h * 0.2} ${w / 2} 0 Z`;
  } else {
    // Incisor
    pathData = `M 2 0 L ${w - 2} 0 Q ${w} 0 ${w} 2 L ${w} ${h - 2} Q ${w} ${h} ${w - 2} ${h} L 2 ${h} Q 0 ${h} 0 ${h - 2} L 0 2 Q 0 0 2 0 Z`;
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="drop-shadow-sm transition-transform duration-300">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isSelected ? color : 'var(--tooth-bg-start)'} />
          <stop offset="100%" stopColor={isSelected ? `${color}80` : 'var(--tooth-bg-end)'} />
        </linearGradient>
        <radialGradient id={`glow-${color}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--tooth-glow)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--tooth-glow)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d={pathData}
        fill={`url(#grad-${color})`}
        stroke={isSelected ? color : 'var(--tooth-border)'}
        strokeWidth={isSelected ? "2" : "1.5"}
        strokeLinejoin="round"
      />

      <path
        d={pathData}
        fill={`url(#glow-${color})`}
        opacity={0.4}
      />

      {(type === "Molar" || type === "Bicuspid") && (
        <>
          <path
            d={`M ${w * 0.25} ${h * 0.35} L ${w * 0.75} ${h * 0.65} M ${w * 0.75} ${h * 0.35} L ${w * 0.25} ${h * 0.65} ${type === 'Molar' ? `M ${w * 0.5} ${h * 0.25} L ${w * 0.5} ${h * 0.75} M ${w * 0.25} ${h * 0.5} L ${w * 0.75} ${h * 0.5}` : ''}`}
            stroke={isSelected ? "rgba(255,255,255,0.4)" : "rgba(148,163,184,0.3)"}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}

      {type === "Cuspid" && (
        <circle cx={w / 2} cy={h / 2} r="3" fill={isSelected ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,1)"} filter="blur(1px)" />
      )}
    </svg>
  );
};

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim() || !text) return <span>{text || ""}</span>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-teal-100 dark:bg-teal-900/30 text-teal-900 dark:text-teal-400 rounded-[2px] px-0.5 font-bold no-underline inline-block leading-tight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

const ToothNode = ({ tooth, isSelected, isDimmed, onClick, onHover }) => {
  const isUpper = tooth.id <= 16;
  const index = (tooth.id - 1) % 16;
  const { x, y, rotate } = calculateTransform(index, isUpper);
  const color = getQuadrantColor(tooth.id);

  const bubbleY = isUpper ? -45 : 45;
  const bubbleX = (index - 7.5) * 3;

  return (
    <div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotate}deg)`,
        zIndex: isSelected ? 50 : 10
      }}
    >
      <motion.button
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => { e.stopPropagation(); onClick(tooth); }}
        onMouseEnter={() => onHover && onHover(tooth)}
        onMouseLeave={() => onHover && onHover(null)}
        className={`focus:outline-none flex flex-col items-center justify-center group relative cursor-pointer p-2 -m-2 ${isDimmed ? 'opacity-20 grayscale transition-all' : 'opacity-100 grayscale-0 transition-all'}`}
      >
        {isUpper && (
          <motion.div
            initial={false}
            animate={{ y: bubbleY, x: bubbleX, scale: isSelected ? 1.2 : 1 }}
            className="absolute z-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shadow-sm transition-colors border"
              style={{
                backgroundColor: isSelected ? color : `var(--tooth-label-bg)`,
                color: isSelected ? 'white' : color,
                borderColor: isSelected ? color : `${color}30`
              }}>
              {tooth.id}
            </div>
          </motion.div>
        )}

        <div className={`relative z-10 transition-all duration-300 ${isSelected ? 'scale-125 z-20 drop-shadow-lg' : 'scale-100 group-hover:scale-110 drop-shadow-md'} `}>
          <ToothShape type={tooth.type} isSelected={isSelected} color={color} isUpper={isUpper} />
        </div>

        {!isUpper && (
          <motion.div
            initial={false}
            animate={{ y: bubbleY, x: bubbleX, scale: isSelected ? 1.2 : 1 }}
            className="absolute z-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shadow-sm transition-colors border"
              style={{
                backgroundColor: isSelected ? color : `var(--tooth-label-bg)`,
                color: isSelected ? 'white' : color,
                borderColor: isSelected ? color : `${color}30`
              }}>
              {tooth.id}
            </div>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

/* ─── Inject Theme Variables ─── */
const ThemeStyles = () => (
  <style>{`
    .dark {
      --tooth-bg-start: #18181b;
      --tooth-bg-end: #09090b;
      --tooth-border: #27272a;
      --tooth-glow: #ffffff10;
      --tooth-label-bg: #09090b;
    }
    :root:not(.dark) {
      --tooth-bg-start: #ffffff;
      --tooth-bg-end: #f1f5f9;
      --tooth-border: #cbd5e1;
      --tooth-glow: #ffffff;
      --tooth-label-bg: #ffffff;
    }
  `}</style>
);

export default function ToothOdontogramPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const isDesktop = useMediaQuery('(min-width: 1280px)');

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [hoveredTooth, setHoveredTooth] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileTab, setMobileTab] = useState('chart'); // 'chart' or 'details'
  const { theme, toggleTheme } = useTheme();

  // AI States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

  const activeTooth = hoveredTooth || selectedTooth;

  const upperTeeth = teethData.slice(0, 16);
  const lowerTeeth = teethData.slice(16, 32);

  const handleSelectTooth = (tooth) => {
    setSelectedTooth(tooth);
    setAiExplanation('');
    if (window.innerWidth < 1024) {
      setMobileTab('details');
    }
  };

  const handleExplainWithAI = async () => {
    if (!activeTooth) return;

    setIsAiLoading(true);
    setAiExplanation('');

    try {
      const prompt = `You are a specialized dental AI assistant. Provide a sophisticated, clinical precision 2-sentence explanation of Tooth #${activeTooth.id} (${activeTooth.name}). Highlight its specific anatomical role and one expert-level clinical vector to monitor. Content must be under 40 words and strictly professional.`;

      const result = await explainCostPuter(prompt);

      if (result && result.data && result.data.explanation) {
        let text = result.data.explanation;
        if (typeof text === 'object') text = text.content || text.message?.content || text.message;
        setAiExplanation(text);
      } else {
        setAiExplanation("Intelligence synthesis failed. Data node unreachable.");
      }
    } catch (error) {
      setAiExplanation("Telemetry error: Puter AI logic disrupted.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black font-sans overflow-hidden transition-colors duration-500">
      <ThemeStyles />
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0,
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden"
      >
        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
              {/* Left: Project Branding */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <button
                  onClick={() => navigate(-1)}
                  className="hidden xl:flex w-9 h-9 bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-md items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-300 hover:border-teal-200 dark:hover:border-zinc-700 transition-all active:scale-95 shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">Diagnostic Odontogram</h1>
                  <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1 hidden sm:block">Full Dentition Mapping</p>
                </div>
              </div>

              {/* Right: User telemetry */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden md:block w-48 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <Input
                    className="pl-9 h-10 bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 rounded-md text-xs font-medium focus:ring-teal-500 focus:border-teal-400 dark:text-zinc-100 dark:placeholder:text-zinc-700 transition-all"
                    placeholder="Search quadrants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <NotificationBell />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-slate-500 dark:text-zinc-400 hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-teal-50/50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-4.5 h-4.5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <Link to="/dentist/profile" className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-teal-50/30 transition-all cursor-pointer shrink-0">
                  <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-medium text-teal-600 dark:text-teal-400 mt-0.5">Clinician</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex border-t border-slate-100 dark:border-zinc-800 transition-colors">
              <button
                onClick={() => setMobileTab('chart')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest relative transition-all ${mobileTab === 'chart' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-500'}`}
              >
                Anatomy Map
                {mobileTab === 'chart' && <motion.div layoutId="m-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-teal-500 dark:bg-teal-400" />}
              </button>
              <button
                onClick={() => setMobileTab('details')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest relative transition-all ${mobileTab === 'details' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-zinc-500'}`}
              >
                Tooth Details
                {mobileTab === 'details' && <motion.div layoutId="m-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-teal-500 dark:bg-teal-400" />}
              </button>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main
          className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-4 lg:p-6 lg:gap-6 items-start lg:items-stretch overflow-y-auto min-h-0"
          onClick={() => setSelectedTooth(null)}
        >
          {/* Interaction Chart Panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex-1 w-full bg-white dark:bg-zinc-950/50 rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col relative min-h-[550px] lg:min-h-0 transition-all ${mobileTab === 'details' ? 'hidden lg:flex' : 'flex'}`}
          >
            <div className="absolute top-4 left-4 z-20 space-y-2 pointer-events-none">
              <div className="px-3 py-1.5 bg-slate-900 dark:bg-black text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-slate-800 dark:border-zinc-800">
                <div className="w-1.5 h-1.5 rounded-md bg-teal-400 animate-pulse" />
                Active Telemetry
              </div>
              <div className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm">
                Maxillary & Mandibular Arches
              </div>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-4">
              <div className="relative flex-1 w-full h-full flex items-center justify-center">
                <div className="absolute min-w-[340px] scale-[0.6] sm:scale-75 md:scale-90 lg:scale-[0.8] xl:scale-100 origin-center transition-transform duration-700 ease-out flex flex-col items-center justify-center">

                  {/* Decorative Arch Rings */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-md border border-slate-100/50 dark:border-zinc-900/30 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-md border border-dashed border-slate-100/80 dark:border-zinc-800/20 pointer-events-none" />

                  {/* Center Focused Tooth Render */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30 pointer-events-none">
                    <AnimatePresence mode="wait">
                      {activeTooth && (
                        <motion.div
                          key={activeTooth.id}
                          initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
                          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
                          className="flex flex-col items-center"
                        >
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-6 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl rounded-md flex items-center justify-center border border-white dark:border-zinc-800 shadow-2xl ring-8 ring-slate-50/50 dark:ring-black/40">
                            <div className="drop-shadow-2xl" style={{ transform: 'scale(3)', transformOrigin: 'center' }}>
                              <ToothShape type={activeTooth.type} isSelected={true} color={getQuadrantColor(activeTooth.id)} />
                            </div>
                          </div>
                          <div className="bg-slate-900 dark:bg-black px-6 py-2.5 rounded-md shadow-xl border border-slate-800 dark:border-zinc-800 text-center flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: getQuadrantColor(activeTooth.id) }}>Tooth ID-{activeTooth.id}</span>
                            <span className="text-sm font-bold text-white leading-none whitespace-nowrap">{activeTooth.name}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Upper Arch */}
                  <div className="relative w-full h-[250px] flex items-end justify-center">
                    {upperTeeth.map(tooth => {
                      const isMatch = !searchTerm.trim() ||
                        tooth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tooth.id.toString().includes(searchTerm);
                      return (
                        <ToothNode
                          key={tooth.id}
                          tooth={tooth}
                          isSelected={selectedTooth?.id === tooth.id}
                          isDimmed={!isMatch}
                          onClick={handleSelectTooth}
                          onHover={setHoveredTooth}
                        />
                      );
                    })}
                  </div>

                  {/* Horizontal Pulse Line */}
                  <div className="w-[400px] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-zinc-800 to-transparent my-10 relative">
                    <div className="absolute inset-0 bg-teal-500/10 blur-md" />
                  </div>

                  {/* Lower Arch */}
                  <div className="relative w-full h-[250px] flex items-start justify-center">
                    {lowerTeeth.map(tooth => {
                      const isMatch = !searchTerm.trim() ||
                        tooth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tooth.id.toString().includes(searchTerm);
                      return (
                        <ToothNode
                          key={tooth.id}
                          tooth={tooth}
                          isSelected={selectedTooth?.id === tooth.id}
                          isDimmed={!isMatch}
                          onClick={handleSelectTooth}
                          onHover={setHoveredTooth}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Intelligence Panel */}
          <aside
            onClick={(e) => e.stopPropagation()}
            className={`w-full lg:w-[420px] xl:w-[480px] shrink-0 h-full flex flex-col transition-all ${mobileTab === 'chart' ? 'hidden lg:flex' : 'flex'}`}
          >
            <AnimatePresence mode="wait">
              {activeTooth ? (
                <motion.div
                  key={activeTooth.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-md p-6 lg:p-8 flex flex-col relative overflow-hidden h-full"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-md opacity-10 -mr-12 -mt-12" style={{ backgroundColor: getQuadrantColor(activeTooth.id) }} />
                  <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: getQuadrantColor(activeTooth.id) }} />

                  <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-md flex items-center justify-center shadow-inner border relative overflow-hidden shrink-0" style={{ backgroundColor: `${getQuadrantColor(activeTooth.id)}15`, borderColor: `${getQuadrantColor(activeTooth.id)}40` }}>
                      <span className="text-3xl font-black" style={{ color: getQuadrantColor(activeTooth.id) }}>{activeTooth.id}</span>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-tight mb-1">
                        <HighlightText text={activeTooth.name} highlight={searchTerm} />
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{activeTooth.type} Structural Node</span>
                        <div className="w-1 h-1 rounded-md bg-slate-300 dark:bg-zinc-800" />
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Active Scan</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 relative z-10 overflow-y-auto pr-2 no-scrollbar">
                    <div className="bg-slate-50/50 dark:bg-black/20 rounded-md p-5 border border-slate-100 dark:border-zinc-800 shadow-inner">
                      <p className="text-[13px] font-semibold text-slate-600 leading-relaxed mb-6">
                        {activeTooth.description}
                      </p>

                      <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                          <h4 className="flex items-center gap-2 text-[9px] font-black tracking-[0.15em] text-slate-400 uppercase">
                            <Activity className="w-3 h-3 text-teal-500" /> Physiological Role
                          </h4>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-300 leading-snug">{activeTooth.function}</p>
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="flex items-center gap-2 text-[9px] font-black tracking-[0.15em] text-amber-500 uppercase">
                            <ShieldCheck className="w-3 h-3" /> Clinical Precautionary
                          </h4>
                          <p className="text-[11px] font-bold text-amber-900/80 dark:text-amber-300 leading-snug">{activeTooth.precautions}</p>
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="flex items-center gap-2 text-[9px] font-black tracking-[0.15em] text-indigo-500 uppercase">
                            <BrainCircuit className="w-3 h-3" /> Structural Integrity
                          </h4>
                          <p className="text-[11px] font-bold text-indigo-900/80 dark:text-indigo-300 leading-snug">{activeTooth.dietary_advice}</p>
                        </div>
                      </div>
                    </div>

                    {selectedTooth && selectedTooth.id === activeTooth.id && (
                      <div className="pt-2">
                        {aiExplanation ? (
                          <div className="bg-slate-900 dark:bg-black text-white rounded-md p-5 shadow-2xl relative overflow-hidden group border border-slate-800 dark:border-zinc-800">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-3xl rounded-md" />
                            <h4 className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-teal-400 uppercase mb-3">
                              <Sparkles className="w-3.5 h-3.5" /> Prosto Intelligence
                            </h4>
                            <p className="text-[12px] font-bold text-slate-50 leading-relaxed relative z-10">
                              {aiExplanation}
                            </p>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Logic Source: Puter Engine</span>
                              <div className="flex gap-1">
                                <span className="w-1 h-1 bg-teal-500 rounded-md" />
                                <span className="w-1 h-1 bg-slate-700 rounded-md" />
                                <span className="w-1 h-1 bg-slate-700 rounded-md" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={handleExplainWithAI}
                            disabled={isAiLoading}
                            className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-md transition-all shadow-xl shadow-slate-900/10 dark:shadow-black/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed group border border-slate-800 dark:border-zinc-800"
                          >
                            {isAiLoading ? (
                              <><Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Synthesis in Progress...</>
                            ) : (
                              <><Sparkles className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" /> Sync Anatomy With AI</>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
                >
                  <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-md flex items-center justify-center mb-6 shadow-sm">
                    <Target className="w-8 h-8 text-slate-300 dark:text-zinc-700" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight mb-2">Initialize Node Selector</h2>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose max-w-[280px]">
                    Tap any dentition node on the interactive map to sync clinical intelligence.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </main>
      </motion.div>
    </div>
  );
}
