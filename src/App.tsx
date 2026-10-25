import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useT } from './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { AuthScreen } from './components/AuthScreen';
import { WaitingApprovalScreen } from './components/WaitingApprovalScreen';
import { PatientApp } from './components/PatientApp';
import { DoctorDashboard } from './components/DoctorDashboard';
import { PharmacistDashboard } from './components/PharmacistDashboard';
import { LabDashboard } from './components/LabDashboard';
import { AdminPanel } from './components/AdminPanel';
import { LegalAndSupportModal, LegalTab } from './components/LegalAndSupportModal';
import { HealthPilotLogo } from './components/HealthPilotLogo';
import { AlertCircle, LogOut } from 'lucide-react';
import { UserRole } from './types';

function AppContent() {
  const { 
    currentUser, isAuthenticated, isNewGoogleUser, logout, authLoading
  } = useAuth();
  const { language, toggleLanguage } = useT();

  const [unauthScreen, setUnauthScreen] = useState<'splash' | 'welcome' | 'role_select' | 'auth'>('splash');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin'>('login');
  const [authRole, setAuthRole] = useState<UserRole>('patient');
  const [isLargeFont, setIsLargeFont] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('healthpilot_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return false; // Default to LIGHT theme; do NOT follow OS dark-mode setting
  });

  useEffect(() => {
    try {
      localStorage.setItem('healthpilot_dark_mode', String(isDarkMode));
    } catch {}
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; tab: LegalTab }>({
    isOpen: false,
    tab: 'terms'
  });

  const openLegal = (tab: LegalTab) => setLegalModal({ isOpen: true, tab });
  const closeLegal = () => setLegalModal(prev => ({ ...prev, isOpen: false }));

  // New Google OAuth User completing profile
  if (isNewGoogleUser) {
    return (
      <div className="relative">
        <AuthScreen
          initialMode="signup"
          initialRole="patient"
          onBack={() => {}}
          language={language}
          isDarkMode={isDarkMode}
          onToggleLanguage={toggleLanguage}
          onOpenLegal={openLegal}
        />
        <LegalAndSupportModal
          isOpen={legalModal.isOpen}
          initialTab={legalModal.tab}
          onClose={closeLegal}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  // Visible loading state while verifying persistent session
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B2A6F] via-[#1769E0] to-[#0FB5A0] flex flex-col items-center justify-center p-6 text-white font-sans select-none">
        <div className="w-20 h-20 rounded-[28px] bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-2xl border border-white/25 animate-pulse">
          <HealthPilotLogo size="lg" variant="icon-only" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-white">HealthPilot</h2>
        <p className="text-xs text-teal-200 uppercase tracking-widest font-bold mb-4">Health Beyond Borders</p>
        <div className="flex items-center gap-2 text-xs text-blue-100 font-semibold bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
          <span className="w-2 h-2 rounded-full bg-teal-300 animate-ping" />
          <span>Connecting to healthcare services...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated visitors
  if (!isAuthenticated || !currentUser) {
    if (unauthScreen === 'splash') {
      return (
        <div onClick={() => setUnauthScreen('welcome')} className="cursor-pointer" title="Click anywhere to continue">
          <SplashScreen onProceed={() => setUnauthScreen('welcome')} />
        </div>
      );
    }

    if (unauthScreen === 'role_select') {
      return (
        <div className="relative">
          <RoleSelectScreen
            onSelectRole={(role) => {
              if (role === 'super_admin' || role === 'sub_admin') {
                setAuthRole('super_admin');
                setAuthMode('admin');
              } else {
                setAuthRole(role);
                setAuthMode('login');
              }
              setUnauthScreen('auth');
            }}
            onBack={() => setUnauthScreen('welcome')}
            language={language}
            isDarkMode={isDarkMode}
            onToggleLanguage={toggleLanguage}
          />
          <LegalAndSupportModal
            isOpen={legalModal.isOpen}
            initialTab={legalModal.tab}
            onClose={closeLegal}
            isDarkMode={isDarkMode}
          />
        </div>
      );
    }

    if (unauthScreen === 'auth') {
      return (
        <div className="relative">
          <AuthScreen
            initialMode={authMode}
            initialRole={authRole}
            onBack={() => authMode === 'signup' ? setUnauthScreen('welcome') : setUnauthScreen('role_select')}
            language={language}
            isDarkMode={isDarkMode}
            onToggleLanguage={toggleLanguage}
            onOpenLegal={openLegal}
          />
          <LegalAndSupportModal
            isOpen={legalModal.isOpen}
            initialTab={legalModal.tab}
            onClose={closeLegal}
            isDarkMode={isDarkMode}
          />
        </div>
      );
    }

    return (
      <div className="relative">
        <WelcomeScreen
          onGoToLogin={() => setUnauthScreen('role_select')}
          onGoToSignUp={() => {
            setAuthRole('patient');
            setAuthMode('signup');
            setUnauthScreen('auth');
          }}
          language={language}
          isDarkMode={isDarkMode}
          onToggleLanguage={toggleLanguage}
          onToggleDarkMode={() => setIsDarkMode(d => !d)}
          onOpenLegal={openLegal}
        />
        <LegalAndSupportModal
          isOpen={legalModal.isOpen}
          initialTab={legalModal.tab}
          onClose={closeLegal}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  // Healthcare provider waiting for admin document approval
  if (currentUser.status === 'Pending') {
    return (
      <ErrorBoundary fallbackTitle="Approval Status Screen Error">
        <WaitingApprovalScreen />
      </ErrorBoundary>
    );
  }

  // Account Suspended or Blocked
  if (currentUser.status === 'Suspended' || currentUser.status === 'Blocked') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-extrabold mb-2">Account {currentUser.status}</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Your account is currently restricted. Please contact HealthPilot support for verification.
        </p>
        <button
          onClick={logout}
          className="px-5 py-2.5 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    );
  }

  // Authenticated Role Dashboards
  return (
    <div className={`min-h-[100dvh] flex flex-col ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <OfflineBanner />

      <main className="flex-1">
        {currentUser.role === 'patient' && (
          <ErrorBoundary fallbackTitle="Patient Portal Error">
            <PatientApp
              isLargeFont={isLargeFont}
              language={language}
              isDarkMode={isDarkMode}
              onToggleLanguage={toggleLanguage}
              onToggleFont={() => setIsLargeFont(f => !f)}
              onToggleDarkMode={() => setIsDarkMode(d => !d)}
              onOpenLegal={openLegal}
            />
          </ErrorBoundary>
        )}

        {currentUser.role === 'doctor' && (
          <ErrorBoundary fallbackTitle="Doctor Portal Error">
            <DoctorDashboard />
          </ErrorBoundary>
        )}

        {currentUser.role === 'pharmacist' && (
          <ErrorBoundary fallbackTitle="Pharmacy Portal Error">
            <PharmacistDashboard />
          </ErrorBoundary>
        )}

        {currentUser.role === 'lab' && (
          <ErrorBoundary fallbackTitle="Lab Portal Error">
            <LabDashboard />
          </ErrorBoundary>
        )}

        {(currentUser.role === 'super_admin' || currentUser.role === 'sub_admin') && (
          <ErrorBoundary fallbackTitle="Admin Panel Error">
            <AdminPanel />
          </ErrorBoundary>
        )}
      </main>

      <LegalAndSupportModal
        isOpen={legalModal.isOpen}
        initialTab={legalModal.tab}
        onClose={closeLegal}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
