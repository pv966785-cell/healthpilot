import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { HealthPilotLogo } from './HealthPilotLogo';
import { FounderAvatar } from './FounderAvatar';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Clock, RefreshCw, LogOut, Phone, CheckCircle2, AlertTriangle, XCircle, Mail } from 'lucide-react';
import { UserStatus } from '../types';

interface WaitingProps {
  onRefresh?: () => void;
}

export const WaitingApprovalScreen: React.FC<WaitingProps> = ({ onRefresh }) => {
  const { currentUser, logout, refreshUserProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<{
    text: string;
    type: 'success' | 'amber' | 'error';
    status?: UserStatus;
    rejectionReason?: string;
  } | null>(null);

  // Email verification resend state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const isEmailVerified = auth.currentUser?.emailVerified ?? true;

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading || !auth.currentUser) return;
    setResendLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendMessage('Verification email dispatched! Please check your inbox or spam folder.');
      setResendCooldown(60);
    } catch (err: any) {
      setResendMessage(err?.message || 'Failed to send verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleReloadVerificationStatus = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setResendMessage('Email verified successfully!');
      } else {
        setResendMessage('Email is still unverified. Please check your email inbox.');
      }
    } catch (err: any) {
      setResendMessage(err?.message || 'Failed to reload status.');
    }
  };

  const performCheck = async () => {
    setIsChecking(true);
    if (onRefresh) {
      try { onRefresh(); } catch {}
    }

    const res = await refreshUserProfile();
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastCheckedTime(nowStr);

    if (res.success) {
      const st = res.status || currentUser?.status || 'Pending';
      if (st === 'Active') {
        setStatusResult({
          text: 'Approved! Opening your dashboard...',
          type: 'success',
          status: 'Active'
        });
      } else if (st === 'Pending') {
        setStatusResult({
          text: `Still under review. Last checked at ${nowStr}. We will notify you once approved.`,
          type: 'amber',
          status: 'Pending'
        });
      } else if (st === 'Suspended' || st === 'Blocked') {
        setStatusResult({
          text: 'Your application was not approved.',
          type: 'error',
          status: st,
          rejectionReason: currentUser?.rejectionReason
        });
      }
    } else {
      setStatusResult({
        text: res.error || 'Could not check status. Check your internet connection and try again.',
        type: 'error'
      });
    }

    setIsChecking(false);
  };

  const handleManualCheck = async () => {
    if (isChecking || isCooldown) return;
    setIsCooldown(true);
    await performCheck();
    cooldownTimerRef.current = setTimeout(() => {
      setIsCooldown(false);
    }, 3000);
  };

  useEffect(() => {
    // Check on mount
    performCheck();

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      performCheck();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] mesh-bg-light dark:mesh-bg-dark flex flex-col items-center justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Soft Ambient Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-[90px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 z-10">
        <HealthPilotLogo size="sm" />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 shadow-xs backdrop-blur-md transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md my-auto py-6 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-[32px] p-7 shadow-xl text-center relative overflow-hidden"
        >
          {/* Subtle Top Amber Stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 absolute top-0 left-0" />

          {/* Email Verification Banner */}
          {!isEmailVerified && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Email Address Not Verified</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                Please verify your email address to complete credential submission. Check your inbox for the link.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  disabled={resendCooldown > 0 || resendLoading}
                  onClick={handleResendVerification}
                  className="px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Email'}
                </button>
                <button
                  onClick={handleReloadVerificationStatus}
                  className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  Reload Status
                </button>
              </div>
              {resendMessage && (
                <p className="text-[10px] font-bold text-teal-700 dark:text-teal-400 mt-1">{resendMessage}</p>
              )}
            </div>
          )}

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-400/20 border-2 border-amber-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
            <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-3.5 py-1 rounded-full border border-amber-300 dark:border-amber-700/50 inline-block">
            Pending Admin Verification
          </span>

          <h2 className="text-2xl font-extrabold text-[#0A1A45] dark:text-white mt-3 tracking-tight">
            Waiting for Admin Approval
          </h2>

          <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
            Thank you for registering with <strong>HealthPilot</strong>. Under Indian Healthcare & Telemedicine Regulations, our Super Admin team conducts mandatory credential verification before authorizing account access.
          </p>

          {/* User Application Details Card */}
          <div className="bg-[#F8FAFC] dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-300 dark:border-slate-700/80 text-left my-5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Applicant Name:</span>
              <strong className="text-[#0A1A45] dark:text-slate-100 font-bold">{currentUser?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Applied Role:</span>
              <strong className="text-teal-700 dark:text-teal-400 capitalize font-bold">{currentUser?.role}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Registered Identifier:</span>
              <span className="text-slate-900 dark:text-slate-100 font-mono text-[11px] font-medium">{currentUser?.email || currentUser?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Verification Status:</span>
              <span className="text-amber-800 dark:text-amber-400 font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                In Verification Queue
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: isChecking || isCooldown ? 1 : 1.02 }}
              whileTap={{ scale: isChecking || isCooldown ? 1 : 0.98 }}
              onClick={handleManualCheck}
              disabled={isChecking || isCooldown}
              className={`w-full py-3.5 text-white rounded-2xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                isChecking || isCooldown 
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-80 shadow-none'
                  : 'bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] hover:from-blue-600 hover:to-teal-600 shadow-blue-500/25'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : isCooldown ? 'Please wait 3s...' : 'Check Approval Status'}
            </motion.button>

            {/* Status Feedback Message */}
            {statusResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs text-left font-medium flex items-start gap-2.5 transition-all ${
                  statusResult.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : statusResult.type === 'amber'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {statusResult.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                {statusResult.type === 'amber' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
                {statusResult.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
                <div className="space-y-1">
                  <p className="font-semibold">{statusResult.text}</p>
                  {statusResult.rejectionReason && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-normal">
                      <strong>Reason:</strong> {statusResult.rejectionReason}
                    </p>
                  )}
                  {(statusResult.status === 'Suspended' || statusResult.status === 'Blocked') && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-normal">
                      For support, please call <strong>9311601420</strong>.
                    </p>
                  )}
                </div>
              </div>
            )}

            {lastCheckedTime && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Last checked: <span className="font-mono">{lastCheckedTime}</span>
              </p>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              You will be able to use the app as soon as the admin approves your account.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Support Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 shadow-md z-10">
        <div className="flex items-center gap-3">
          <FounderAvatar className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm object-cover object-top" />
          <div>
            <span className="font-extrabold block text-[#0A1A45] dark:text-slate-100">Need Urgent Approval?</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Contact Praveen Verma (Founder & Director)</span>
          </div>
        </div>
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="tel:9311601420"
          className="px-3.5 py-1.5 bg-gradient-to-r from-[#0FB5A0] to-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5" /> 9311601420
        </motion.a>
      </div>
    </div>
  );
};

