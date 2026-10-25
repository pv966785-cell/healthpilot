import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { HealthPilotLogo } from './HealthPilotLogo';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface SplashProps {
  onProceed: () => void;
}

export const SplashScreen: React.FC<SplashProps> = ({ onProceed }) => {
  useEffect(() => {
    // 1.5 second splash timer as required
    const timer = setTimeout(() => {
      onProceed();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onProceed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B2A6F] via-[#1769E0] to-[#0FB5A0] flex flex-col items-center justify-between p-8 text-white relative overflow-hidden select-none">
      {/* Background Ambient Orbs */}
      <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-96 h-96 rounded-full bg-teal-400/25 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex items-center justify-between text-xs text-blue-100 z-10"
      >
        <span className="flex items-center gap-1.5 font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
          <ShieldCheck className="w-4 h-4 text-teal-300" /> ISO & Telemedicine Certified
        </span>
        <span className="font-semibold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">India (₹ INR)</span>
      </motion.div>

      {/* Center Branding */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center text-center z-10 my-auto max-w-sm"
      >
        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl shadow-blue-950/40 mb-6 drop-shadow-2xl border border-white/80 transform hover:scale-105 transition-transform duration-500">
          <HealthPilotLogo size="xl" variant="icon-only" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-md bg-gradient-to-r from-white via-blue-50 to-teal-100 bg-clip-text text-transparent">
          HealthPilot
        </h1>
        
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-teal-200 mb-4 bg-teal-500/20 px-3.5 py-1 rounded-full border border-teal-300/30">
          <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          <span>Health Beyond Borders</span>
        </div>
        
        <p className="text-base text-blue-100 font-medium leading-relaxed mb-6">
          Your Health, Our Priority.<br />
          <span className="text-sm text-teal-100 opacity-95 font-semibold">Better Care Made Simple.</span>
        </p>

        {/* 1.5s Loading Animation Indicator */}
        <div className="w-48 h-2 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden relative border border-white/20 p-0.5">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-teal-300 via-white to-cyan-200 rounded-full shadow-lg shadow-teal-300/50" 
          />
        </div>
        <span className="text-[11px] text-teal-200 mt-2.5 font-medium tracking-wide">Initializing HealthPilot...</span>
      </motion.div>

      {/* Bottom Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full text-center text-xs text-blue-200/90 z-10 pb-2 font-medium"
      >
        <span>Noida Sector-63, Uttar Pradesh • India</span>
      </motion.div>
    </div>
  );
};
