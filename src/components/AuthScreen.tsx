import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../types';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { friendlyAuthError } from '../firebase';
import { HealthPilotLogo } from './HealthPilotLogo';
import { 
  ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, 
  AlertCircle, CheckCircle2, Globe, Check, X, Shield, Sparkles 
} from 'lucide-react';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup' | 'admin';
  initialRole?: UserRole;
  onBack: () => void;
  language: 'en' | 'hi';
  isDarkMode: boolean;
  onToggleLanguage: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'contact') => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  initialRole = 'patient',
  onBack,
  language,
  isDarkMode,
  onToggleLanguage,
  onOpenLegal
}) => {
  const { 
    loginWithEmail, signupWithEmail, resetUserPassword, loginWithGoogle,
    completeGoogleProfile, cancelGoogleSetup, isNewGoogleUser, googlePendingUser,
    isAdminLocked
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field-specific validation error states
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Common Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Patient extra fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');

  // Doctor extra fields
  const [specialty, setSpecialty] = useState('General Physician');
  const [councilRegNo, setCouncilRegNo] = useState('');
  const [qualification, setQualification] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  // Pharmacist extra fields
  const [pharmacyName, setPharmacyName] = useState('');
  const [drugLicenceNumber, setDrugLicenceNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');

  // Lab extra fields
  const [labName, setLabName] = useState('');
  const [labAccreditation, setLabAccreditation] = useState<'NABL' | 'CAP' | 'ISO' | 'State Certified'>('NABL');
  const [labLicenceNumber, setLabLicenceNumber] = useState('');
  const [labAddress, setLabAddress] = useState('');

  // Admin Form States
  const [adminEmail, setAdminEmail] = useState(ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');

  // Files to upload for HCP / Lab / Pharmacist documents
  const [filesToUpload, setFilesToUpload] = useState<{ [key: string]: File }>({});

  // Forgot Password Flow States
  const [forgotStep, setForgotStep] = useState<'none' | 'email' | 'sent'>('none');
  const [forgotEmail, setForgotEmail] = useState('');

  // Live password validation rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  const handleFileChange = (key: string, file: File | null) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, [key]: 'File too large. Maximum size is 5 MB.' }));
        return;
      }
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setFieldErrors(prev => ({ ...prev, [key]: 'Only PDF, JPG, JPEG or PNG files allowed.' }));
        return;
      }
    }
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
    setFilesToUpload(prev => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
  };

  const renderDocPicker = (key: string, label: string, required: boolean) => {
    const selectedFile = filesToUpload[key];
    const err = fieldErrors[key];

    return (
      <div key={key} className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-slate-700 dark:text-slate-300">
            {label} {required ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
          </span>
          {selectedFile && (
            <span className="text-emerald-500 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Selected
            </span>
          )}
        </div>

        {selectedFile ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 truncate pr-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate font-medium text-slate-800 dark:text-slate-200">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => handleFileChange(key, null)}
              className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md text-[10px] font-bold transition-all shrink-0"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className={`flex items-center justify-between p-2 rounded-xl border border-dashed cursor-pointer transition-all ${
            err ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">PDF, JPG or PNG (max 5 MB)</span>
            <span className="px-2 py-1 bg-[#1769E0] text-white rounded-lg text-[10px] font-bold shrink-0">Upload File</span>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0] || null;
                if (f) handleFileChange(key, f);
              }}
            />
          </label>
        )}
        {err && <p className="text-red-500 text-[11px] font-semibold mt-0.5">{err}</p>}
      </div>
    );
  };

  // Scroll-to-error helper
  const scrollToFirstError = () => {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.border-red-500, .text-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inputToFocus = (firstErrorElement.tagName === 'INPUT' || firstErrorElement.tagName === 'SELECT' || firstErrorElement.tagName === 'TEXTAREA')
          ? firstErrorElement
          : firstErrorElement.closest('div')?.querySelector('input, select, textarea');
        if (inputToFocus && 'focus' in inputToFocus && typeof (inputToFocus as HTMLElement).focus === 'function') {
          (inputToFocus as HTMLElement).focus();
        }
      }
    }, 100);
  };

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    handleRoleChange(initialRole);
  }, [initialRole]);

  // If user signed in with Google and displayName exists, prefill name
  React.useEffect(() => {
    if (googlePendingUser) {
      if (googlePendingUser.displayName && !fullName) {
        setFullName(googlePendingUser.displayName);
      }
      if (googlePendingUser.email && !email) {
        setEmail(googlePendingUser.email);
      }
    }
  }, [googlePendingUser]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setFieldErrors({});
    setFilesToUpload({});
  };

  const getRoleGradient = () => {
    switch (selectedRole) {
      case 'patient': return 'from-[#1769E0] to-blue-600 shadow-blue-500/25';
      case 'doctor': return 'from-[#0FB5A0] to-teal-600 shadow-teal-500/25';
      case 'lab': return 'from-[#8B5CF6] to-violet-600 shadow-purple-500/25';
      case 'pharmacist': return 'from-[#10B981] to-emerald-600 shadow-emerald-500/25';
      default: return 'from-[#1769E0] to-[#0FB5A0] shadow-blue-500/25';
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle(selectedRole);
      if (!res.success) {
        if (!res.cancelled && res.error) {
          setErrorMessage(res.error);
        }
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/user-cancelled' &&
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        !err?.message?.includes('user-cancelled')
      ) {
        setErrorMessage(friendlyAuthError(err));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Validation function
  const validateForm = async (isSignup: boolean): Promise<boolean> => {
    const errors: { [key: string]: string } = {};

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!isSignup) {
      // Login mode only needs email and password presence
      if (!password) {
        errors.password = 'Password is required.';
      }
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        console.warn('Form validation failed on fields:', Object.keys(errors));
      }
      return Object.keys(errors).length === 0;
    }

    // Sign up / Profile completion validations
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }

    // Phone: Indian 10-digit mobile number
    // TODO: Integrate phone OTP verification gateway (e.g. MSG91, Twilio, or Firebase Phone Auth) when production SMS provider is activated.
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!phone.trim()) {
      errors.phone = 'Mobile number is required.';
    } else if (!indianPhoneRegex.test(cleanPhone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    // Password validations (for email sign up)
    if (!isNewGoogleUser) {
      if (!password) {
        errors.password = 'Password is required.';
      } else if (!isPasswordValid) {
        errors.password = 'Password must meet all 3 security requirements below.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    // Terms
    if (!agreeTerms) {
      errors.terms = 'You must accept the Terms of Service & Privacy Policy.';
    }

    // Role-specific validations
    if (selectedRole === 'patient') {
      if (!address.trim()) {
        errors.address = 'Home / delivery address is required.';
      }
      if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
        errors.age = 'Please enter a valid age (1-120).';
      }
    }

    if (selectedRole === 'doctor') {
      if (!specialty.trim()) {
        errors.specialty = 'Medical specialty is required.';
      }
      if (!qualification.trim()) {
        errors.qualification = 'Medical qualification (e.g. MBBS, MD) is required.';
      }
      if (!clinicAddress.trim()) {
        errors.clinicAddress = 'Clinic or hospital address is required.';
      }
      if (!consultationFee || parseInt(consultationFee) <= 0) {
        errors.consultationFee = 'Please enter a valid consultation fee.';
      }
      if (!councilRegNo.trim()) {
        errors.councilRegNo = 'Medical Council Registration Number is required.';
      } else if (councilRegNo.trim().length < 4) {
        errors.councilRegNo = 'Council registration number must be at least 4 characters.';
      }
      if (!filesToUpload.degreeUrl) {
        errors.degreeUrl = 'Degree Certificate document (PDF/Image) is required.';
      }
      if (!filesToUpload.licenceUrl) {
        errors.licenceUrl = 'Medical Council Registration Certificate is required.';
      }
    }

    if (selectedRole === 'pharmacist') {
      if (!pharmacyName.trim()) {
        errors.pharmacyName = 'Pharmacy / Chemist name is required.';
      }
      if (!pharmacyAddress.trim()) {
        errors.pharmacyAddress = 'Pharmacy shop address is required.';
      }
      if (!drugLicenceNumber.trim()) {
        errors.drugLicenceNumber = 'Drug Licence Number (Form 20B/21B) is required.';
      } else if (drugLicenceNumber.trim().length < 5) {
        errors.drugLicenceNumber = 'Drug licence number must be at least 5 characters.';
      }

      // GSTIN Validation (15 alphanumeric characters)
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstNumber.trim()) {
        errors.gstNumber = '15-character GSTIN Number is required.';
      } else if (!gstinRegex.test(gstNumber.trim().toUpperCase())) {
        errors.gstNumber = 'Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 09AAAAA0000A1Z5).';
      }
      if (!filesToUpload.licenceUrl) {
        errors.licenceUrl = 'Drug Licence document (PDF/Image) is required.';
      }
      if (!filesToUpload.gstCertUrl) {
        errors.gstCertUrl = 'GST Certificate document (PDF/Image) is required.';
      }
    }

    if (selectedRole === 'lab') {
      if (!labName.trim()) {
        errors.labName = 'Diagnostic Centre / Lab Name is required.';
      }
      if (!labAddress.trim()) {
        errors.labAddress = 'Diagnostic centre address is required.';
      }
      if (!labLicenceNumber.trim()) {
        errors.labLicenceNumber = 'Clinical / NABL Licence Number is required.';
      } else if (labLicenceNumber.trim().length < 4) {
        errors.labLicenceNumber = 'Licence number must be at least 4 characters.';
      }
      if (!filesToUpload.accreditationCertUrl) {
        errors.accreditationCertUrl = 'Accreditation / Lab Licence Certificate document is required.';
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      console.warn('Form validation failed on fields:', Object.keys(errors));
    }
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isValid = await validateForm(false);
    if (!isValid) {
      setErrorMessage("Please fix the highlighted fields above.");
      scrollToFirstError();
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmail(selectedRole, email, password);
      if (!res.success) {
        setErrorMessage(friendlyAuthError(res.error));
      }
    } catch (err: any) {
      setErrorMessage(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await loginWithEmail('super_admin', adminEmail, adminPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Admin authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isValid = await validateForm(true);
    if (!isValid) {
      setErrorMessage("Please fix the highlighted fields above.");
      scrollToFirstError();
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.replace(/[^0-9]/g, '').slice(-10)}`,
        password,
        age: parseInt(age),
        gender,
        bloodGroup,
        address: address.trim(),
        specialty,
        councilRegistrationNumber: councilRegNo.trim(),
        qualification,
        clinicAddress,
        consultationFee,
        pharmacyName: pharmacyName.trim(),
        drugLicenceNumber: drugLicenceNumber.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        pharmacyAddress,
        labName: labName.trim(),
        accreditation: labAccreditation,
        licenceNumber: labLicenceNumber.trim(),
        labAddress,
        filesToUpload
      };

      const res = await signupWithEmail(selectedRole, payload);
      if (!res.success) {
        setErrorMessage(friendlyAuthError(res.error));
      } else {
        const msg = selectedRole === 'patient'
          ? 'Account created! Welcome to HealthPilot.'
          : 'Account submitted! Note: Admin approval is required before dashboard activation.';
        setSuccessMessage(msg);
      }
    } catch (err: any) {
      setErrorMessage(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // First-time Google Sign-In Profile Completion
  const handleGoogleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isValid = await validateForm(true);
    if (!isValid) {
      setErrorMessage("Please fix the highlighted fields above.");
      scrollToFirstError();
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        name: fullName.trim(),
        phone: phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.replace(/[^0-9]/g, '').slice(-10)}`,
        age: parseInt(age),
        gender,
        bloodGroup,
        address: address.trim(),
        specialty,
        councilRegistrationNumber: councilRegNo.trim(),
        qualification,
        clinicAddress,
        consultationFee,
        pharmacyName: pharmacyName.trim(),
        drugLicenceNumber: drugLicenceNumber.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        pharmacyAddress,
        labName: labName.trim(),
        accreditation: labAccreditation,
        licenceNumber: labLicenceNumber.trim(),
        labAddress,
        filesToUpload
      };

      const res = await completeGoogleProfile(selectedRole, payload);
      if (!res.success) {
        setErrorMessage(friendlyAuthError(res.error));
      }
    } catch (err: any) {
      setErrorMessage(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await resetUserPassword(forgotEmail);
      if (res.success) {
        setForgotStep('sent');
      } else {
        setErrorMessage(res.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setErrorMessage(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] ${isDarkMode ? 'mesh-bg-dark text-slate-100' : 'mesh-bg-light text-slate-900'} flex flex-col items-center justify-between p-4 sm:p-6 font-sans relative overflow-x-hidden`}>
      {/* Background ambient orbs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isNewGoogleUser ? cancelGoogleSetup : onBack}
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
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggleLanguage}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' 
              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
          } backdrop-blur-md shadow-sm cursor-pointer`}
        >
          <Globe className="w-3.5 h-3.5 text-[#1769E0]" />
          <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
        </motion.button>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-md my-auto py-4 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-[32px] border ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' 
              : 'bg-white border-slate-300 shadow-xl shadow-blue-950/10'
          } p-6 relative overflow-hidden`}
        >
          {/* Top Brand Stripe */}
          <div className="h-2 w-full bg-gradient-to-r from-[#1769E0] via-[#0FB5A0] to-[#8B5CF6] absolute top-0 left-0" />

          {/* 1. FIRST-TIME GOOGLE SIGN-IN: ROLE & PROFILE COMPLETION */}
          {isNewGoogleUser && googlePendingUser ? (
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-[#0FB5A0] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Google Sign-In Connected</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#0A1A45] dark:text-white tracking-tight">
                  Complete Your Profile
                </h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  Signed in as <strong>{googlePendingUser.email}</strong>. Select your role to finalize registration.
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1 text-center">
                  Select Role
                </span>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[11px] font-bold text-center border border-slate-300 dark:border-slate-700">
                  {[
                    { id: 'patient', label: 'Patient', activeClass: 'bg-gradient-to-r from-[#1769E0] to-blue-600 text-white shadow-md shadow-blue-500/20' },
                    { id: 'doctor', label: 'Doctor', activeClass: 'bg-gradient-to-r from-[#0FB5A0] to-teal-600 text-white shadow-md shadow-teal-500/20' },
                    { id: 'pharmacist', label: 'Pharmacy', activeClass: 'bg-gradient-to-r from-[#10B981] to-emerald-600 text-white shadow-md shadow-emerald-500/20' },
                    { id: 'lab', label: 'Lab', activeClass: 'bg-gradient-to-r from-[#8B5CF6] to-violet-600 text-white shadow-md shadow-purple-500/20' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleRoleChange(tab.id as UserRole)}
                      className={`py-2 rounded-xl transition-all ${
                        selectedRole === tab.id 
                          ? tab.activeClass 
                          : 'text-slate-700 dark:text-slate-300 hover:text-[#0A1A45] dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleGoogleProfileSubmit} className="space-y-3">
                <div className="max-h-[60vh] sm:max-h-[480px] overflow-y-auto pr-1 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder={selectedRole === 'doctor' ? 'Dr. Ramesh Saxena' : 'e.g. Priya Sharma'}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                        fieldErrors.fullName ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    {fieldErrors.fullName && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile (+91) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                        fieldErrors.phone ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    {fieldErrors.phone && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.phone}</p>}
                  </div>

                  {/* Patient Fields */}
                  {selectedRole === 'patient' && (
                    <div className="space-y-2.5 p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl text-xs">
                      <span className="font-extrabold text-[#1769E0] block">Patient Personal Details</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Age (1-120) *</label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            required
                            placeholder="Age"
                            value={age}
                            onChange={e => setAge(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.age ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.age && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.age}</p>}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                          <select
                            value={gender}
                            onChange={e => setGender(e.target.value as any)}
                            className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group *</label>
                          <select
                            value={bloodGroup}
                            onChange={e => setBloodGroup(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Home / Delivery Address *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Enter your home or delivery address"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.address ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.address && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.address}</p>}
                      </div>
                    </div>
                  )}

                  {/* Doctor Credentials */}
                  {selectedRole === 'doctor' && (
                    <div className="space-y-2.5 p-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-2xl text-xs">
                      <span className="font-extrabold text-[#0FB5A0] block">Doctor Credentials & Practice</span>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Medical Council Registration No. *</label>
                        <input
                          type="text"
                          required
                          placeholder="NMC Reg No (e.g. NMC/UP/2026/099)"
                          value={councilRegNo}
                          onChange={e => setCouncilRegNo(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.councilRegNo ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.councilRegNo && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.councilRegNo}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Specialty *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. General Physician"
                            value={specialty}
                            onChange={e => setSpecialty(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.specialty ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.specialty && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.specialty}</p>}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Qualification *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. MBBS, MD"
                            value={qualification}
                            onChange={e => setQualification(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.qualification ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.qualification && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.qualification}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Consultation Fee (INR) *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="e.g. 500"
                          value={consultationFee}
                          onChange={e => setConsultationFee(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.consultationFee ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.consultationFee && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.consultationFee}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinic / Hospital Address *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Enter clinic or hospital address"
                          value={clinicAddress}
                          onChange={e => setClinicAddress(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.clinicAddress ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.clinicAddress && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.clinicAddress}</p>}
                      </div>
                      {/* Required Doctor Documents */}
                      <div className="pt-1 space-y-2 border-t border-teal-200 dark:border-teal-900/60">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">Required Verification Documents</span>
                        {renderDocPicker('degreeUrl', 'Degree Certificate', true)}
                        {renderDocPicker('licenceUrl', 'Medical Council Registration Certificate', true)}
                        {renderDocPicker('photoUrl', 'Passport Photo', false)}
                      </div>
                    </div>
                  )}

                  {/* Pharmacist Credentials */}
                  {selectedRole === 'pharmacist' && (
                    <div className="space-y-2.5 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs">
                      <span className="font-extrabold text-[#10B981] block">Pharmacy Details</span>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Pharmacy / Chemist Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Pharmacy / Chemist Name"
                          value={pharmacyName}
                          onChange={e => setPharmacyName(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.pharmacyName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.pharmacyName && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.pharmacyName}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Drug Licence No. *</label>
                          <input
                            type="text"
                            required
                            placeholder="Drug Licence (20B/21B)"
                            value={drugLicenceNumber}
                            onChange={e => setDrugLicenceNumber(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.drugLicenceNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.drugLicenceNumber && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.drugLicenceNumber}</p>}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="GSTIN (15 chars)"
                            value={gstNumber}
                            onChange={e => setGstNumber(e.target.value.toUpperCase())}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs font-mono uppercase text-slate-900 dark:text-white transition-all ${
                              fieldErrors.gstNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.gstNumber && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.gstNumber}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Pharmacy Address *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Pharmacy shop address"
                          value={pharmacyAddress}
                          onChange={e => setPharmacyAddress(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.pharmacyAddress ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.pharmacyAddress && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.pharmacyAddress}</p>}
                      </div>
                      {/* Required Pharmacy Documents */}
                      <div className="pt-1 space-y-2 border-t border-emerald-200 dark:border-emerald-900/60">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">Required Verification Documents</span>
                        {renderDocPicker('licenceUrl', 'Drug Licence Document', true)}
                        {renderDocPicker('gstCertUrl', 'GST Certificate Document', true)}
                      </div>
                    </div>
                  )}

                  {/* Lab Credentials */}
                  {selectedRole === 'lab' && (
                    <div className="space-y-2.5 p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-2xl text-xs">
                      <span className="font-extrabold text-[#8B5CF6] block">Diagnostic Lab Details</span>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnostic Centre Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Diagnostic Centre Name"
                          value={labName}
                          onChange={e => setLabName(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.labName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.labName && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.labName}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinical Licence No. *</label>
                          <input
                            type="text"
                            required
                            placeholder="Clinical Licence No."
                            value={labLicenceNumber}
                            onChange={e => setLabLicenceNumber(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.labLicenceNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.labLicenceNumber && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.labLicenceNumber}</p>}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Accreditation *</label>
                          <select
                            value={labAccreditation}
                            onChange={e => setLabAccreditation(e.target.value as any)}
                            className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          >
                            <option value="NABL">NABL</option>
                            <option value="CAP">CAP</option>
                            <option value="ISO">ISO</option>
                            <option value="State Certified">State Certified</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Lab Address *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Lab Address"
                          value={labAddress}
                          onChange={e => setLabAddress(e.target.value)}
                          className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                            fieldErrors.labAddress ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                        {fieldErrors.labAddress && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.labAddress}</p>}
                      </div>
                      {/* Required Lab Documents */}
                      <div className="pt-1 space-y-2 border-t border-purple-200 dark:border-purple-900/60">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">Required Verification Documents</span>
                        {renderDocPicker('accreditationCertUrl', 'Accreditation / Lab Licence Certificate', true)}
                      </div>
                    </div>
                  )}

                  {/* Terms */}
                  <label className="flex items-start gap-2 cursor-pointer pt-1 text-xs text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="rounded text-[#1769E0] mt-0.5"
                    />
                    <span>
                      I agree to HealthPilot{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegal?.('terms')}
                        className="text-[#1769E0] font-bold underline"
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegal?.('privacy')}
                        className="text-[#0FB5A0] font-bold underline"
                      >
                        Privacy Policy
                      </button>.
                    </span>
                  </label>
                  {fieldErrors.terms && <p className="text-red-500 text-[11px] font-semibold">{fieldErrors.terms}</p>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 bg-gradient-to-r ${getRoleGradient()} text-white rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all mt-2`}
                >
                  {isLoading ? 'Saving Profile...' : selectedRole === 'patient' ? 'Complete Profile & Enter' : 'Submit for Admin Approval'}
                </motion.button>

                <button
                  type="button"
                  onClick={cancelGoogleSetup}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white text-center"
                >
                  Cancel & Sign Out
                </button>
              </form>
            </div>
          ) : forgotStep !== 'none' ? (
            /* FORGOT PASSWORD FLOW */
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <h2 className="text-xl font-extrabold text-[#0A1A45] dark:text-white">
                  {forgotStep === 'email' ? 'Reset Your Password' : 'Reset Link Dispatched'}
                </h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  {forgotStep === 'email' 
                    ? 'Enter your registered email address to receive password reset instructions.'
                    : `We have sent a secure password reset link to ${forgotEmail}. Please check your inbox.`}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {forgotStep === 'email' ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Registered Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya.sharma@gmail.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className={`w-full p-3.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/20 transition-all ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] hover:from-blue-600 hover:to-teal-600 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all"
                  >
                    {isLoading ? 'Sending Link...' : 'Send Password Reset Email'}
                  </motion.button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-[#0FB5A0] flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Follow the link in your email to choose a new password, then return here to login.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => { setForgotStep('none'); setMode('login'); }}
                    className="w-full py-3.5 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] text-white rounded-2xl font-extrabold text-xs shadow-lg transition-all"
                  >
                    Back to Login
                  </motion.button>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setForgotStep('none'); setErrorMessage(null); }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white text-center"
              >
                Back to Login
              </button>
            </div>
          ) : mode === 'admin' ? (
            /* ADMIN LOGIN */
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-400/20 inline-block mb-1">
                  Master Operations
                </span>
                <h2 className="text-xl font-extrabold text-[#0A1A45] dark:text-white">
                  Admin Console
                </h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  Designated Google account or secure administrator credentials
                </p>
              </div>

              {/* Admin Google Sign-In button */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-extrabold text-xs flex items-center justify-center gap-3 shadow-sm transition-all"
              >
                <GoogleIcon />
                <span>{isGoogleLoading ? 'Connecting...' : 'Sign In with Admin Google Account'}</span>
              </motion.button>

              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or email + password</span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {isAdminLocked ? (
                <div className="p-4 bg-red-100 dark:bg-red-950/60 border-2 border-red-500 rounded-2xl text-center">
                  <Lock className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-extrabold text-sm text-red-900 dark:text-red-200">Account Locked</h4>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    5 consecutive failed attempts. Admin locked for 15 minutes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Admin Email</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className={`w-full p-3 rounded-2xl border text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        className={`w-full p-3 pr-10 rounded-2xl border text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all ${
                          isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#0B2A6F] to-slate-900 hover:from-slate-900 hover:to-slate-950 text-amber-400 border border-amber-400/30 rounded-2xl font-extrabold text-xs shadow-lg shadow-blue-950/30 transition-all mt-2"
                  >
                    {isLoading ? 'Verifying...' : 'Authorize Admin Portal'}
                  </motion.button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(null); }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white text-center"
              >
                Return to Patient / Healthcare Login
              </button>
            </div>
          ) : (
            /* USER LOGIN & SIGNUP */
            <div className="space-y-4 pt-2">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-[#0A1A45] dark:text-white tracking-tight">
                  {mode === 'login' ? 'Welcome back' : 'Create an Account'}
                </h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  {mode === 'login' ? 'Sign in to access your healthcare portal' : 'Join HealthPilot to access trusted healthcare'}
                </p>
              </div>

              {/* Role Selector Tabs */}
              <div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1 text-center">
                  Select Role
                </span>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[11px] font-bold text-center border border-slate-300 dark:border-slate-700">
                  {[
                    { id: 'patient', label: 'Patient', activeClass: 'bg-gradient-to-r from-[#1769E0] to-blue-600 text-white shadow-md shadow-blue-500/20' },
                    { id: 'doctor', label: 'Doctor', activeClass: 'bg-gradient-to-r from-[#0FB5A0] to-teal-600 text-white shadow-md shadow-teal-500/20' },
                    { id: 'pharmacist', label: 'Pharmacy', activeClass: 'bg-gradient-to-r from-[#10B981] to-emerald-600 text-white shadow-md shadow-emerald-500/20' },
                    { id: 'lab', label: 'Lab', activeClass: 'bg-gradient-to-r from-[#8B5CF6] to-violet-600 text-white shadow-md shadow-purple-500/20' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleRoleChange(tab.id as UserRole)}
                      className={`py-2 rounded-xl transition-all ${
                        selectedRole === tab.id 
                          ? tab.activeClass 
                          : 'text-slate-700 dark:text-slate-300 hover:text-[#0A1A45] dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GOOGLE SIGN IN BUTTON FOR EVERY ROLE */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-extrabold text-xs flex items-center justify-center gap-3 shadow-sm transition-all"
              >
                <GoogleIcon />
                <span>
                  {isGoogleLoading ? 'Connecting...' : mode === 'login' ? `Continue with Google as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : 'Sign up with Google'}
                </span>
              </motion.button>

              <div className="flex items-center my-1">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or with email</span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* 1. LOGIN FORM */}
              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya.sharma@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={`w-full p-3.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/20 transition-all ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    {fieldErrors.email && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.email}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => { setForgotStep('email'); setErrorMessage(null); }}
                        className="text-[11px] font-bold text-[#1769E0] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={`w-full p-3.5 pr-10 rounded-2xl border text-xs font-semibold focus:outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/20 transition-all ${
                          isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.password}</p>}
                  </div>

                  <div className="flex items-center justify-between py-1 text-xs text-slate-600 dark:text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded text-[#1769E0] focus:ring-0"
                      />
                      <span>Remember me</span>
                    </label>
                    <span className="text-[10px] text-slate-400">15m idle auto-logout</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 bg-gradient-to-r ${getRoleGradient()} text-white rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all mt-2`}
                  >
                    {isLoading ? 'Authenticating...' : `Login as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
                  </motion.button>

                  <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span>New to HealthPilot? </span>
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setErrorMessage(null); setFieldErrors({}); }}
                      className="font-bold text-[#1769E0] hover:underline"
                    >
                      Create account
                    </button>
                  </div>
                </form>
              ) : (
                /* 2. SIGN UP FORM */
                <form onSubmit={handleSignUpSubmit} className="space-y-3">
                  <div className="max-h-[60vh] sm:max-h-[480px] overflow-y-auto pr-1 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder={selectedRole === 'doctor' ? 'Dr. Ramesh Saxena' : 'e.g. Priya Sharma'}
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                          fieldErrors.fullName ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      {fieldErrors.fullName && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.fullName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="name@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                            fieldErrors.email ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                        {fieldErrors.email && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.email}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile (+91) *</label>
                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                            fieldErrors.phone ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                        {fieldErrors.phone && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.phone}</p>}
                      </div>
                    </div>

                    {/* Role-Specific Sign Up Fields */}
                    {selectedRole === 'patient' && (
                      <div className="space-y-2.5 p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl text-xs">
                        <span className="font-extrabold text-[#1769E0] block">Patient Personal Details</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Age (1-120) *</label>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              required
                              placeholder="Age"
                              value={age}
                              onChange={e => setAge(e.target.value)}
                              className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                                fieldErrors.age ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            {fieldErrors.age && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.age}</p>}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                            <select
                              value={gender}
                              onChange={e => setGender(e.target.value as any)}
                              className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group *</label>
                            <select
                              value={bloodGroup}
                              onChange={e => setBloodGroup(e.target.value)}
                              className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                            >
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Home / Delivery Address *</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Enter your home or delivery address"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.address ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.address && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.address}</p>}
                        </div>
                      </div>
                    )}

                    {selectedRole === 'doctor' && (
                      <div className="space-y-2.5 p-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-2xl text-xs">
                        <span className="font-extrabold text-[#0FB5A0] block">Doctor Credentials & Practice</span>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Medical Council Registration No. *</label>
                          <input
                            type="text"
                            required
                            placeholder="NMC Reg No (e.g. NMC/UP/2026/099)"
                            value={councilRegNo}
                            onChange={e => setCouncilRegNo(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.councilRegNo ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.councilRegNo && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.councilRegNo}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Specialty *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. General Physician"
                              value={specialty}
                              onChange={e => setSpecialty(e.target.value)}
                              className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                                fieldErrors.specialty ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            {fieldErrors.specialty && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.specialty}</p>}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Qualification *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. MBBS, MD"
                              value={qualification}
                              onChange={e => setQualification(e.target.value)}
                              className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                                fieldErrors.qualification ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            {fieldErrors.qualification && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.qualification}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Consultation Fee (INR) *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="e.g. 500"
                            value={consultationFee}
                            onChange={e => setConsultationFee(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.consultationFee ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.consultationFee && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.consultationFee}</p>}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinic / Hospital Address *</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Enter clinic or hospital address"
                            value={clinicAddress}
                            onChange={e => setClinicAddress(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.clinicAddress ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.clinicAddress && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.clinicAddress}</p>}
                        </div>
                        {/* Required Doctor Documents */}
                        <div className="pt-1 space-y-2 border-t border-teal-200 dark:border-teal-900/60">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">Required Verification Documents</span>
                          {renderDocPicker('degreeUrl', 'Degree Certificate', true)}
                          {renderDocPicker('licenceUrl', 'Medical Council Registration Certificate', true)}
                          {renderDocPicker('photoUrl', 'Passport Photo', false)}
                        </div>
                      </div>
                    )}

                    {selectedRole === 'pharmacist' && (
                      <div className="space-y-2.5 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs">
                        <span className="font-extrabold text-[#10B981] block">Pharmacy Details</span>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Pharmacy / Chemist Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Pharmacy / Chemist Name"
                            value={pharmacyName}
                            onChange={e => setPharmacyName(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.pharmacyName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.pharmacyName && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.pharmacyName}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Drug Licence No. *</label>
                            <input
                              type="text"
                              required
                              placeholder="Drug Licence (20B/21B)"
                              value={drugLicenceNumber}
                              onChange={e => setDrugLicenceNumber(e.target.value)}
                              className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                                fieldErrors.drugLicenceNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            {fieldErrors.drugLicenceNumber && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.drugLicenceNumber}</p>}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="GSTIN (15 chars)"
                              value={gstNumber}
                              onChange={e => setGstNumber(e.target.value.toUpperCase())}
                              className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs font-mono uppercase text-slate-900 dark:text-white transition-all ${
                                fieldErrors.gstNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            {fieldErrors.gstNumber && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.gstNumber}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Pharmacy Address *</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Pharmacy shop address"
                            value={pharmacyAddress}
                            onChange={e => setPharmacyAddress(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.pharmacyAddress ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.pharmacyAddress && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.pharmacyAddress}</p>}
                        </div>
                        {/* Required Pharmacy Documents */}
                        <div className="pt-1 space-y-2 border-t border-emerald-200 dark:border-emerald-900/60">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">Required Verification Documents</span>
                          {renderDocPicker('licenceUrl', 'Drug Licence Document', true)}
                          {renderDocPicker('gstCertUrl', 'GST Certificate Document', true)}
                        </div>
                      </div>
                    )}

                    {selectedRole === 'lab' && (
                      <div className="space-y-2.5 p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-2xl text-xs">
                        <span className="font-extrabold text-[#8B5CF6] block">Diagnostic Lab Details</span>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnostic Centre Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Diagnostic Centre Name"
                            value={labName}
                            onChange={e => setLabName(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.labName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.labName && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.labName}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinical Licence No. *</label>
                            <input
                              type="text"
                              required
                              placeholder="Clinical Licence No."
                              value={labLicenceNumber}
                              onChange={e => setLabLicenceNumber(e.target.value)}
                              className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                                fieldErrors.labLicenceNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            {fieldErrors.labLicenceNumber && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.labLicenceNumber}</p>}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Accreditation *</label>
                            <select
                              value={labAccreditation}
                              onChange={e => setLabAccreditation(e.target.value as any)}
                              className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="NABL">NABL</option>
                              <option value="CAP">CAP</option>
                              <option value="ISO">ISO</option>
                              <option value="State Certified">State Certified</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Lab Address *</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Lab Address"
                            value={labAddress}
                            onChange={e => setLabAddress(e.target.value)}
                            className={`w-full p-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white transition-all ${
                              fieldErrors.labAddress ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                          {fieldErrors.labAddress && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.labAddress}</p>}
                        </div>
                        {/* Required Lab Documents */}
                        <div className="pt-1 space-y-2 border-t border-purple-200 dark:border-purple-900/60">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">Required Verification Documents</span>
                          {renderDocPicker('accreditationCertUrl', 'Accreditation / Lab Licence Certificate', true)}
                        </div>
                      </div>
                    )}

                    {/* Password Fields */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                            fieldErrors.password ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Confirm Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                            fieldErrors.confirmPassword ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                    {fieldErrors.password && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.password}</p>}
                    {fieldErrors.confirmPassword && <p className="text-red-500 text-[11px] font-semibold mt-1">{fieldErrors.confirmPassword}</p>}

                    {/* Live Password Rules Indicator */}
                    <div className="p-2.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl text-[11px] space-y-1 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-slate-500 block">Password Requirements:</span>
                      <div className="flex items-center gap-2">
                        {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Minimum 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}>At least one number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={hasSpecialChar ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Special symbol (!@#$%^&*)</span>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-2 cursor-pointer pt-1 text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={e => setAgreeTerms(e.target.checked)}
                        className="rounded text-[#1769E0] mt-0.5"
                      />
                      <span>
                        I agree to HealthPilot{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegal?.('terms')}
                          className="text-[#1769E0] font-bold underline hover:text-blue-700"
                        >
                          Terms of Service
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegal?.('privacy')}
                          className="text-[#0FB5A0] font-bold underline hover:text-teal-700"
                        >
                          DPDP Privacy Policy
                        </button>
                        , and Telemedicine Regulations.
                      </span>
                    </label>
                    {fieldErrors.terms && <p className="text-red-500 text-[11px] font-semibold">{fieldErrors.terms}</p>}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 bg-gradient-to-r ${getRoleGradient()} text-white rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all mt-2`}
                  >
                    {isLoading ? 'Creating Account...' : selectedRole === 'patient' ? 'Register & Enter App' : 'Submit for Admin Approval'}
                  </motion.button>

                  <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMessage(null); setFieldErrors({}); }}
                      className="font-bold text-[#1769E0] hover:underline"
                    >
                      Login here
                    </button>
                  </div>
                </form>
              )}

              {/* Platform Admin Login Link */}
              <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/70 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('admin'); setErrorMessage(null); }}
                  className="text-[11px] font-bold text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Platform Admin Login</span>
                </button>
              </div>

            </div>
          )}

        </motion.div>
      </div>

      {/* Footer with Compliance & Contact Links */}
      <div className="w-full max-w-md text-center text-[11px] text-slate-600 dark:text-slate-400 py-2 space-y-1 z-10 font-medium">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onOpenLegal?.('terms')}
            className="hover:text-[#0A1A45] dark:hover:text-slate-200 transition-colors"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onOpenLegal?.('privacy')}
            className="hover:text-[#0A1A45] dark:hover:text-slate-200 transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onOpenLegal?.('contact')}
            className="hover:text-[#1769E0] font-bold transition-colors"
          >
            Help & Contact
          </button>
        </div>
        <p>Protected by Firebase Security & 256-bit encryption • Telemedicine & DPDP Act Compliant</p>
      </div>

    </div>
  );
};
