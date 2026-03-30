import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SplashLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)

  const statusSteps = [
    "INITIALIZING CORE ENGINE...",
    "CONNECTING TO NEURAL NETWORK...",
    "SYNCING CLINICAL PROTOCOLS...",
    "CALIBRATING 3D DENTAL MODELS...",
    "OPTIMIZING AI WORKSPACE...",
    "PROSTOCALC READY ✓"
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 1
      })
    }, 30)

    const statusTimer = setInterval(() => {
      setStatusIndex(prev => (prev < statusSteps.length - 1 ? prev + 1 : prev))
    }, 600)

    return () => {
      clearInterval(timer)
      clearInterval(statusTimer)
    }
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#0D2659 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative space-y-12 w-full max-w-sm flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-32 h-32 bg-white rounded-md shadow-2xl shadow-blue-500/10 flex items-center justify-center border border-slate-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-md flex items-center justify-center text-white text-4xl font-black">
              P
            </div>
          </div>
          {/* Orbital Rings Effect */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border border-dashed border-blue-200 rounded-md opacity-50"
          />
        </motion.div>

        <div className="text-center space-y-2">
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black tracking-tight text-slate-900"
          >
            Prosto<span className="text-blue-600">Calc</span>
          </motion.h2>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400">
            Advanced Dental Architecture
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full space-y-4">
          <div className="flex justify-between items-end mb-1">
            <div className="space-y-1">
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">System Status</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIndex}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="text-[10px] font-mono font-bold text-blue-600"
                >
                  {statusSteps[statusIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
            <span className="text-sm font-black text-slate-900 font-mono">{progress}%</span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-md overflow-hidden border border-slate-50">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase">CPU</p>
              <p className="text-[10px] font-mono font-bold text-slate-900">0.2ms</p>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase">MODEL</p>
              <p className="text-[10px] font-mono font-bold text-slate-900">V4.2.1</p>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase">SECURE</p>
              <p className="text-[10px] font-mono font-bold text-slate-900">256-BIT</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SplashLoader
