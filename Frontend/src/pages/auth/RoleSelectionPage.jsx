import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, FileText, ArrowRight, ShieldCheck, Activity, Globe, Zap, Cpu, ScanLine, Binary } from 'lucide-react'
import TechBackground from '@/components/TechBackground'
import Logo from '@/components/Logo'

// Futuristic SVG Card Component
const FuturisticCard = ({ children, className = '', color = '#3b82f6', icon: Icon }) => {
  return (
    <div className={`relative group h-full ${className}`}>
      {/* 
        Main Card Shape 
        Using clip-path for that sci-fi cut-corner look without relying on fixed SVG aspect ratios
      */}
      <div
        className="absolute inset-0 bg-card/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:bg-card/90 dark:group-hover:bg-zinc-900/90 border border-border"
        style={{
          clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
        }}
      />

      {/* 
        SVG Overlay for Borders and Animations 
        Positioned absolutely to match the clip-path shape
      */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Static Border (faint) */}
        <path
          d="M20,1 Lcalc(100% - 1),1 Lcalc(100% - 1),calc(100% - 20) Lcalc(100% - 20),calc(100% - 1) L1,calc(100% - 1) L1,20 Z"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Animated Flow Lines (Active on Hover) */}
        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Top Left Corner */}
          <path
            d="M1,50 L1,20 L20,1 L80,1"
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            filter="url(#glow)"
          >
            <animate attributeName="stroke-dasharray" from="0, 200" to="200, 0" dur="0.6s" fill="freeze" begin="mouseenter" />
          </path>

          {/* Bottom Right Corner */}
          <path
            d="Mcalc(100% - 1),calc(100% - 50) Lcalc(100% - 1),calc(100% - 20) Lcalc(100% - 20),calc(100% - 1) Lcalc(100% - 80),calc(100% - 1)"
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            filter="url(#glow)"
          />
        </g>

        {/* Tech Decor Elements */}
        <rect x="calc(100% - 15)" y="8" width="8" height="2" fill={color} opacity="0.4" />
        <rect x="8" y="calc(100% - 10)" width="8" height="2" fill={color} opacity="0.4" />
      </svg>

      {/* Content Container */}
      <div className="relative z-10 h-full p-6 sm:p-8 md:p-10 flex flex-col items-center text-center">
        {/* Icon Container with Hexagon SVG */}
        <div className="relative mb-6 sm:mb-8 group-hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-md" />
          <svg viewBox="0 0 100 100" className="drop-shadow-lg w-20 h-20 sm:w-24 sm:h-24">
            <path
              d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z"
              fill="white"
              className="fill-card dark:fill-zinc-800"
              stroke={color}
              strokeWidth="2"
              fillOpacity="0.9"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: color }} />
          </div>

          {/* Orbiting Dot */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="w-2 h-2 rounded-md absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color }} />
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

const RoleSelectionPage = () => {
  const location = useLocation()
  const isLogin = location.pathname.startsWith('/login')

  const title = isLogin ? 'Select Gateway' : 'Join Network'
  const subtitle = isLogin ? 'Initialize secure connection to the ProstoCalc ecosystem:' : 'Select your clinical entry point to the neural network:'

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900 bg-background">
      <TechBackground />

      {/* Background Gradients */}
      {/* Background Grid & Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-background [mask-image:linear-gradient(to_bottom,white,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-[0.3]" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-md blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-md blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="mb-10 sm:mb-16 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center mb-6"
          >
            <Logo />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl sm:text-5xl lg:text-7xl font-black text-foreground tracking-tighter leading-none uppercase"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg text-muted-foreground font-black uppercase tracking-widest max-w-lg mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-16 max-w-4xl mx-auto">
          {/* Clinician Card */}
          <Link to={isLogin ? '/login/clinician' : '/signup/clinician'} className="block h-full group">
            <FuturisticCard color="#0d9488" icon={Calculator}>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ScanLine className="w-4 h-4 text-teal-600 opacity-50" />
                  <span className="text-xs font-black tracking-[0.2em] uppercase text-teal-600 opacity-70">Provider Access</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase">Clinician</h3>
                <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                  Access chairside pricing automation and clinical decision support tools.
                </p>
              </div>

              <div className="mt-auto w-full">
                <div className="flex items-center justify-center gap-3 w-full h-14 bg-teal-600 text-white font-black uppercase tracking-widest text-sm clip-button group-hover:bg-teal-700 shadow-xl shadow-teal-600/20 active:scale-[0.98] transition-all relative overflow-hidden"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {isLogin ? 'Enter Gateway' : 'Initialize Protocol'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </FuturisticCard>
          </Link>

          {/* Patient Card */}
          <Link to={isLogin ? '/login/patient' : '/signup/patient'} className="block h-full group">
            <FuturisticCard color="#3b82f6" icon={FileText}>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Binary className="w-4 h-4 text-blue-500 opacity-50" />
                  <span className="text-xs font-black tracking-[0.2em] uppercase text-blue-500 opacity-70">Personal Access</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase">Patient</h3>
                <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                  View transparent cost estimates and personalized treatment plans.
                </p>
              </div>

              <div className="mt-auto w-full">
                <div className="flex items-center justify-center gap-3 w-full h-14 bg-cyan-500 text-white font-bold text-lg clip-button group-hover:bg-cyan-600 transition-all relative overflow-hidden"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {isLogin ? 'Access Portal' : 'Create Record'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </FuturisticCard>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 sm:mt-16 lg:mt-20 flex flex-wrap justify-center gap-4 sm:gap-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary/40 backdrop-blur-md border border-border shadow-sm text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase transition-all hover:bg-secondary/60 hover:scale-105 cursor-default group">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
            SECURE::ENCRYPTED
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary/40 backdrop-blur-md border border-border shadow-sm text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase transition-all hover:bg-secondary/60 hover:scale-105 cursor-default group">
            <Activity className="w-3.5 h-3.5 text-teal-500 group-hover:text-teal-600 transition-colors" />
            SYNC::ACTIVE
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary/40 backdrop-blur-md border border-border shadow-sm text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase transition-all hover:bg-secondary/60 hover:scale-105 cursor-default group">
            <Cpu className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
            AI::ENABLED
          </div>
        </motion.div>

        {/* Return Button */}
        <div className="mt-8 sm:mt-12 text-center relative z-20">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground hover:text-blue-600 transition-colors group uppercase">
            <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Terminal Exit
          </Link>
        </div>

      </motion.div>
    </div>
  )
}

export default RoleSelectionPage
