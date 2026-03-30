import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { ArrowLeft, Home, AlertCircle, Activity } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()
  const ANIMATION_URL = "https://lottie.host/ab074b12-fac7-4db6-bd61-b0a49af58c4c/28oiynEQjC.lottie"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

      {/* Minimal header */}
      <header className="relative z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm shrink-0">
        <div className="max-w-screen-lg mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[13px] font-bold text-slate-900 tracking-tight">ProstoCalc</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
            Clinical Intelligence Platform
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-lg w-full">

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm relative"
          >
            {/* 3px top bar */}
            <div className="h-[3px] w-full bg-blue-500" />

            <div className="flex flex-col items-center text-center px-8 pt-8 pb-6">

              {/* Badge */}
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-[0.18em] mb-4">
                  <AlertCircle className="w-3 h-3" />
                  Error 404
                </span>
              </motion.div>

              {/* Lottie */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="w-full max-w-[260px] my-2"
              >
                <DotLottieReact src={ANIMATION_URL} loop autoplay />
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-3 mb-6"
              >
                <h1 className="text-[26px] sm:text-[30px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  Page not found
                </h1>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[340px] mx-auto">
                  The resource you're looking for has been moved, deleted, or exists outside the clinical directory.
                </p>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs"
              >
                <button
                  onClick={() => navigate(-1)}
                  className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Go back
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full h-10 rounded-md bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Home className="w-3.5 h-3.5" /> Return home
                </button>
              </motion.div>
            </div>

            {/* Card footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="px-8 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                ProstoCalc · Clinical Portal
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-md bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Systems online</span>
              </div>
            </motion.div>
          </motion.div>


        </div>
      </div>
    </div>
  )
}

export default NotFound