import React from 'react'
import { motion } from 'framer-motion'

const BackgroundOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-background transition-colors duration-500">
      {/* 1. Perspective Grid (Light Medical Blue) */}
      <motion.div
        initial={{ x: 0, y: 0 }}
        animate={{ x: -55, y: -55 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-[-100px] opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #40A6F2 0.8px, transparent 0.8px),
            linear-gradient(to bottom, #40A6F2 0.8px, transparent 0.8px)
          `,
          backgroundSize: '55px 55px',
        }}
      />

      {/* 2. Medical Cross Pattern (Subtle) */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2340A6F2' stroke-width='0.5'%3E%3Cpath d='M40 36v8M36 40h8'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* 3. Breathable Orbs (Clinical Layout) */}
      <motion.div
        animate={{
          x: [-20, 20, -20],
          y: [-30, 30, -30],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-[#40A6F2]/10 rounded-md blur-[100px]"
      />

      <motion.div
        animate={{
          x: [20, -20, 20],
          y: [30, -30, 30],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-[#00D9F2]/08 rounded-md blur-[120px]"
      />

      {/* 4. Vignette Shadow Overlay (Dynamic) */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40 pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_var(--background)] pointer-events-none opacity-50 dark:opacity-20" />
    </div>
  )
}

export default BackgroundOrbs

