import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { costEstimatorService } from '../../services/CostEstimatorService';
import { saveCostEstimation, getTreatmentCatalog, analyzeTreatmentCostAI, explainCostAI, explainCostPuter } from '../../services/api';
import {
  Calculator,
  BrainCircuit,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Bell,
  Settings,
  Sparkles,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  IndianRupee,
  Activity,
  LogOut,
  ChevronLeft,
  Layers,
  Search,
  Flame,
  Crown,
  Share2,
  Save,
  Loader2,
  User,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  Target,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import ClinicianSidebar, { MobileSidebarTrigger } from '@/components/ClinicianSidebar';
import { useSidebar } from '@/context/SidebarContext';
import NotificationBell from '@/components/NotificationBell';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim() || !text) return <span>{text || ""}</span>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi")
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-teal-100 dark:bg-teal-500/30 text-teal-900 dark:text-teal-100 rounded-[2px] px-0.5 font-bold no-underline inline-block leading-tight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

const MarkdownExplanation = ({ content }) => {
  let text = "";
  if (typeof content === 'string') {
    text = content;
  } else if (typeof content === 'object' && content !== null) {
    text = content.text || content.content || content.message || JSON.stringify(content);
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-600 dark:text-slate-400 text-sm">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-1 rounded">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1 text-slate-600 dark:text-slate-400 marker:text-teal-400">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1 text-slate-600 dark:text-slate-400 marker:text-teal-400">{children}</ol>,
          li: ({ children }) => <li className="text-sm pl-1">{children}</li>,
          h1: ({ children }) => <h3 className="text-sm font-black text-slate-800 dark:text-white mt-3 mb-1 uppercase tracking-widest border-l-2 border-teal-500 pl-2">{children}</h3>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════ */
const StatCard = ({ title, value, subtext, icon: Icon, accent, isCurrency = false, trend }) => {
  const accents = {
    teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-500/20', bar: 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-500/20', bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-500/20', bar: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-500/20', bar: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20', bar: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
  }
  const t = accents[accent] || accents.teal

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md p-5 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-black/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 group relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bar}`} />
      <div className="flex items-start justify-between mb-5">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110",
          t.bg, t.text, t.border
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-black px-2.5 py-1 rounded-md border shadow-sm uppercase tracking-widest",
            trend > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        {isCurrency && <span className="text-base font-bold text-slate-400 dark:text-zinc-600">₹</span>}
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</h3>
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">{title}</p>

      <div className="pt-4 border-t border-slate-50 dark:border-zinc-800">
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold flex items-center gap-2 truncate">
          <span className={cn("w-2 h-2 rounded-md opacity-50 shrink-0", t.bar)} />
          {subtext}
        </p>
      </div>
    </div>
  )
}

const PriceEstimatorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    treatmentType: 'Crown',
    teethCount: 1,
    sessions: 1,
    complexity: 'Medium',
    material: 'Standard',
    patientId: '',
    age: 35,
    hygiene: 7,
    urgency: 5
  });

  const [estimate, setEstimate] = useState(null);
  const [premiumAnalysis, setPremiumAnalysis] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [treatmentOptions, setTreatmentOptions] = useState(["Extraction", "Crown", "Implant", "CD", "RPD", "RCT", "FMR", "Scaling", "Filling"]);
  const [customPricelist, setCustomPricelist] = useState({});
  const [isLoadingPricelist, setIsLoadingPricelist] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const complexityOptions = ["Low", "Medium", "High"];
  const materialOptions = ["Standard", "Premium", "Biocompatible"];

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!user?.id) return;
      try {
        const response = await getTreatmentCatalog(user.id);
        const catalogData = response.data || response.catalog || [];
        if (catalogData.length > 0) {
          const newOptions = [];
          const newPricelist = {};
          catalogData.forEach(item => {
            let key = item.name;
            if (item.name.includes("(CD)")) key = "CD";
            else if (item.name.includes("(RPD)")) key = "RPD";
            else if (item.name.includes("Root Canal")) key = "RCT";
            newOptions.push(key);
            const custom = parseFloat(item.custom_cost) || parseFloat(item.effective_cost);
            const def = parseFloat(item.default_cost);
            const price = custom > 0 ? custom : def;
            if (price > 0) newPricelist[key] = price;
          });
          if (newOptions.length > 0) {
            setTreatmentOptions([...new Set([...newOptions, ...treatmentOptions])]);
            setCustomPricelist(newPricelist);
            if (!newOptions.includes(formData.treatmentType) && newOptions.length > 0) {
              setFormData(prev => ({ ...prev, treatmentType: newOptions[0] }));
            }
          }
        }
      } catch (error) {
        console.error("Failed to load catalog", error);
      } finally {
        setIsLoadingPricelist(false);
      }
    };
    fetchCatalog();
  }, [user]);

  useEffect(() => {
    setIsCalculating(true);
    const result = costEstimatorService.estimate({ ...formData, customPricelist });
    setEstimate(result);
    setIsCalculating(false);
  }, [formData.treatmentType, formData.teethCount, formData.sessions, formData.complexity, formData.material, customPricelist]);

  const handleAnalyze = async () => {
    if (!estimate || !user?.id) return;
    setIsAnalyzing(true);
    try {
      const localAnalysis = costEstimatorService.generatePremiumAnalysis(formData);
      setPremiumAnalysis(localAnalysis);
      const costBreakdownContext = `Base: ₹${estimate.fallback.baseCost}, Complexity: ${formData.complexity}, Material: ${formData.material}. Total: ₹${estimate.prediction.predictedCost}`;
      const userPrompt = `You are a senior dental surgeon. Justify the cost of ₹${estimate.prediction.predictedCost} for ${formData.treatmentType} in 2 sentences. Context: ${costBreakdownContext}. Provide a markdown list cost breakdown.`;
      const aiResponse = await explainCostPuter(userPrompt);
      if (aiResponse?.data?.explanation || aiResponse?.explanation) {
        setPremiumAnalysis(prev => ({
          ...prev,
          explanation: aiResponse.data?.explanation || aiResponse.explanation,
          source: (aiResponse.data?.source || aiResponse.source) || 'puter'
        }));
        toast.success("AI Analysis Complete");
      }
    } catch (error) {
      toast.error("Offline analysis powered by system logic");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveLog = async () => {
    if (!estimate || !user?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        patient_id: formData.patientId ? parseInt(formData.patientId, 10) : null,
        dentist_id: user.id,
        total_cost: estimate.prediction.predictedCost,
        confidence: estimate.prediction.confidenceScore,
        mode: "calculator",
        explanation: premiumAnalysis?.explanation || "Calculated via Price Intelligence Engine",
        context: "calculator",
        items: [{
          name: formData.treatmentType,
          cost: estimate.prediction.predictedCost / formData.teethCount,
          quantity: formData.teethCount,
          subtotal: estimate.prediction.predictedCost,
          source: customPricelist[formData.treatmentType] ? "dentist_catalog" : "ai_adjusted"
        }]
      };
      await saveCostEstimation(payload);
      toast.success("Intelligence Logged Successfully");
      setTimeout(() => navigate('/dashboard/clinician'), 1000);
    } catch (error) {
      toast.error("Failed to save log");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'teethCount' || name === 'sessions' || name === 'age') ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden font-sans transition-colors duration-500">
      <ClinicianSidebar />

      <motion.div
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 100 : 300) : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative"
      >
        {/* Ambient Bg */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-40"
          style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#18181B' : '#94a3b8'} 1.5px, transparent 1.5px)`, backgroundSize: '48px 48px' }} />

        {/* ═══ HEADER ═══ */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shrink-0 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 lg:h-20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <MobileSidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase tracking-widest">Price Intelligence</h1>
                  <p className="text-[10px] lg:text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 hidden sm:flex items-center gap-2 uppercase tracking-widest">
                    <span className="text-teal-600 dark:text-teal-500 font-black flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Estimation Engine
                    </span>
                    <span className="text-slate-300 dark:text-slate-800">·</span>
                    <span>Hybrid ML Model (v4.2)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative hidden md:block w-48 lg:w-64 xl:w-80 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-600 group-focus-within:text-teal-500 transition-colors" />
                  <Input
                    className="pl-10 h-11 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-md text-sm font-bold focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all dark:text-white dark:placeholder:text-zinc-700 shadow-inner"
                    placeholder="Query models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-11 h-11 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 hover:border-teal-200 dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 transition-all flex items-center justify-center group"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                </button>

                <NotificationBell />

                <Link to="/dentist/profile" className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:border-teal-200 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-sm group">
                  <div className="w-9 h-9 bg-teal-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none">Dr. {user?.full_name?.split(' ')[0]}</p>
                    <p className="text-[9px] font-bold text-teal-600 dark:text-teal-500 mt-1 uppercase tracking-widest">Clinician</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Input Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-zinc-950 rounded-md border border-slate-200 dark:border-zinc-800 p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinical Inputs</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Parameters</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Treatment Class</label>
                    <Select
                      value={formData.treatmentType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, treatmentType: value }))}
                    >
                      <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 rounded-md text-sm font-bold text-slate-700 dark:text-white">
                        <SelectValue placeholder="Select Treatment" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] dark:bg-zinc-950 dark:border-zinc-800" position="popper" sideOffset={4}>
                        {treatmentOptions.filter(opt => !searchTerm || opt.toLowerCase().includes(searchTerm.toLowerCase())).map(opt => (
                          <SelectItem key={opt} value={opt}>
                            <HighlightText text={opt} highlight={searchTerm} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Patient ID (Ref)</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <Input
                        name="patientId"
                        value={formData.patientId}
                        onChange={handleChange}
                        className="h-11 pl-10 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 rounded-md text-sm font-bold dark:text-white"
                        placeholder="Ex: 5829"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Units</label>
                      <Input type="number" name="teethCount" value={formData.teethCount} onChange={handleChange} className="h-11 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 rounded-md text-center font-black dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Sessions</label>
                      <Input type="number" name="sessions" value={formData.sessions} onChange={handleChange} className="h-11 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 rounded-md text-center font-black dark:text-white" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Bio-Complexity</label>
                    <div className="flex bg-slate-50 dark:bg-zinc-900/50 p-1 rounded-md border border-slate-100 dark:border-zinc-800">
                      {complexityOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setFormData({ ...formData, complexity: opt })}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${formData.complexity === opt ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-400 dark:text-zinc-600'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Material Grade</label>
                    <div className="flex bg-slate-50 dark:bg-zinc-900/50 p-1 rounded-md border border-slate-100 dark:border-zinc-800">
                      {materialOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setFormData({ ...formData, material: opt })}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${formData.material === opt ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-400 dark:text-zinc-600'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4 border-t border-slate-100 dark:border-zinc-800">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 pl-1">
                        <span>Patient Age</span>
                        <span className="text-teal-600 dark:text-teal-400">{formData.age}y</span>
                      </div>
                      <Slider value={[formData.age]} max={100} onValueChange={(v) => setFormData({ ...formData, age: v[0] })} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 pl-1">
                        <span>Hygiene Index</span>
                        <span className="text-teal-600 dark:text-teal-400">{formData.hygiene}/10</span>
                      </div>
                      <Slider value={[formData.hygiene]} max={10} onValueChange={(v) => setFormData({ ...formData, hygiene: v[0] })} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 pl-1">
                        <span>Urgency Level</span>
                        <span className="text-teal-600 dark:text-teal-400">{formData.urgency}/10</span>
                      </div>
                      <Slider value={[formData.urgency]} max={10} onValueChange={(v) => setFormData({ ...formData, urgency: v[0] })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-8 space-y-6">

              {/* AI Calculation Card */}
              <div className="bg-black rounded-md p-8 text-white relative overflow-hidden border border-zinc-800 shadow-lg">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-md blur-[80px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-md blur-[80px] -ml-40 -mb-40" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-4 bg-white/5 w-fit px-2.5 py-1 rounded-md border border-white/10">
                      <BrainCircuit className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Predictive Engine</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tight mb-2">
                      <span className="text-2xl opacity-40 mr-1.5 font-medium">₹</span>
                      {isCalculating ? "---" : estimate?.prediction?.predictedCost?.toLocaleString()}
                    </h2>
                    <p className="text-sm font-medium text-slate-400">Total Estimated Project Value</p>

                    <div className="flex gap-2 mt-6">
                      <div className="px-2 py-1 bg-white/5 border border-white/5 rounded-mdtext-[9px] font-bold uppercase tracking-widest text-slate-300">
                        {formData.complexity} Complexity
                      </div>
                      <div className="px-2 py-1 bg-white/5 border border-white/5 rounded-mdtext-[9px] font-bold uppercase tracking-widest text-slate-300">
                        {formData.material} Ready
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-md p-5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Confidence Level</span>
                      <span className="text-[10px] font-bold text-teal-400">{(estimate?.prediction?.confidenceScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-md overflow-hidden mb-6">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(estimate?.prediction?.confidenceScore || 0) * 100}%` }} className="h-full bg-teal-500 rounded-md" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between p-2 rounded-md bg-white/[0.03]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Min Scale</span>
                        <span className="text-xs font-bold font-mono">₹{estimate?.prediction?.minRange?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-md bg-white/[0.03]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Max Scale</span>
                        <span className="text-xs font-bold font-mono">₹{estimate?.prediction?.maxRange?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold uppercase tracking-widest text-xs shadow-md gap-2">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  Generate Analysis
                </Button>
                <Button onClick={handleSaveLog} disabled={isSaving} className="flex-1 h-12 bg-slate-800 hover:bg-zinc-900 text-white rounded-md font-bold uppercase tracking-widest text-xs shadow-md gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Commit to Logs
                </Button>
              </div>

              {/* Premium Analysis */}
              <AnimatePresence>
                {premiumAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-950 rounded-md border border-slate-200 dark:border-zinc-800 p-6 shadow-sm overflow-hidden relative transition-colors">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-teal-500" />
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="56" cy="56" r="52" stroke={theme === 'dark' ? '#18181B' : '#f1f5f9'} strokeWidth="6" fill="none" />
                            <motion.circle cx="56" cy="56" r="52" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" fill="none" initial={{ strokeDasharray: "326 326", strokeDashoffset: 326 }} animate={{ strokeDashoffset: 326 - (326 * premiumAnalysis.healthScore) / 100 }} transition={{ duration: 1 }} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-slate-800 dark:text-white">{premiumAnalysis.healthScore}</span>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Score</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                          <Crown className="w-4 h-4 text-teal-600 dark:text-teal-500" />
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Neural Clinical Justification</h3>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-md p-4 mb-6">
                          {isAnalyzing ? (
                            <div className="py-6 flex flex-col items-center justify-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin text-teal-600 dark:text-teal-400" />
                              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] animate-pulse">Consulting clinical models...</p>
                            </div>
                          ) : (
                            <MarkdownExplanation content={premiumAnalysis.explanation} />
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20 rounded-md p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                              <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Escalation Predictor</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 leading-relaxed">
                              Delay impact: <span className="text-orange-600 dark:text-orange-400 font-extrabold">{premiumAnalysis.escalationPercentage}% surge</span> predicted.
                            </p>
                          </div>
                          <div className="bg-teal-50/50 dark:bg-teal-500/5 border border-teal-100 dark:border-teal-500/20 rounded-md p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Target className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider">Clinical Advice</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 truncate">{premiumAnalysis.improvementTips[0]}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comparison Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="Standard Regression"
                  value={estimate?.fallback?.baseCost?.toLocaleString() || "---"}
                  subtext="Linear model calculation"
                  icon={TrendingUp}
                  accent="amber"
                  isCurrency={true}
                />
                <StatCard
                  title="Market Comparison"
                  value={estimate?.prediction?.regionalMarketMedian?.toLocaleString() || (estimate?.prediction?.predictedCost * 1.05).toFixed(0).toLocaleString()}
                  subtext="Regional clinical median"
                  icon={Wallet}
                  accent="blue"
                  isCurrency={true}
                  trend={18}
                />
              </div>
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default PriceEstimatorPage;
