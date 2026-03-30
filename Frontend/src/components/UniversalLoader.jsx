import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';

// Dentist animation URL
const DENTIST_ANIMATION_URL = "https://lottie.host/71f90def-9eea-4b4f-a48f-b239463222eb/yvrpaz0u8M.lottie";
// Patient animation URL (previous one)
const PATIENT_ANIMATION_URL = "https://lottie.host/ab074b12-fac7-4db6-bd61-b0a49af58c4c/28oiynEQjC.lottie";

const UniversalLoader = ({ text = "LOADING ARCHIVE...", variant = "dentist" }) => {
  // Select animation URL based on variant
  const animationUrl = variant === "dentist" ? DENTIST_ANIMATION_URL : PATIENT_ANIMATION_URL;
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black items-center justify-center font-sans tracking-tight text-slate-900 dark:text-white font-bold transition-colors duration-500">
       <div className="flex flex-col items-center justify-center w-full max-w-[280px]">
          <DotLottieReact
            src={animationUrl}
            loop
            autoplay
          />
          {text && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-[11px] uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-600 font-black"
            >
              {text}
            </motion.p>
          )}
       </div>
    </div>
  );
};

export default UniversalLoader;
