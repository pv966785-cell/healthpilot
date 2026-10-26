import React from 'react';
import { motion } from 'motion/react';
import { HealthPilotLogo } from './HealthPilotLogo';
import { InstallAppButton } from './InstallAppButton';
import { FounderAvatar } from './FounderAvatar';
import { founderDetails } from '@/src/mockData';
import { 
  Stethoscope, Activity, ShoppingBag, ArrowRight, ShieldCheck, 
  CheckCircle2, Users, FileText, Truck, CreditCard, Phone, Mail, 
  MessageCircle, MapPin, Globe, Moon, Sun, Sparkles,
  Clock, ShieldAlert
} from 'lucide-react';

interface WelcomeScreenProps {
  onGoToLogin: () => void;
  onGoToSignUp: () => void;
  language: 'en' | 'hi';
  isDarkMode: boolean;
  onToggleLanguage: () => void;
  onToggleDarkMode: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'contact') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGoToLogin,
  onGoToSignUp,
  language,
  isDarkMode,
  onToggleLanguage,
  onToggleDarkMode,
  onOpenLegal
}) => {
  const isHi = language === 'hi';

  return (
    <div className={`min-h-[100dvh] ${isDarkMode ? 'mesh-bg-dark text-slate-100' : 'mesh-bg-light text-slate-800'} flex flex-col font-sans selection:bg-[#1769E0] selection:text-white pb-28 relative overflow-x-hidden`}>
      
      {/* Ambient background glow orbs with reduced opacity */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/5 dark:bg-blue-600/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-[350px] -left-20 w-[400px] h-[400px] bg-teal-400/5 dark:bg-teal-500/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[800px] right-[-50px] w-[350px] h-[350px] bg-purple-500/5 dark:bg-purple-600/15 rounded-full blur-[80px] pointer-events-none" />

      {/* Install App Bar (Welcome / Home Screen Only) */}
      <InstallAppButton language={language} />

      {/* 0. Top Bar with Glassmorphic styling */}
      <header className={`sticky top-0 z-40 ${isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/95 border-slate-300'} backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between shadow-xs`}>
        <HealthPilotLogo size="sm" />
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onToggleLanguage}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            } shadow-xs`}
          >
            <Globe className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>{isHi ? 'English' : 'हिंदी'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            } shadow-xs`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
        </div>
      </header>

      {/* Main Scrollable Content Container */}
      <main className="w-full max-w-xl mx-auto px-4 py-6 space-y-7 z-10">
        
        {/* 1. HERO SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center pt-2 space-y-3.5"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-teal-300 text-xs font-extrabold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0FB5A0]" />
            <span>{isHi ? 'आपका स्वास्थ्य, हमारी प्राथमिकता' : 'Your Health, Our Priority'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A1A45] dark:text-white leading-[1.15]">
            {isHi ? 'संपूर्ण स्वास्थ्य एक ही ऐप में' : 'Complete Healthcare in One App'}
          </h1>

          <div className="inline-block">
            <span className="text-xs sm:text-sm font-extrabold bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] bg-clip-text text-transparent uppercase tracking-wider">
              {isHi ? 'डॉक्टर परामर्श | लैब टेस्ट | दवाइयां' : 'Doctor Consultation • Lab Tests • Medicines'}
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            {isHi 
              ? 'प्रमाणित डॉक्टरों से परामर्श लें, घर पर सैंपल कलेक्शन बुक करें और 100% असली दवाइयां सीधे अपने घर मंगाएं।' 
              : 'Consult verified doctors, schedule home sample collections, and order 100% genuine medicines delivered straight to your door.'}
          </p>

          {/* Action Buttons with signature gradient */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToLogin}
              className="px-6 py-3.5 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] hover:from-blue-600 hover:to-teal-600 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{isHi ? 'लॉगिन' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToSignUp}
              className="px-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-[#1769E0] text-[#0A1A45] dark:text-white rounded-2xl font-extrabold text-sm shadow-sm transition-all cursor-pointer"
            >
              {isHi ? 'खाता बनाएं' : 'Create Account'}
            </motion.button>
          </div>
        </motion.section>

        {/* 2. WHO WE ARE & FOUNDER */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-md space-y-4`}
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-[#0FB5A0] block">
              {isHi ? 'हमारे बारे में' : 'About HealthPilot'}
            </span>
            <h2 className="text-xl font-extrabold text-[#0A1A45] dark:text-white mt-0.5">
              {isHi ? 'वन-स्टॉप डिजिटल हेल्थकेयर' : 'One-Stop Digital Healthcare Ecosystem'}
            </h2>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {isHi 
              ? 'HealthPilot एक विश्वसनीय डिजिटल स्वास्थ्य मंच है जो मरीजों को NMC-पंजीकृत डॉक्टरों, NABL-प्रमाणित लैब और लाइसेंस प्राप्त फार्मेसियों से जोड़ता है।' 
              : 'HealthPilot is a one-stop digital healthcare super-platform designed to seamlessly bridge patients with NMC-registered medical specialists, accredited diagnostic laboratories, and licensed partner pharmacies. Everything you need for health wellness, diagnostics, and recovery is unified into one trustworthy experience.'}
          </p>

          {/* Founder Card with rich Navy to Blue gradient & subtle amber badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B2A6F] via-[#1769E0] to-[#0FB5A0] text-white flex items-center gap-4 shadow-lg shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <FounderAvatar className="w-14 h-14 rounded-2xl border border-white/30 shadow-inner" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-200 bg-white/15 px-2 py-0.5 rounded-full inline-block mb-1">
                {isHi ? 'नेतृत्व और दृष्टि' : 'Leadership & Vision'}
              </span>
              <h3 className="text-base font-extrabold leading-tight">{founderDetails.name}</h3>
              <p className="text-xs text-blue-100">{founderDetails.role}</p>
              <p className="text-[11px] text-teal-100 mt-0.5">{founderDetails.office}</p>
            </div>
          </div>
        </motion.section>

        {/* 3. WHAT WE PROVIDE (3 Big Gradient Cards with Role Color Identity) */}
        <section className="space-y-3.5">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900 dark:text-[#1769E0]">
              {isHi ? 'हमारी मुख्य सेवाएं' : 'Our Core Offerings'}
            </span>
            <h2 className="text-xl font-extrabold text-[#0A1A45] dark:text-white mt-0.5">
              {isHi ? 'हम क्या प्रदान करते हैं' : 'What We Provide'}
            </h2>
          </div>

          {/* Doctor Card (Teal / Blue Signature Gradient) */}
          <motion.div 
            whileHover={{ scale: 1.015, y: -2 }}
            className="bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] rounded-3xl p-5 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden flex items-center justify-between"
          >
            <div className="space-y-1 max-w-[78%]">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25">
                {isHi ? 'प्रमाणित विशेषज्ञ' : 'Certified Specialists'}
              </span>
              <h3 className="text-lg font-extrabold mt-1">
                {isHi ? 'डॉक्टर परामर्श' : 'Doctor Consultation'}
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                {isHi 
                  ? 'वीडियो, ऑडियो, चैट और इन-क्लिनिक अपॉइंटमेंट्स।' 
                  : 'Video, audio, chat, and in-clinic appointments with NMC-registered doctors across 20+ specialties.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-lg border border-white/20">
              <Stethoscope className="w-7 h-7" />
            </div>
          </motion.div>

          {/* Lab Tests Card (Purple Role Gradient) */}
          <motion.div 
            whileHover={{ scale: 1.015, y: -2 }}
            className="bg-gradient-to-r from-[#8B5CF6] to-purple-700 rounded-3xl p-5 text-white shadow-xl shadow-purple-600/20 relative overflow-hidden flex items-center justify-between"
          >
            <div className="space-y-1 max-w-[78%]">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25">
                {isHi ? 'NABL मान्यता प्राप्त' : 'NABL Accredited'}
              </span>
              <h3 className="text-lg font-extrabold mt-1">
                {isHi ? 'लैब टेस्ट बुक करें' : 'Book Lab Tests'}
              </h3>
              <p className="text-xs text-purple-100 leading-relaxed">
                {isHi 
                  ? 'मुफ्त होम सैंपल कलेक्शन और तुरंत डिजिटल रिपोर्ट।' 
                  : 'Free home sample collection by verified phlebotomists, fast turnaround time, and digital reports inside the app.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-lg border border-white/20">
              <Activity className="w-7 h-7" />
            </div>
          </motion.div>

          {/* Medicines Card (Green Pharmacist Role Gradient) */}
          <motion.div 
            whileHover={{ scale: 1.015, y: -2 }}
            className="bg-gradient-to-r from-[#10B981] to-emerald-700 rounded-3xl p-5 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden flex items-center justify-between"
          >
            <div className="space-y-1 max-w-[78%]">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25">
                {isHi ? '100% असली दवाइयां' : '100% Genuine Pharmacy'}
              </span>
              <h3 className="text-lg font-extrabold mt-1">
                {isHi ? 'दवाइयां ऑर्डर करें' : 'Order Medicines'}
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                {isHi 
                  ? 'तेज़ होम डिलीवरी और पर्चा (Rx) सत्यापन।' 
                  : 'Doorstep medicine delivery, prescription verification by certified pharmacists, generic substitutes & refill alerts.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-lg border border-white/20">
              <ShoppingBag className="w-7 h-7" />
            </div>
          </motion.div>
        </section>

        {/* 4. HOW IT WORKS (3-Step Sequence) */}
        <section className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-md space-y-4`}>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-[#0FB5A0] block">
              {isHi ? 'सरल 3-चरण प्रक्रिया' : 'Simple 3-Step Journey'}
            </span>
            <h2 className="text-xl font-extrabold text-[#0A1A45] dark:text-white mt-0.5">
              {isHi ? 'यह कैसे काम करता है' : 'How It Works'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-300 dark:border-blue-800/40 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1769E0] to-blue-500 text-white flex items-center justify-center text-xs font-extrabold mx-auto shadow-md shadow-blue-500/25">
                1
              </div>
              <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">
                {isHi ? 'सेवा चुनें' : 'Choose a Service'}
              </h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                {isHi ? 'परामर्श, लैब टेस्ट या दवा चुनें।' : 'Select consultation, lab diagnostics, or pharmacy orders.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-300 dark:border-teal-800/40 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0FB5A0] to-teal-500 text-white flex items-center justify-center text-xs font-extrabold mx-auto shadow-md shadow-teal-500/25">
                2
              </div>
              <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">
                {isHi ? 'आसानी से बुक करें' : 'Book in a Few Taps'}
              </h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                {isHi ? 'समय स्लॉट और भुगतान मोड चुनें।' : 'Pick your preferred time slot, patient profile, and payment mode.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-300 dark:border-purple-800/40 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-purple-500 text-white flex items-center justify-center text-xs font-extrabold mx-auto shadow-md shadow-purple-500/25">
                3
              </div>
              <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">
                {isHi ? 'घर पर देखभाल पाएं' : 'Get Care at Home'}
              </h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                {isHi ? 'लाइव वीडियो और सुरक्षित डिलीवरी।' : 'Instant video room, doorstep phlebotomy, and rapid delivery.'}
              </p>
            </div>
          </div>
        </section>

        {/* 5. WHY CHOOSE US (4 Colourful Trust Badges) */}
        <section className="space-y-3">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-[#0FB5A0]">
              {isHi ? 'विश्वास और सुरक्षा' : 'Trust & Safety'}
            </span>
            <h2 className="text-xl font-extrabold text-[#0A1A45] dark:text-white mt-0.5">
              {isHi ? 'HealthPilot क्यों चुनें' : 'Why Choose HealthPilot'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-sm flex items-start gap-3`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">Verified Doctors</h4>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">100% NMC council registered specialists.</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-sm flex items-start gap-3`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                <CheckCircle2 className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">Accurate Reports</h4>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">NABL accredited diagnostic partners.</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-sm flex items-start gap-3`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-violet-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                <Truck className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">Fast & Safe Delivery</h4>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">Cold chain & sealed packaging.</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-sm flex items-start gap-3`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <CreditCard className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">Secure Payments</h4>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">UPI, cards, wallet & COD options.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. MORE FEATURES */}
        <section className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-md space-y-3`}>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900 dark:text-[#1769E0] block">
            {isHi ? 'मरीजों का अनुभव' : 'Patient Experience'}
          </span>
          <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">
            {isHi ? 'अधिक सुविधाएं' : 'More Features for You & Your Family'}
          </h3>
          
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-[#F8FAFC] border-slate-300 text-slate-800'} flex items-center gap-2.5`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-[#0A1A45] dark:text-white">Family Profiles</strong>
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Manage parents & kids</span>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-[#F8FAFC] border-slate-300 text-slate-800'} flex items-center gap-2.5`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-[#0A1A45] dark:text-white">Digital Records Vault</strong>
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Lifetime secure storage</span>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-[#F8FAFC] border-slate-300 text-slate-800'} flex items-center gap-2.5`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-[#0A1A45] dark:text-white">Refill Reminders</strong>
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Never miss a dose</span>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-[#F8FAFC] border-slate-300 text-slate-800'} flex items-center gap-2.5`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-[#0A1A45] dark:text-white">24/7 SOS Helpline</strong>
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Emergency response</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CONTACT & FOUNDER INFO */}
        <section className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} shadow-md space-y-4`}>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-[#0FB5A0] block">
              {isHi ? 'संपर्क और संस्थापक' : 'Contact & Founder Info'}
            </span>
            <h3 className="text-lg font-extrabold text-[#0A1A45] dark:text-white mt-0.5">
              HealthPilot Headquarters
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <FounderAvatar className="w-10 h-10 rounded-xl shadow-md shadow-blue-900/20" />
              <div>
                <span className="font-extrabold text-sm text-[#0A1A45] dark:text-white block">
                  {founderDetails.name}
                </span>
                <span className="text-[11px] text-blue-700 dark:text-blue-400 font-bold">{founderDetails.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1769E0] shrink-0" />
                <span><strong className="text-[#0A1A45] dark:text-white">Phone:</strong> {founderDetails.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0FB5A0] shrink-0" />
                <span><strong className="text-[#0A1A45] dark:text-white">Email:</strong> {founderDetails.email}</span>
              </p>
            </div>

            <p className="flex items-start gap-2 pt-0.5">
              <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
              <span><strong className="text-[#0A1A45] dark:text-white">Address:</strong> {founderDetails.address}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={`tel:${founderDetails.phone}`}
              className="py-2.5 bg-gradient-to-r from-[#1769E0] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={`https://wa.me/91${founderDetails.phone}?text=Hello%20HealthPilot`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={`mailto:${founderDetails.email}`}
              className="py-2.5 bg-gradient-to-r from-[#0B2A6F] to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </motion.a>
          </div>
        </section>

        {/* 8. FOOTER */}
        <footer className={`pt-4 pb-8 border-t ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-[#0A1A45]'} text-center space-y-3`}>
          <div className="flex items-center justify-center gap-2">
            <HealthPilotLogo size="sm" showTagline={false} />
          </div>
          <p className="text-xs font-semibold text-[#0A1A45] dark:text-teal-400">
            Health Beyond Borders • Your Health, Our Priority
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-700 dark:text-slate-400">
            <button 
              type="button"
              onClick={() => onOpenLegal?.('terms')} 
              className="hover:underline hover:text-[#1769E0] transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => onOpenLegal?.('privacy')} 
              className="hover:underline hover:text-[#0FB5A0] transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => onOpenLegal?.('privacy')} 
              className="hover:underline hover:text-[#0FB5A0] transition-colors"
            >
              DPDP Act & Compliance
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => onOpenLegal?.('terms')} 
              className="hover:underline hover:text-[#1769E0] transition-colors"
            >
              Telemedicine Guidelines
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => onOpenLegal?.('contact')} 
              className="hover:underline hover:text-[#8B5CF6] font-bold transition-colors"
            >
              Contact Support
            </button>
          </div>

          <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-500">
            <p>© {new Date().getFullYear()} HealthPilot Inc. All rights reserved.</p>
            <p className="mt-1 font-semibold text-teal-700 dark:text-teal-400 flex items-center justify-center gap-1">
              Made with care for India 🇮🇳
            </p>
          </div>
        </footer>

      </main>

      {/* 8. BOTTOM STICKY BAR */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 ${isDarkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-300'} backdrop-blur-xl border-t p-3 px-4 shadow-2xl`}>
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoToLogin}
            className="flex-1 py-3.5 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] hover:from-blue-600 hover:to-teal-600 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{isHi ? 'लॉगिन' : 'Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoToSignUp}
            className="flex-1 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0A1A45] dark:text-white rounded-2xl font-extrabold text-sm transition-all border-2 border-slate-300 dark:border-slate-700 cursor-pointer shadow-sm"
          >
            {isHi ? 'खाता बनाएं' : 'Create Account'}
          </motion.button>
        </div>
      </div>

    </div>
  );
};
