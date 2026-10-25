import React from 'react';
import { motion } from 'motion/react';
import { HealthPilotLogo } from './HealthPilotLogo';
import { UserRole } from '../types';
import { 
  User, Stethoscope, ShoppingBag, Activity, Shield, 
  ArrowLeft, ChevronRight, Sparkles 
} from 'lucide-react';

interface RoleSelectProps {
  onSelectRole: (role: UserRole) => void;
  onBack: () => void;
  language?: 'en' | 'hi';
  isDarkMode?: boolean;
  onToggleLanguage?: () => void;
}

export const RoleSelectScreen: React.FC<RoleSelectProps> = ({ 
  onSelectRole, 
  onBack, 
  language = 'en', 
  isDarkMode = false,
  onToggleLanguage 
}) => {
  const isHi = language === 'hi';

  const roles = [
    {
      role: 'patient' as UserRole,
      title: 'Patient',
      subtitle: 'Book tests, consult doctors & order medicines',
      icon: User,
      gradient: 'from-[#1769E0] to-blue-600',
      shadowColor: 'shadow-blue-500/20',
      badge: 'Main User',
      badgeStyle: 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      borderColor: 'hover:border-[#1769E0] hover:shadow-blue-500/10'
    },
    {
      role: 'doctor' as UserRole,
      title: 'Doctor',
      subtitle: 'Manage appointments, video consult & prescribe',
      icon: Stethoscope,
      gradient: 'from-[#0FB5A0] to-teal-600',
      shadowColor: 'shadow-teal-500/20',
      badge: 'Verified HCP',
      badgeStyle: 'bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      borderColor: 'hover:border-[#0FB5A0] hover:shadow-teal-500/10'
    },
    {
      role: 'lab' as UserRole,
      title: 'Lab / Technician',
      subtitle: 'Manage test queues, home collection & upload reports',
      icon: Activity,
      gradient: 'from-[#8B5CF6] to-violet-700',
      shadowColor: 'shadow-purple-500/20',
      badge: 'NABL Diagnostic',
      badgeStyle: 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      borderColor: 'hover:border-[#8B5CF6] hover:shadow-purple-500/10'
    },
    {
      role: 'pharmacist' as UserRole,
      title: 'Pharmacist',
      subtitle: 'Verify prescriptions & dispatch genuine medicines',
      icon: ShoppingBag,
      gradient: 'from-[#10B981] to-emerald-600',
      shadowColor: 'shadow-emerald-500/20',
      badge: 'Licensed Pharmacy',
      badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      borderColor: 'hover:border-[#10B981] hover:shadow-emerald-500/10'
    }
  ];

  return (
    <div className={`min-h-[100dvh] ${isDarkMode ? 'mesh-bg-dark text-slate-100' : 'mesh-bg-light text-slate-800'} flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-sans`}>
      {/* Soft Ambient Blobs with reduced opacity */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400/5 dark:bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-teal-400/5 dark:bg-teal-400/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className={`p-2.5 rounded-2xl border transition-all ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 shadow-sm' 
              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm'
          } backdrop-blur-md cursor-pointer`}
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <HealthPilotLogo size="sm" showTagline={false} />
        {onToggleLanguage ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleLanguage}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            } backdrop-blur-md shadow-sm cursor-pointer`}
          >
            {isHi ? 'English' : 'हिंदी'}
          </motion.button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md my-auto py-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-100 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-500/30 text-xs font-bold text-teal-900 dark:text-teal-300 mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0FB5A0]" />
            <span>{isHi ? 'HealthPilot में आपका स्वागत है' : 'Welcome to HealthPilot'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A1A45] dark:text-white tracking-tight">
            {isHi ? 'अपनी भूमिका चुनें' : 'Choose Your Role'}
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 max-w-xs mx-auto">
            {isHi ? 'सुरक्षित पोर्टल एक्सेस करने के लिए अपनी प्रोफाइल चुनें' : 'Select your portal to continue with secure authentication'}
          </p>
        </motion.div>

        {/* 4 Big Role Cards with Dedicated Color Identities */}
        <div className="space-y-3.5">
          {roles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onSelectRole(item.role)}
                className={`group ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' 
                    : 'bg-white border-slate-300 hover:bg-slate-50'
                } border-2 ${item.borderColor} p-4 rounded-3xl shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center justify-between`}
              >
                <div className="flex items-center gap-4">
                  {/* Colourful Icon Badge inside Gradient Circle */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white shadow-lg ${item.shadowColor} group-hover:scale-105 transition-transform shrink-0`}>
                    <Icon className="w-7 h-7 drop-shadow-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">
                        {item.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeStyle}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-[#0A1A45] dark:group-hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Subtle Admin Login Link with Navy + Amber Accent */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md pt-4 pb-2 border-t border-slate-300 dark:border-slate-800 flex flex-col items-center z-10"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('super_admin')}
          className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-2 transition-colors py-2 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-amber-400/50 cursor-pointer shadow-sm"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0B2A6F] to-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span>Platform Administrator Portal</span>
          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-400/30">
            2FA
          </span>
        </motion.button>
        <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-medium">Audit Protected • Noida HQ Master Console</span>
      </motion.div>
    </div>
  );
};
