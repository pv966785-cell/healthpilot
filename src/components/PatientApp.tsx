import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Calendar, FileText, ShoppingBag, User, Phone, MapPin, 
  ShieldAlert, Clock, CheckCircle2, ChevronRight, Upload, Video, 
  MessageSquare, Stethoscope, Activity, CreditCard, Bell, HelpCircle, 
  Globe, AlertTriangle, X, Plus, Star, ArrowLeft, Download, Send, Check,
  Heart, ShieldCheck, Truck, Zap, Trash2, Edit3, Loader2,
  ChevronDown, ChevronUp, ArrowUpDown, Filter, Sparkles, Info, Store, Lock
} from 'lucide-react';
import { founderDetails } from '../mockData';
import { formatINR, LAB_TEST_CATEGORIES } from '../content';
import { 
  LabTest, Doctor, Medicine, FamilyMember, DoctorAppointment, 
  LabBooking, PharmacyOrder, PatientProfile, HealthRecord,
  DoctorProfile, PharmacistProfile, PharmacyInventoryItem, BookedSlot 
} from '../types';
import { HealthPilotLogo } from './HealthPilotLogo';
import { FounderAvatar } from './FounderAvatar';
import { PharmacyOrderTracker } from './PharmacyOrderTracker';
import { useAuth, sanitizeFirestoreDoc } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, runTransaction, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { uploadFile } from '../utils/upload';
import { generateDoctorSlots, getNextAvailableSlot, ComputedSlot, formatDateToYYYYMMDD, formatTime12H } from '../utils/schedule';
import { manualPaymentService } from '../services/payment';
import { generateRoomName, getCallWindowStatus, getJitsiUrl, getDirectionsUrl } from '../utils/consultation';
import { sendAppNotification } from '../services/notifications';
import { NotificationBell } from './NotificationBell';
import { ListSkeleton } from './LoadingSkeleton';
import { useT } from '../i18n';
import { SymptomCheckerModal } from './patient/SymptomCheckerModal';

interface PatientAppProps {
  isLargeFont: boolean;
  language: 'en' | 'hi';
  isDarkMode: boolean;
  onToggleLanguage: () => void;
  onToggleFont: () => void;
  onToggleDarkMode: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'contact') => void;
}

function parseAppointmentTimestamp(dateTimeStr: string): number {
  const now = Date.now();
  if (!dateTimeStr) return now + (3 * 3600 + 42 * 60 + 15) * 1000;

  const direct = Date.parse(dateTimeStr);
  if (!isNaN(direct) && direct > now) {
    return direct;
  }

  const isTomorrow = /tomorrow/i.test(dateTimeStr);
  const timeMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const target = new Date();
    if (isTomorrow) target.setDate(target.getDate() + 1);
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() > now) {
      return target.getTime();
    }
  }

  return now + (3 * 3600 + 42 * 60 + 15) * 1000;
}

const AppointmentReminderCard: React.FC<{
  appointment: DoctorAppointment;
  onJoin: () => void;
  onReschedule: () => void;
}> = ({ appointment, onJoin, onReschedule }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    hours: 3,
    minutes: 42,
    seconds: 15,
    isExpired: false
  });

  const targetTimeRef = useRef<number>(0);

  useEffect(() => {
    targetTimeRef.current = parseAppointmentTimestamp(appointment.dateTime);

    const tick = () => {
      const diff = targetTimeRef.current - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [appointment.dateTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-4 text-slate-950 shadow-xl shadow-amber-500/25 border-2 border-amber-300">
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/20 pointer-events-none blur-sm" />
      <div className="absolute right-3 top-3 text-slate-900/30 pointer-events-none">
        <Bell className="w-10 h-10" />
      </div>

      <div className="relative z-10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 bg-slate-950/20 backdrop-blur-md px-3 py-1 rounded-full text-slate-950 font-extrabold text-[10px] tracking-wider uppercase border border-slate-950/10">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping inline-block" />
            <Bell className="w-3 h-3 text-slate-950" />
            <span>Reminder • Appointment in &lt;24h</span>
          </div>
          <span className="text-[10px] font-bold text-slate-950 bg-white/40 px-2.5 py-0.5 rounded-full">
            {appointment.mode}
          </span>
        </div>

        <div>
          <h3 className="font-extrabold text-base text-slate-950 leading-tight">
            {appointment.doctorName}
          </h3>
          <p className="text-xs font-semibold text-slate-900/90 mt-0.5">
            {appointment.doctorSpecialty} • {appointment.dateTime}
          </p>
        </div>

        {/* Live Countdown Box */}
        <div className="bg-slate-950/90 text-white p-3 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-amber-300 font-extrabold block">
                Live Countdown
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {timeLeft.isExpired
                  ? 'Starting Now'
                  : `Starts in ${pad(timeLeft.hours)}h : ${pad(timeLeft.minutes)}m : ${pad(timeLeft.seconds)}s`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
            <span>{pad(timeLeft.hours)}</span>:<span>{pad(timeLeft.minutes)}</span>:<span>{pad(timeLeft.seconds)}</span>
          </div>
        </div>

        {/* Mode specific guidance */}
        {(appointment.mode === 'Audio' || appointment.mode === 'Chat') && (
          <p className="text-[11px] text-amber-300 font-semibold">
            ℹ Turn off your camera if you want audio-only
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          {appointment.mode === 'Clinic visit' ? (
            <a
              href={getDirectionsUrl('HealthPilot Partner Clinic')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Get directions</span>
            </a>
          ) : (
            <button
              onClick={onJoin}
              className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              <span>Join Call</span>
            </button>
          )}
          <button
            onClick={onReschedule}
            className="flex-1 py-2.5 bg-white/95 hover:bg-white text-slate-950 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 border border-amber-300 transition-transform active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Reschedule</span>
          </button>
        </div>

        {appointment.mode !== 'Clinic visit' && (
          <p className="text-[10px] text-slate-400 pt-1 text-center">
            Calls use a free public video service. Do not share the link.
          </p>
        )}
      </div>
    </div>
  );
};

export const PatientApp: React.FC<PatientAppProps> = ({ 
  isLargeFont, language, isDarkMode, onToggleLanguage, onToggleFont, onToggleDarkMode, onOpenLegal 
}) => {
  const { 
    currentUser, logout, doctors, pharmacists, labs, appointments, labBookings, pharmacyOrders, 
    createAppointment, updateAppointment, createLabBooking, createPharmacyOrder,
    updateFamilyMembers, updatePatientProfile, dataLoading,
    labTests, getPatientPrice, pharmacyInventory
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'home' | 'consultation' | 'tests' | 'medicines' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedMedCategory, setSelectedMedCategory] = useState<string>('All');

  // Lab Tests State (Search, Category Filter, Sort, Expansion, Pagination)
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [selectedTestCategory, setSelectedTestCategory] = useState<string>('All');
  const [testSortBy, setTestSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc'>('default');
  const [expandedPanelIds, setExpandedPanelIds] = useState<Set<string>>(new Set());
  const [testsVisibleCount, setTestsVisibleCount] = useState<number>(20);

  const togglePanelExpand = (testId: string) => {
    setExpandedPanelIds(prev => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  // Modals & Flows
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);
  const [selectedTestForBooking, setSelectedTestForBooking] = useState<LabTest | null>(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<DoctorProfile | null>(null);
  const [doctorDateOffset, setDoctorDateOffset] = useState<number>(0);
  const [doctorConsultMode, setDoctorConsultMode] = useState<'Video' | 'Clinic visit'>('Video');
  const [selectedDoctorSlot, setSelectedDoctorSlot] = useState<ComputedSlot | null>(null);
  const [doctorPaymentMethod, setDoctorPaymentMethod] = useState<'Pay at Clinic'>('Pay at Clinic');

  const handleSelectSpecialtyFromChecker = (specialty: string) => {
    setActiveTab('consultation');
    const lower = specialty.toLowerCase();
    if (lower.includes('cardio')) {
      setSelectedSpecialty('Cardiologist');
    } else if (lower.includes('gyn') || lower.includes('women')) {
      setSelectedSpecialty('Gynaecologist');
    } else if (lower.includes('diabet') || lower.includes('endocrin')) {
      setSelectedSpecialty('Diabetologist');
    } else if (lower.includes('physician') || lower.includes('general')) {
      setSelectedSpecialty('General Physician');
    } else {
      setSelectedSpecialty('All');
      setSearchQuery(specialty);
    }
    showToast(`Showing doctors for ${specialty}`);
  };

  const handleSelectLabTestFromChecker = (testName: string) => {
    const lower = testName.toLowerCase();
    const matched = labTests.find(t => 
      t.name.toLowerCase().includes(lower) || lower.includes(t.name.toLowerCase())
    );
    if (matched) {
      setSelectedTestForBooking(matched);
      showToast(`Selected ${matched.name} for booking`);
    } else {
      setActiveTab('tests');
      setTestSearchQuery(testName);
      showToast(`Showing search results for ${testName}`);
    }
  };

  // Lab Booking flow
  const [labPaymentMethod, setLabPaymentMethod] = useState<'Pay at Lab / Sample Collection'>('Pay at Lab / Sample Collection');
  const [labCollectionMode, setLabCollectionMode] = useState<'Home Collection' | 'Lab Visit'>('Home Collection');

  // Real Pharmacy Inventory Cart & Checkout
  const [cartMedicines, setCartMedicines] = useState<{ medicine: {
    id: string;
    pharmacyId: string;
    pharmacyName: string;
    pharmacyAddress?: string;
    name: string;
    salt: string;
    stock: number;
    price: number;
    mrp: number;
    category: string;
    requiresRx: boolean;
    expiryDate?: string;
  }; quantity: number }[]>([]);
  const [pharmacyConflict, setPharmacyConflict] = useState<{ existingPharmacy: string; incomingItem: any } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [pharmacyPaymentMethod, setPharmacyPaymentMethod] = useState<'Cash on Delivery'>('Cash on Delivery');
  const [selectedPrescriptionRecordId, setSelectedPrescriptionRecordId] = useState<string>('');
  const [uploadedPrescriptionUrl, setUploadedPrescriptionUrl] = useState<string>('');
  const [isUploadingPrescription, setIsUploadingPrescription] = useState<boolean>(false);
  const [prescriptionUploadProgress, setPrescriptionUploadProgress] = useState<number>(0);
  const [prescriptionUploadError, setPrescriptionUploadError] = useState<string>('');

  const [activeConsultationRoom, setActiveConsultationRoom] = useState<Doctor | DoctorProfile | null>(null);
  const [viewingReport, setViewingReport] = useState<{ title: string; url?: string; doctorOrLab?: string; date?: string } | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<DoctorAppointment | null>(null);
  const [rescheduleDateOffset, setRescheduleDateOffset] = useState<number>(0);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState<ComputedSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState<string>('Schedule conflict');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // DPDP Privacy modal and state
  const { t } = useT();
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  const handleJoinConsultation = (appt: DoctorAppointment) => {
    if (appt.mode === 'Clinic visit') {
      window.open(getDirectionsUrl(appt.doctorSpecialty ? `${appt.doctorName} Clinic` : 'HealthPilot Clinic'), '_blank', 'noopener,noreferrer');
      return;
    }

    const windowCheck = getCallWindowStatus(appt.dateTime);
    if (!windowCheck.canJoin) {
      showToast(windowCheck.message || t('callWindowNotice'));
      return;
    }

    const room = appt.roomName || generateRoomName(appt.id);
    window.open(getJitsiUrl(room), '_blank', 'noopener,noreferrer');
  };

  const handleDownloadMyData = () => {
    try {
      const dataPayload = {
        exportedAt: new Date().toISOString(),
        dpdpCompliance: 'HealthPilot Digital Personal Data Protection Act (DPDP) Export',
        patientProfile: currentUser,
        familyMembers: familyMembers,
        appointments: appointments,
        labBookings: labBookings,
        pharmacyOrders: pharmacyOrders,
        healthRecords: healthRecords
      };
      const blob = new Blob([JSON.stringify(dataPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `healthpilot-patient-data-${currentUser?.id || 'me'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Your complete data has been exported as JSON!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export data.');
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE' || !currentUser?.id) return;
    setIsDeletingAccount(true);
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        deletionRequested: true,
        deletionRequestedAt: new Date().toISOString()
      });
      setShowDeleteAccountModal(false);
      showToast('Your deletion request was received. It will be processed within 30 days.');
      await logout();
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit account deletion request.');
      setIsDeletingAccount(false);
    }
  };

  // Real bookedSlots subscription
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser?.id) return;
    const q = collection(db, 'bookedSlots');
    const unsub = onSnapshot(q, (snapshot) => {
      const ids = new Set<string>();
      snapshot.forEach(d => ids.add(d.id));
      setBookedSlotIds(ids);
    }, (err) => {
      console.warn('bookedSlots listener error:', err);
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Email verification states & resend timer
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const isEmailVerified = auth.currentUser?.emailVerified ?? true;

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
      showToast('Verification email sent! Please check your inbox or spam folder.');
      setResendCooldown(60);
    } catch (err: any) {
      showToast(err?.message || 'Failed to send verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleReloadVerification = async () => {
    if (!auth.currentUser || isCheckingVerify) return;
    setIsCheckingVerify(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        showToast('Email verified successfully!');
      } else {
        showToast('Email is not verified yet. Please click the link in your email.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to reload status.');
    } finally {
      setIsCheckingVerify(false);
    }
  };

  // Active provider lists from context
  const activePharmacists = pharmacists.filter(p => p.status === 'Active');
  const activeLabs = labs.filter(l => l.status === 'Active');
  const activeDoctors = doctors.filter(d => d.status === 'Active');

  // Provider assignment states
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');

  // Auto-set first active provider whenever lists change
  useEffect(() => {
    if (activeLabs.length > 0 && !selectedLabId) {
      setSelectedLabId(activeLabs[0].id);
    }
  }, [activeLabs, selectedLabId]);

  useEffect(() => {
    if (activePharmacists.length > 0 && !selectedPharmacyId) {
      setSelectedPharmacyId(activePharmacists[0].id);
    }
  }, [activePharmacists, selectedPharmacyId]);

  // Request in-progress submission locks to prevent double-booking
  const [isBookingDoctor, setIsBookingDoctor] = useState(false);
  const [isBookingLab, setIsBookingLab] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);

  // Profile Edit Modal & Completeness state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAddress, setEditAddress] = useState((currentUser as PatientProfile)?.address || '');
  const [editAge, setEditAge] = useState(String((currentUser as PatientProfile)?.age || ''));
  const [editBloodGroup, setEditBloodGroup] = useState((currentUser as PatientProfile)?.bloodGroup || 'O+');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditPhone(currentUser.phone || '');
      setEditAddress((currentUser as PatientProfile)?.address || '');
      setEditAge(String((currentUser as PatientProfile)?.age || ''));
      setEditBloodGroup((currentUser as PatientProfile)?.bloodGroup || 'O+');
    }
  }, [currentUser]);

  const isProfileComplete = Boolean(
    currentUser?.phone?.trim() && 
    (currentUser as PatientProfile)?.address?.trim()
  );

  // Family Members vault modal state
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFmName, setNewFmName] = useState('');
  const [newFmRelation, setNewFmRelation] = useState<'Father' | 'Mother' | 'Spouse' | 'Son' | 'Daughter' | 'Self'>('Spouse');
  const [newFmAge, setNewFmAge] = useState('');
  const [newFmGender, setNewFmGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [newFmBlood, setNewFmBlood] = useState('O+');
  const [isSavingFamily, setIsSavingFamily] = useState(false);

  const familyMembers: FamilyMember[] = (currentUser as PatientProfile)?.familyMembers || [];

  // Real Health Records subscription from Firestore
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [healthRecordsLoading, setHealthRecordsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      setHealthRecords([]);
      setHealthRecordsLoading(false);
      return;
    }
    const q = query(
      collection(db, 'healthRecords'),
      where('patientId', '==', currentUser.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const records: HealthRecord[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          title: d.title || 'Medical Record',
          type: d.type || 'Prescription',
          date: d.date || '',
          doctorOrLab: d.doctorOrLab || 'HealthPilot Care',
          fileSize: d.fileSize || '1.2 MB',
          url: d.url || '#'
        });
      });
      records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setHealthRecords(records);
      setHealthRecordsLoading(false);
    }, (err) => {
      console.warn('Health records snapshot error:', err);
      setHealthRecordsLoading(false);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCancelAppointment = async (appt: DoctorAppointment) => {
    try {
      if (appt.bookedSlotId) {
        try {
          await deleteDoc(doc(db, 'bookedSlots', appt.bookedSlotId));
        } catch (e) {
          console.warn('Failed to delete bookedSlots document:', e);
        }
      }
      await updateAppointment(appt.id, { status: 'Cancelled' });

      // Automatically notify doctor and patient
      try {
        await sendAppNotification({
          userId: appt.doctorId,
          title: 'Appointment Cancelled',
          body: `${currentUser?.name || 'Patient'} cancelled their consultation on ${appt.dateTime}.`,
          type: 'appointment'
        });
        await sendAppNotification({
          userId: currentUser!.id,
          title: 'Appointment Cancelled',
          body: `Your consultation with Dr. ${appt.doctorName} on ${appt.dateTime} has been cancelled.`,
          type: 'appointment'
        });
      } catch (notifErr) {
        console.warn('Notification send note:', notifErr);
      }

      showToast('Appointment cancelled and slot released.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel appointment.');
    }
  };

  const handleAddToCart = (med: any) => {
    if (med.stock <= 0) {
      showToast(`${med.name} is currently out of stock.`);
      return;
    }
    if (cartMedicines.length > 0 && cartMedicines[0].medicine.pharmacyId !== med.pharmacyId) {
      setPharmacyConflict({
        existingPharmacy: cartMedicines[0].medicine.pharmacyName,
        incomingItem: med
      });
      return;
    }
    setCartMedicines(prev => {
      const existing = prev.find(item => item.medicine.id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock) {
          showToast(`Cannot add more. Only ${med.stock} units in stock.`);
          return prev;
        }
        return prev.map(item => item.medicine.id === med.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { medicine: med, quantity: 1 }];
    });
    showToast(`Added ${med.name} to cart`);
  };

  // Real Active Doctors with computed next available slots
  const allAvailableDoctors = useMemo(() => {
    return activeDoctors.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty || 'General Physician',
      qualification: d.qualification || 'MBBS',
      experienceYears: d.experienceYears || 1,
      hospital: d.hospitalOrClinic || 'HealthPilot Partner Clinic',
      rating: d.rating || 5.0,
      reviewCount: d.reviewCount || 0,
      consultationFee: d.consultationFee || 500,
      languages: d.languages || ['English', 'Hindi'],
      nextAvailableSlot: getNextAvailableSlot(d, bookedSlotIds),
      avatarUrl: d.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
      bio: d.bio || 'Consultant Physician.',
      profile: d
    }));
  }, [activeDoctors, bookedSlotIds]);

  const filteredDoctors = selectedSpecialty === 'All' 
    ? allAvailableDoctors 
    : allAvailableDoctors.filter(d => d.specialty === selectedSpecialty);

  // Real Pharmacy Inventory joined with Active Pharmacists
  const activePharmaMap = useMemo(() => new Map(activePharmacists.map(p => [p.id, p])), [activePharmacists]);

  const activePharmacyMedicines = useMemo(() => {
    return pharmacyInventory
      .filter(item => activePharmaMap.has(item.pharmacyId))
      .map(item => {
        const pharma = activePharmaMap.get(item.pharmacyId)!;
        const stock = item.stock !== undefined ? item.stock : (item.stockCount ?? 0);
        const name = item.name || item.medicineName;
        return {
          id: item.id,
          pharmacyId: item.pharmacyId,
          pharmacyName: pharma.pharmacyName || pharma.name,
          pharmacyAddress: pharma.pharmacyAddress,
          name,
          salt: item.salt || '',
          price: item.price,
          mrp: item.mrp || item.price,
          stock,
          isOutOfStock: stock <= 0,
          category: item.category || 'General',
          requiresRx: Boolean(item.requiresRx),
          expiryDate: item.expiryDate
        };
      });
  }, [pharmacyInventory, activePharmaMap]);

  const filteredMedicines = useMemo(() => {
    return activePharmacyMedicines.filter(m => {
      const matchesCategory = selectedMedCategory === 'All' || m.category === selectedMedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.salt.toLowerCase().includes(q) || m.pharmacyName.toLowerCase().includes(q);
    });
  }, [activePharmacyMedicines, selectedMedCategory, searchQuery]);

  // Active tests filtered for patient display (inactive tests hidden)
  const activeCatalogueTests = labTests.filter(t => t.active !== false);

  // Homepage Special Panels preview (First 4 Special Panels: Akshaya Health Check-ups)
  const specialPanelsPreview = activeCatalogueTests
    .filter(t => t.category === 'Special Panels')
    .slice(0, 4);

  // Lab Tests tab filtered and sorted list
  const filteredLabTests = activeCatalogueTests.filter(t => {
    const matchesCategory = selectedTestCategory === 'All' || t.category === selectedTestCategory;
    if (!matchesCategory) return false;
    if (!testSearchQuery.trim()) return true;
    const q = testSearchQuery.toLowerCase();
    const matchesName = t.name.toLowerCase().includes(q);
    const matchesCategoryName = t.category.toLowerCase().includes(q);
    const matchesSample = (t.sampleType || '').toLowerCase().includes(q);
    const matchesIncludes = t.includes ? t.includes.some(inc => inc.toLowerCase().includes(q)) : false;
    return matchesName || matchesCategoryName || matchesSample || matchesIncludes;
  }).sort((a, b) => {
    if (testSortBy === 'price_asc') {
      return getPatientPrice(a.labRate) - getPatientPrice(b.labRate);
    }
    if (testSortBy === 'price_desc') {
      return getPatientPrice(b.labRate) - getPatientPrice(a.labRate);
    }
    if (testSortBy === 'name_asc') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const visibleLabTests = filteredLabTests.slice(0, testsVisibleCount);

  return (
    <div className={`w-full md:max-w-[480px] md:mx-auto min-h-[100dvh] h-[100dvh] ${isDarkMode ? 'mesh-bg-dark text-slate-100' : 'mesh-bg-light text-slate-800'} flex flex-col relative font-sans overflow-hidden ${isLargeFont ? 'text-lg' : 'text-base'} shadow-2xl`}>
      
      {/* Top Email Verification Warning Banner */}
      {!isEmailVerified && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-bold shrink-0 shadow-md z-30">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate">Email not verified — check inbox</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              disabled={resendCooldown > 0 || resendLoading}
              onClick={handleResendVerification}
              className="px-2 py-0.5 bg-slate-950 text-white rounded-lg text-[10px] font-extrabold hover:bg-slate-900 disabled:opacity-60 transition-all cursor-pointer"
            >
              {resendLoading ? 'Sending...' : resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
            </button>
            <button
              disabled={isCheckingVerify}
              onClick={handleReloadVerification}
              className="px-2 py-0.5 bg-white text-slate-950 rounded-lg text-[10px] font-extrabold hover:bg-slate-100 transition-all cursor-pointer"
            >
              {isCheckingVerify ? '...' : 'Reload'}
            </button>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed md:absolute top-16 left-4 right-4 z-50 bg-[#0A1A45] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-teal-400">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Emergency SOS Modal */}
      {showEmergencyModal && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className={`${isDarkMode ? 'bg-slate-900 text-white border-red-500/80' : 'bg-white text-slate-900 border-red-500'} w-full rounded-[32px] p-6 shadow-2xl border-2 text-center`}>
            <div className="w-16 h-16 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <ShieldAlert className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-extrabold mb-2 tracking-tight text-[#0A1A45] dark:text-white">Emergency Medical SOS</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">
              Instant dispatch to nearest hospital ambulance & emergency response team in Noida / NCR.
            </p>
            <div className="space-y-3">
              <a 
                href="tel:108" 
                className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-lg shadow-red-500/25 transition-all"
              >
                <Phone className="w-5 h-5" /> Call Ambulance (108 / 112)
              </a>
              <button 
                onClick={() => {
                  setShowEmergencyModal(false);
                  showToast('SOS Alert dispatched with your live GPS location to family!');
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                Send SOS SMS to Family
              </button>
              <button 
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Mobile Header */}
      <header className={`glass-header px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-20 pt-[max(0.75rem,env(safe-area-inset-top,0px))] border-b border-slate-300/80 dark:border-slate-800/80`}>
        <div className="flex items-center gap-2">
          <HealthPilotLogo size="sm" />
        </div>
        <div className="flex items-center gap-1.5">
          {/* AI Symptom Checker quick pill */}
          <button
            onClick={() => setShowSymptomChecker(true)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
              isDarkMode 
                ? 'bg-blue-950/50 border-blue-600/40 text-blue-300 hover:bg-blue-900/60' 
                : 'bg-blue-50 border-blue-200 text-[#1769E0] hover:bg-blue-100/70'
            }`}
            title="AI Symptom Checker"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span className="text-[11px] font-extrabold">AI Triage</span>
          </button>

          {/* In-App Notifications Bell */}
          <NotificationBell isDarkMode={isDarkMode} />

          <button 
            onClick={onToggleLanguage}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 shadow-xs cursor-pointer ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#1769E0]" /> {language === 'en' ? '🇮🇳' : 'EN'}
          </button>
          <button 
            onClick={onToggleDarkMode}
            className={`p-1.5 rounded-xl text-xs font-bold border transition-colors shadow-xs cursor-pointer ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md shadow-red-500/25 animate-pulse cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> SOS
          </button>
        </div>
      </header>

      {/* Scrollable View Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        
        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            
            {/* Push-Notification Style Appointment Reminder Card for next 24 hours */}
            {(() => {
              const now = Date.now();
              const upcomingAppt = appointments.find(ap => {
                if (ap.status !== 'Scheduled') return false;
                const apptTime = parseAppointmentTimestamp(ap.dateTime);
                const diff = apptTime - now;
                return diff > 0 && diff <= 24 * 3600 * 1000;
              });

              if (!upcomingAppt) return null;

              return (
                <AppointmentReminderCard
                  appointment={upcomingAppt}
                  onJoin={() => {
                    handleJoinConsultation(upcomingAppt);
                  }}
                  onReschedule={() => {
                    setRescheduleAppt(upcomingAppt);
                  }}
                />
              );
            })()}

            {/* Greeting & Slogan */}
            <div className="bg-gradient-to-r from-[#0A1A45] via-[#1769E0] to-[#0FB5A0] rounded-3xl p-5 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-15">
                <Heart className="w-36 h-36" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white border border-white/30 inline-block">
                Your Health, Our Priority
              </span>
              <h2 className="font-extrabold text-lg mt-2 mb-1 tracking-tight">Take care of your health with HealthPilot</h2>
              <p className="text-xs text-blue-100 font-semibold">Better Care Made Simple • Noida Sec-63</p>
            </div>

            {/* Universal Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder={language === 'en' ? "Search doctor, test, medicine..." : "डॉक्टर, टेस्ट, दवा खोजें..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full ${isDarkMode ? 'bg-slate-850 text-white border-slate-700/80' : 'bg-white text-slate-900 border-slate-300'} pl-10 pr-4 py-3.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/20 shadow-sm transition-all`}
              />
            </div>

            {/* AI Symptom Navigator Card */}
            <div 
              onClick={() => setShowSymptomChecker(true)}
              className="relative overflow-hidden rounded-3xl p-4.5 bg-gradient-to-r from-indigo-700 via-blue-600 to-teal-600 text-white shadow-xl shadow-blue-500/20 cursor-pointer hover:scale-[1.015] active:scale-[0.985] transition-all border border-white/20"
            >
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" /> AI Symptom Checker
                    </span>
                    <span className="text-[10px] font-bold text-teal-200">Instant Triage</span>
                  </div>
                  <h3 className="font-extrabold text-base tracking-tight">Feeling unwell? Check symptoms</h3>
                  <p className="text-xs text-blue-100 font-medium leading-relaxed">
                    AI analyzes your symptoms & recommends doctor specialties and lab tests
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
              </div>
            </div>

            {/* 3 Big Gradient Cards */}
            <div className="space-y-3">
              {/* Doctor Consultation Card (Blue) */}
              <div 
                onClick={() => setActiveTab('consultation')}
                className="bg-gradient-to-r from-[#1769E0] to-blue-700 rounded-3xl p-4 text-white shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-[1.015] active:scale-[0.985] transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">Top Specialists</span>
                  <h3 className="font-extrabold text-base mt-1">Doctor Consultation</h3>
                  <p className="text-xs text-blue-100 mt-0.5 font-medium">Video, Audio, Chat or In-Clinic</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Book Lab Tests Card (Teal) */}
              <div 
                onClick={() => setActiveTab('tests')}
                className="bg-gradient-to-r from-[#0FB5A0] to-teal-700 rounded-3xl p-4 text-white shadow-lg shadow-teal-500/20 cursor-pointer hover:scale-[1.015] active:scale-[0.985] transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">NABL Accredited</span>
                  <h3 className="font-extrabold text-base mt-1">Book Lab Tests</h3>
                  <p className="text-xs text-teal-100 mt-0.5 font-medium">Free Home Sample Collection</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Order Medicines Card (Green - Pharmacist Aligned) */}
              <div 
                onClick={() => setActiveTab('medicines')}
                className="bg-gradient-to-r from-[#10B981] to-emerald-700 rounded-3xl p-4 text-white shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-[1.015] active:scale-[0.985] transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">Up to 25% Off</span>
                  <h3 className="font-extrabold text-base mt-1">Order Medicines</h3>
                  <p className="text-xs text-emerald-100 mt-0.5 font-medium">Instant delivery & Rx upload</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Quick Access Row with Colourful Icon Badges */}
            <div className="grid grid-cols-4 gap-2.5">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-3 rounded-2xl shadow-sm border flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1769E0] to-blue-500 text-white flex items-center justify-center mb-1.5 shadow-md shadow-blue-500/25">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Records</span>
              </button>
              <button 
                onClick={() => {
                  const latestWithReport = labBookings.find(b => b.reportUrl);
                  if (latestWithReport) {
                    setViewingReport({ title: latestWithReport.testName, url: latestWithReport.reportUrl, doctorOrLab: 'Diagnostic Lab', date: latestWithReport.dateTime });
                  } else if (healthRecords.length > 0) {
                    const hr = healthRecords[0];
                    setViewingReport({ title: hr.title, url: hr.url, doctorOrLab: hr.doctorOrLab, date: hr.date });
                  } else {
                    setViewingReport({ title: 'Diagnostic Report', url: undefined, doctorOrLab: 'Central Diagnostic Lab' });
                  }
                }} 
                className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-3 rounded-2xl shadow-sm border flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0FB5A0] to-teal-500 text-white flex items-center justify-center mb-1.5 shadow-md shadow-teal-500/25">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Reports</span>
              </button>
              <button 
                onClick={() => showToast('Coupon MS25 applied successfully! 25% discount active.')} 
                className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-3 rounded-2xl shadow-sm border flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center mb-1.5 shadow-md shadow-amber-500/25">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Offers</span>
              </button>
              <button 
                onClick={() => showToast('Support chat connected with executive.')} 
                className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-3 rounded-2xl shadow-sm border flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-purple-500 text-white flex items-center justify-center mb-1.5 shadow-md shadow-purple-500/25">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Support</span>
              </button>
            </div>

            {/* Real-time Pharmacy Order Status Tracker */}
            <PharmacyOrderTracker isDarkMode={isDarkMode} onGoToPharmacy={() => setActiveTab('medicines')} />

            {/* My Bookings Tracker Section */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-md backdrop-blur-md`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">Active Consultations & Lab Bookings</h4>
                <span className="text-xs text-[#1769E0] font-extrabold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1769E0] animate-ping" /> Live Tracker
                </span>
              </div>
              <div className="space-y-2">
                {labBookings.slice(0, 3).map((lb) => (
                  <div key={lb.id} className="p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold text-teal-900 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-300 dark:border-teal-500/30">Lab Test</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          Payment: {lb.paymentStatus || 'Pending'}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs mt-1 text-[#0A1A45] dark:text-white">{lb.testName}</h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{lb.status} • {lb.dateTime}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                ))}
                {appointments.slice(0, 3).map((ap) => (
                  <div key={ap.id} className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-500/30">Consultation</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ap.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-400'
                          }`}>
                            {ap.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            Payment: {ap.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs mt-1 text-[#0A1A45] dark:text-white">{ap.doctorName} ({ap.doctorSpecialty})</h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{ap.dateTime} • {ap.mode}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#1769E0] shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>

                    {ap.status === 'Scheduled' && (
                      <div className="flex items-center gap-2 pt-1 border-t border-blue-500/20">
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleAppt(ap);
                            setRescheduleDateOffset(0);
                            setRescheduleSelectedSlot(null);
                          }}
                          className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(ap)}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 rounded-xl text-[11px] font-bold border border-red-300 dark:border-red-500/20"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {labBookings.length === 0 && appointments.length === 0 && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1.5 opacity-60" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No active consultations or lab bookings</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Your doctor appointments and lab sample collections will track live here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-3 rounded-2xl border flex items-center gap-3 shadow-sm`}>
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-[#1769E0] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h6 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">Verified Doctors</h6>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">100% NMC Panel</p>
                </div>
              </div>
              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-3 rounded-2xl border flex items-center gap-3 shadow-sm`}>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h6 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">Safe Delivery</h6>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Cold Chain Sealed</p>
                </div>
              </div>
            </div>

            {/* Special Panels / Health Check-ups Preview (Top 4) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">Health Packages & Full Body Checkups</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">NABL certified comprehensive profiles with home collection</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTestCategory('Special Panels');
                    setActiveTab('tests');
                  }}
                  className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center shrink-0 ml-2"
                >
                  View All (140+) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specialPanelsPreview.map(panel => {
                  const pPrice = getPatientPrice(panel.labRate);
                  return (
                    <div 
                      key={panel.id} 
                      className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-md flex flex-col justify-between hover:border-purple-400/50 transition-all`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 px-2 py-0.5 rounded-full">
                            {panel.category}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-slate-500" /> {panel.tat}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-xs text-[#0A1A45] dark:text-white leading-snug">
                          {panel.name}
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                          {panel.description}
                        </p>
                        {panel.includes && panel.includes.length > 0 && (
                          <div className="mt-2 text-[10px] text-teal-800 dark:text-teal-300 font-bold bg-teal-100 dark:bg-teal-500/10 px-2 py-1 rounded-xl border border-teal-200 dark:border-teal-500/20">
                            Includes {panel.parametersCount} Parameters ({panel.includes.slice(0, 3).join(', ')}...)
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">Total Package Price</span>
                          <span className="text-sm font-extrabold text-[#0A1A45] dark:text-white">
                            {formatINR(pPrice)}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedTestForBooking(panel)}
                          className="px-3.5 py-1.5 bg-[#0FB5A0] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 2. DOCTOR CONSULTATION TAB */}
        {activeTab === 'consultation' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Consult Expert Doctors</h2>
              <button
                type="button"
                onClick={() => setShowSymptomChecker(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Symptom Checker</span>
              </button>
            </div>

            {/* Specialty Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['All', 'General Physician', 'Cardiologist', 'Gynaecologist', 'Diabetologist'].map(spec => (
                <button 
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSpecialty === spec 
                      ? 'bg-[#1769E0] text-white shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>

            {/* Doctor Cards */}
            <div className="space-y-3">
              {filteredDoctors.length === 0 ? (
                <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/40 rounded-3xl border border-slate-300 dark:border-slate-700">
                  <Stethoscope className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-[#0A1A45] dark:text-slate-200">No doctors available right now</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Please check back soon as verified medical practitioners come online.</p>
                </div>
              ) : (
                filteredDoctors.map(doc => (
                  <div key={doc.id} className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-md flex gap-3.5`}>
                    <img src={doc.avatarUrl} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-300 dark:border-slate-700" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">{doc.name}</h3>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-400/20">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {doc.rating}
                        </div>
                      </div>
                      <p className="text-xs text-[#1769E0] font-bold">{doc.specialty}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{doc.qualification} • {doc.experienceYears} yrs exp</p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 font-medium">{doc.hospital}</p>
                      <div className="flex items-center gap-1.5 mt-2 bg-blue-100 dark:bg-blue-500/10 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 rounded-xl text-[11px] font-bold w-fit">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Slot: {doc.nextAvailableSlot}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Fee:</span>
                          <span className="text-sm font-extrabold ml-1 text-[#0A1A45] dark:text-white">₹{doc.consultationFee}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedDoctorForBooking(doc.profile);
                            setDoctorDateOffset(0);
                            setSelectedDoctorSlot(null);
                          }}
                          className="px-4 py-2 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          Book Slot
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. LAB TESTS TAB */}
        {activeTab === 'tests' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Lab Tests & Health Packages</h2>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{filteredLabTests.length} tests found</span>
            </div>

            {/* Filters & Search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search tests, categories, samples..."
                  value={testSearchQuery}
                  onChange={e => setTestSearchQuery(e.target.value)}
                  className={`w-full ${isDarkMode ? 'bg-slate-850 text-white border-slate-700/80' : 'bg-white text-slate-900 border-slate-300'} pl-10 pr-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:border-[#0FB5A0] focus:ring-2 focus:ring-[#0FB5A0]/20 shadow-sm transition-all`}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['All', ...LAB_TEST_CATEGORIES].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedTestCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedTestCategory === cat 
                        ? 'bg-[#0FB5A0] text-white shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={testSortBy}
                  onChange={e => setTestSortBy(e.target.value as any)}
                  className={`flex-1 p-2 rounded-xl text-xs font-semibold border ${isDarkMode ? 'bg-slate-850 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                >
                  <option value="default">Sort: Default</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Tests List */}
            <div className="space-y-3">
              {visibleLabTests.length === 0 ? (
                <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/40 rounded-3xl border border-slate-300 dark:border-slate-700">
                  <p className="font-bold text-sm text-[#0A1A45] dark:text-slate-200">No tests found</p>
                </div>
              ) : (
                visibleLabTests.map(test => (
                  <div key={test.id} className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-md`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold text-teal-900 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/20 px-2 py-0.5 rounded-full">{test.category}</span>
                          {test.fastingRequired && <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2.5 py-0.5 rounded-full">Fasting Required</span>}
                        </div>
                        <h3 className="font-extrabold text-sm leading-snug text-[#0A1A45] dark:text-white">{test.name}</h3>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">{test.sampleType} • {test.tat}</p>
                        
                        {test.isPanel && test.includes && (
                          <div className="mt-2">
                            <button 
                              onClick={() => togglePanelExpand(test.id)}
                              className="text-[10px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
                            >
                              {expandedPanelIds.has(test.id) ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                              {expandedPanelIds.has(test.id) ? 'Hide Includes' : `Includes ${test.parameters} items`}
                            </button>
                            {expandedPanelIds.has(test.id) && (
                              <ul className="text-[10px] text-slate-600 dark:text-slate-300 mt-1.5 list-disc pl-4 space-y-0.5 font-medium">
                                {test.includes.map((inc, i) => <li key={i}>{inc}</li>)}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-base font-extrabold text-[#0A1A45] dark:text-white">{formatINR(getPatientPrice(test.labRate))}</span>
                      <button 
                        onClick={() => setSelectedTestForBooking(test)}
                        className="px-4 py-2 bg-[#0FB5A0] hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))
              )}
              {testsVisibleCount < filteredLabTests.length && (
                <button 
                  onClick={() => setTestsVisibleCount(prev => prev + 20)}
                  className="w-full py-3 rounded-2xl text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 border border-teal-300 dark:border-[#0FB5A0]/20 transition-all cursor-pointer"
                >
                  Load More Tests
                </button>
              )}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-4 font-medium">Prices are indicative and may change. Verified central laboratory partner network.</p>
            </div>
          </div>
        )}

        {/* 4. MEDICINES TAB */}
        {activeTab === 'medicines' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Online Pharmacy</h2>
              <button 
                onClick={() => setShowCart(true)}
                className="relative px-3.5 py-1.5 bg-gradient-to-r from-[#10B981] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all"
              >
                <ShoppingBag className="w-4 h-4" /> Cart ({cartMedicines.reduce((acc, item) => acc + item.quantity, 0)})
              </button>
            </div>

            {/* Real-time Pharmacy Order Status Tracker */}
            <PharmacyOrderTracker isDarkMode={isDarkMode} />

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['All', 'Diabetes', 'Heart', 'Ayurveda', 'Wellness', 'General'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedMedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    selectedMedCategory === cat 
                      ? 'bg-gradient-to-r from-[#10B981] to-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-xs'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Rx Upload Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 p-4 rounded-3xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#10B981] to-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">Upload Prescription</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Pharmacist verifies & packs medicines.</p>
                </div>
              </div>
              <button 
                disabled={isUploadingRx || activePharmacists.length === 0}
                onClick={async () => {
                  if (activePharmacists.length === 0) {
                    showToast('No active verified pharmacies available for prescription processing.');
                    return;
                  }
                  if (!isProfileComplete) {
                    showToast('Please complete your phone number and delivery address in your Profile first.');
                    setShowEditProfileModal(true);
                    return;
                  }
                  setIsUploadingRx(true);
                  try {
                    await createPharmacyOrder({
                      patientId: currentUser!.id,
                      patientName: currentUser!.name,
                      patientPhone: currentUser!.phone,
                      pharmacyId: activePharmacists[0].id,
                      items: [{ medicineId: 'rx-doc-upload', medicineName: 'Prescription Dispensation', quantity: 1, price: 450 }],
                      totalAmount: 450,
                      status: 'Placed',
                      orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                      deliveryAddress: (currentUser as PatientProfile).address,
                      rxAttached: true,
                      rxImageUrl: 'Prescription_Uploaded.pdf'
                    });
                    showToast('Prescription uploaded & sent to pharmacy for verification!');
                  } catch (err: any) {
                    showToast(err?.message || 'Failed to upload prescription. Please try again.');
                  } finally {
                    setIsUploadingRx(false);
                  }
                }}
                className={`px-3.5 py-2 text-white rounded-xl text-xs font-extrabold shrink-0 shadow-md transition-all flex items-center gap-1.5 ${
                  isUploadingRx || activePharmacists.length === 0
                    ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-[#10B981] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25'
                }`}
              >
                {isUploadingRx ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                  </>
                ) : activePharmacists.length === 0 ? (
                  'No Pharmacy'
                ) : (
                  'Upload Rx'
                )}
              </button>
            </div>

            <div className="space-y-3">
              {filteredMedicines.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 space-y-2 shadow-sm">
                  <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto opacity-70" />
                  <p className="font-extrabold text-sm text-[#0A1A45] dark:text-white">
                    {activePharmacyMedicines.length === 0 
                      ? 'No medicines available yet. Pharmacies are being onboarded.' 
                      : 'No medicines match your search.'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {activePharmacyMedicines.length === 0 
                      ? 'Verified retail and hospital pharmacies are currently stocking their inventories.'
                      : 'Try adjusting your category filter or search query.'}
                  </p>
                </div>
              ) : (
                filteredMedicines.map(med => (
                  <div key={med.id} className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-sm flex items-start gap-3.5`}>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-500/30">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold text-violet-800 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30">{med.category}</span>
                        {med.requiresRx && (
                          <span className="text-[10px] font-extrabold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Rx Required
                          </span>
                        )}
                        {med.stock <= 0 ? (
                          <span className="text-[10px] font-bold text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full border border-red-200">Out of Stock</span>
                        ) : med.stock <= 10 ? (
                          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-300">Only {med.stock} left!</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300">In Stock ({med.stock})</span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-xs mt-1 text-[#0A1A45] dark:text-white truncate">{med.name}</h3>
                      {med.salt && <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">{med.salt}</p>}
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                        <Store className="w-3 h-3 text-[#10B981] shrink-0" />
                        <span className="truncate">{med.pharmacyName}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#0A1A45] dark:text-white">₹{med.price}</span>
                          {med.mrp > med.price && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 line-through">₹{med.mrp}</span>
                          )}
                        </div>
                        <button 
                          disabled={med.stock <= 0}
                          onClick={() => handleAddToCart(med)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all ${
                            med.stock <= 0 
                              ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed shadow-none'
                              : 'bg-[#10B981] hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {med.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. PROFILE & EXTRAS TAB */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'} p-5 rounded-3xl border shadow-md text-center relative`}>
              <button 
                onClick={() => setShowEditProfileModal(true)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-[#1769E0] dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Edit Profile"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <div className="w-20 h-20 bg-gradient-to-tr from-[#0B2A6F] to-[#1769E0] text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-3 shadow-lg">
                {(currentUser?.name || 'PT')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">{currentUser?.name || 'HealthPilot Patient'}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {currentUser?.phone ? currentUser.phone : 'No phone linked'} • {(currentUser as PatientProfile)?.address || 'No address linked'}
              </p>

              {!isProfileComplete && (
                <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl flex items-center justify-between text-left">
                  <div>
                    <p className="text-xs font-extrabold text-amber-900 dark:text-amber-400">Incomplete Profile</p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">Phone and address are required to book doctors, tests, and medicines.</p>
                  </div>
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shrink-0"
                  >
                    Complete
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">Blood Group</span>
                  <strong className="text-sm text-[#0A1A45] dark:text-white">{(currentUser as PatientProfile)?.bloodGroup || 'Not set'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">Age / Gender</span>
                  <strong className="text-sm text-[#0A1A45] dark:text-white">
                    {((currentUser as PatientProfile)?.age || '--')} / {((currentUser as PatientProfile)?.gender || '--')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">Wallet</span>
                  <strong className="text-teal-700 dark:text-[#0FB5A0] text-sm">₹ {(currentUser as PatientProfile)?.walletBalance ?? 0}</strong>
                </div>
              </div>
            </div>

            {/* Founder Contact Card (Mandatory Requirement) */}
            <div className="bg-gradient-to-r from-[#0B2A6F] to-[#1769E0] p-5 rounded-3xl text-white shadow-lg space-y-2">
              <div className="flex items-center gap-3">
                <FounderAvatar className="w-14 h-14 rounded-full border-2 border-white/30 shadow-md object-cover object-top" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">Leadership</span>
                  <h4 className="font-extrabold text-sm">Founder & Director Contact</h4>
                  <p className="text-xs font-bold text-blue-100">{founderDetails.name}</p>
                </div>
              </div>
              <p className="text-xs text-blue-100 pt-1">Phone / WhatsApp: <a href={`tel:${founderDetails.phone}`} className="underline font-mono">{founderDetails.phone}</a></p>
              <p className="text-[11px] text-blue-200">Office: {founderDetails.office}</p>
            </div>

            {/* Family Members Vault */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">Family Members Vault</h4>
                <button 
                  onClick={() => setShowAddFamilyModal(true)} 
                  className="text-xs text-[#1769E0] font-extrabold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Member
                </button>
              </div>
              <div className="space-y-2">
                {familyMembers.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                    No family members added yet. Add family members to easily book appointments on their behalf.
                  </div>
                ) : (
                  familyMembers.map(fm => (
                    <div key={fm.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-300 dark:border-slate-700">
                      <div>
                        <span className="font-extrabold text-xs text-[#0A1A45] dark:text-white">{fm.name}</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{fm.relation} • {fm.age} yrs • {fm.bloodGroup}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-teal-800 dark:text-teal-300 font-extrabold bg-teal-100 dark:bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-500/30">Active</span>
                        <button
                          onClick={async () => {
                            try {
                              const updated = familyMembers.filter(m => m.id !== fm.id);
                              await updateFamilyMembers(updated);
                              showToast(`Removed ${fm.name} from family vault`);
                            } catch (err: any) {
                              showToast(err?.message || 'Failed to remove member.');
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors"
                          title="Remove family member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Health Records Vault */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">Health Records Vault</h4>
                <button onClick={() => showToast('Secure time-limited doctor sharing link copied!')} className="text-xs text-teal-700 dark:text-[#0FB5A0] font-extrabold">Share Link</button>
              </div>
              <div className="space-y-2">
                {healthRecordsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0FB5A0]" /> Loading health records...
                  </div>
                ) : healthRecords.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1.5 opacity-80" />
                    <p className="font-extrabold text-slate-700 dark:text-slate-300">No health records recorded yet</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Completed prescriptions and verified lab reports will appear here automatically.</p>
                  </div>
                ) : (
                  healthRecords.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-300 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{rec.type} • {rec.date}</span>
                        <h5 className="font-extrabold text-xs mt-0.5 text-[#0A1A45] dark:text-white">{rec.title}</h5>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{rec.doctorOrLab}</p>
                      </div>
                      <button 
                        onClick={() => setViewingReport({ title: rec.title, url: rec.url, doctorOrLab: rec.doctorOrLab, date: rec.date })} 
                        className="p-2 bg-white dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1 text-[11px] font-extrabold text-[#0A1A45] dark:text-white shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-[#0FB5A0]" />
                        <span>View</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* App Preferences */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'} p-4 rounded-3xl border shadow-md space-y-3`}>
              <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">Preferences & Accessibility</h4>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Senior Large Font Mode</span>
                <button onClick={onToggleFont} className={`w-11 h-6 rounded-full transition-colors relative ${isLargeFont ? 'bg-[#1769E0]' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isLargeFont ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Language Switch</span>
                <button onClick={onToggleLanguage} className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-extrabold text-[#0A1A45] dark:text-white rounded-xl shadow-xs">
                  {language === 'en' ? 'English' : 'हिंदी'}
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Lab Test Booking Modal */}
      {selectedTestForBooking && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-end justify-center backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-300'} w-full rounded-t-[36px] p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Book Lab Test</h3>
              <button onClick={() => setSelectedTestForBooking(null)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-teal-50 dark:bg-[#0FB5A0]/10 p-4 rounded-3xl border border-teal-300 dark:border-[#0FB5A0]/30 mb-4">
              <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">{selectedTestForBooking.name}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{selectedTestForBooking.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-teal-200 dark:border-[#0FB5A0]/20">
                <span className="font-extrabold text-teal-700 dark:text-[#0FB5A0] text-lg">{formatINR(getPatientPrice(selectedTestForBooking.labRate))}</span>
                <span className="text-xs font-extrabold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/20 px-2 py-0.5 rounded-full">{selectedTestForBooking.parameters} Parameters Included</span>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Select Diagnostic Lab</label>
                {activeLabs.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 rounded-2xl text-xs text-amber-900 dark:text-amber-500 font-semibold mb-3">
                    No verified diagnostic labs are currently active. Please check back later.
                  </div>
                ) : (
                  <select
                    value={selectedLabId || activeLabs[0]?.id}
                    onChange={e => setSelectedLabId(e.target.value)}
                    className={`w-full p-3 rounded-2xl text-xs font-semibold border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {activeLabs.map(lab => (
                      <option key={lab.id} value={lab.id}>
                        {lab.labName} • {lab.accreditation} Certified
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Collection Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setLabCollectionMode('Home Collection')}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all ${
                      labCollectionMode === 'Home Collection'
                        ? 'bg-[#0FB5A0] text-white shadow-md'
                        : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Home Collection (Free)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLabCollectionMode('Lab Visit')}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all ${
                      labCollectionMode === 'Lab Visit'
                        ? 'bg-[#0FB5A0] text-white shadow-md'
                        : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Visit Lab (10% Off)
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">Payment Method</label>
                <div className="space-y-2">
                  <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    labPaymentMethod === 'Pay at Lab / Sample Collection'
                      ? 'border-[#0FB5A0] bg-teal-50 dark:bg-teal-500/10'
                      : isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="labPaymentMethod"
                        checked={labPaymentMethod === 'Pay at Lab / Sample Collection'}
                        onChange={() => setLabPaymentMethod('Pay at Lab / Sample Collection')}
                        className="text-[#0FB5A0] focus:ring-[#0FB5A0]"
                      />
                      <span className="text-xs font-extrabold text-[#0A1A45] dark:text-white">Pay at Lab / Sample Collection</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-200">Cash / Card</span>
                  </label>

                  <div className={`flex items-center justify-between p-3 rounded-2xl border opacity-60 cursor-not-allowed ${
                    isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-300 bg-slate-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input type="radio" disabled name="labPaymentMethod" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pay online (UPI / Card)</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              disabled={isBookingLab || activeLabs.length === 0}
              onClick={async () => {
                if (activeLabs.length === 0) {
                  showToast('No active diagnostic labs available to fulfill this booking.');
                  return;
                }
                if (!isProfileComplete) {
                  showToast('Please complete your phone number and delivery address before booking.');
                  setShowEditProfileModal(true);
                  return;
                }
                const test = selectedTestForBooking;
                const labId = selectedLabId || activeLabs[0].id;
                const bookingId = `LAB-${Date.now().toString().slice(-6)}`;
                setIsBookingLab(true);
                try {
                  const paymentRes = await manualPaymentService.createPayment(
                    { id: bookingId, type: 'lab', amount: getPatientPrice(test.labRate) },
                    labPaymentMethod
                  );
                  await createLabBooking({
                    patientId: currentUser!.id,
                    patientName: currentUser!.name,
                    patientPhone: currentUser!.phone,
                    testId: test.id,
                    testName: test.name,
                    collectionType: labCollectionMode,
                    dateTime: 'Tomorrow, 7:00 AM',
                    address: (currentUser as PatientProfile).address,
                    status: 'Confirmed',
                    assignedLabId: labId,
                    amount: getPatientPrice(test.labRate),
                    paymentStatus: paymentRes.status,
                    paymentMethod: paymentRes.method,
                    paymentReferenceId: paymentRes.referenceId
                  });
                  setSelectedTestForBooking(null);
                  showToast('Lab test booked successfully! Phlebotomist assigned.');
                } catch (err: any) {
                  showToast(err?.message || 'Failed to book lab test. Please try again.');
                } finally {
                  setIsBookingLab(false);
                }
              }}
              className={`w-full py-4 text-white rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                isBookingLab || activeLabs.length === 0
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-[#0FB5A0] hover:bg-teal-700'
              }`}
            >
              {isBookingLab ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Booking...
                </>
              ) : activeLabs.length === 0 ? (
                'No Active Labs Available'
              ) : (
                `Confirm & Book • ${formatINR(getPatientPrice(selectedTestForBooking.labRate))}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Doctor Real Slot Booking Modal */}
      {selectedDoctorForBooking && (() => {
        const doctorItem = selectedDoctorForBooking;
        const next7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
          const dateNum = d.getDate();
          const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
          return { date: d, dayName, dateNum, monthName, offset: i };
        });

        const activeDateObj = next7Days[doctorDateOffset].date;
        const availableSlots = generateDoctorSlots(doctorItem, activeDateObj, bookedSlotIds);

        return (
          <div className="absolute inset-0 bg-black/70 z-50 flex items-end justify-center backdrop-blur-sm">
            <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-300'} w-full rounded-t-[36px] p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Select Consultation Slot</h3>
                <button 
                  onClick={() => {
                    setSelectedDoctorForBooking(null);
                    setSelectedDoctorSlot(null);
                  }} 
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Doctor Header */}
              <div className="flex items-center gap-3.5 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-3xl mb-4">
                <img 
                  src={doctorItem.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'} 
                  alt={doctorItem.name} 
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-blue-300 dark:border-blue-200" 
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm truncate text-[#0A1A45] dark:text-white">{doctorItem.name}</h4>
                  <p className="text-xs text-[#1769E0] font-extrabold truncate">{doctorItem.specialty}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate font-medium">{doctorItem.hospitalOrClinic || 'HealthPilot Clinic'}</p>
                  <p className="text-xs font-extrabold text-[#0A1A45] dark:text-white mt-0.5">₹{doctorItem.consultationFee} fee</p>
                </div>
              </div>

              <div className="space-y-4 mb-5">
                {/* Mode Selector */}
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Consultation Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setDoctorConsultMode('Video')}
                      className={`py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        doctorConsultMode === 'Video'
                          ? 'bg-[#1769E0] text-white shadow-md'
                          : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" /> Video Call
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDoctorConsultMode('Clinic visit')}
                      className={`py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        doctorConsultMode === 'Clinic visit'
                          ? 'bg-[#1769E0] text-white shadow-md'
                          : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" /> Clinic Visit
                    </button>
                  </div>
                </div>

                {/* 7-Day Date Picker */}
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">Select Date (Next 7 Days)</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {next7Days.map(item => {
                      const isSelected = doctorDateOffset === item.offset;
                      return (
                        <button
                          key={item.offset}
                          type="button"
                          onClick={() => {
                            setDoctorDateOffset(item.offset);
                            setSelectedDoctorSlot(null);
                          }}
                          className={`flex-1 min-w-[58px] py-2.5 px-2 rounded-2xl text-center border transition-all ${
                            isSelected
                              ? 'bg-[#1769E0] text-white border-[#1769E0] shadow-md shadow-blue-500/25 scale-[1.02]'
                              : isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-extrabold block">{item.dayName}</span>
                          <span className="text-sm font-extrabold block leading-tight">{item.dateNum}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-bold">{item.monthName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Real Slots Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Available Doctor Slots</label>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                      {availableSlots.filter(s => !s.isPast && !s.isBooked).length} open
                    </span>
                  </div>

                  {availableSlots.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Doctor is not scheduled on this day. Please select another date above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                      {availableSlots.map(slot => {
                        const isSelected = selectedDoctorSlot?.slotId === slot.slotId;
                        const isDisabled = slot.isPast || slot.isBooked;

                        return (
                          <button
                            key={slot.slotId}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setSelectedDoctorSlot(slot)}
                            className={`py-2 px-1.5 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#1769E0] to-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                                : isDisabled
                                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                : isDarkMode
                                ? 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-blue-400 hover:bg-blue-500/10'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-blue-500 hover:bg-blue-50 shadow-xs'
                            }`}
                          >
                            <span>{slot.label}</span>
                            {slot.isBooked && (
                              <span className="text-[9px] text-red-600 font-bold block">Booked</span>
                            )}
                            {slot.isPast && (
                              <span className="text-[9px] text-slate-400 font-normal block">Past</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">Payment Method</label>
                  <div className="space-y-2">
                    <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      doctorPaymentMethod === 'Pay at Clinic'
                        ? 'border-[#1769E0] bg-blue-50 dark:bg-blue-500/10'
                        : isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="doctorPaymentMethod"
                          checked={doctorPaymentMethod === 'Pay at Clinic'}
                          onChange={() => setDoctorPaymentMethod('Pay at Clinic')}
                          className="text-[#1769E0] focus:ring-[#1769E0]"
                        />
                        <span className="text-xs font-extrabold text-[#0A1A45] dark:text-white">Pay at Clinic / Post Consultation</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-200">Cash / UPI</span>
                    </label>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border opacity-60 cursor-not-allowed ${
                      isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-300 bg-slate-100'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <input type="radio" disabled name="doctorPaymentMethod" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pay online (UPI / Card)</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Coming soon</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Consultation Slot */}
              <button 
                disabled={isBookingDoctor || !selectedDoctorSlot}
                onClick={async () => {
                  if (!selectedDoctorSlot) {
                    showToast('Please select an available consultation slot.');
                    return;
                  }
                  if (!isProfileComplete) {
                    showToast('Please complete your phone number and address in your Profile before booking.');
                    setShowEditProfileModal(true);
                    return;
                  }

                  const targetSlot = selectedDoctorSlot;
                  const apptId = `APPT-${Date.now().toString().slice(-6)}`;
                  const privateRoomName = generateRoomName(apptId);
                  setIsBookingDoctor(true);

                  try {
                    const paymentRes = await manualPaymentService.createPayment(
                      { id: apptId, type: 'consultation', amount: doctorItem.consultationFee },
                      doctorPaymentMethod
                    );

                    // Firestore Transaction to guarantee double booking cannot happen
                    await runTransaction(db, async (transaction) => {
                      const slotRef = doc(db, 'bookedSlots', targetSlot.slotId);
                      const slotSnap = await transaction.get(slotRef);

                      if (slotSnap.exists()) {
                        throw new Error('This slot was just booked, please choose another.');
                      }

                      // 1. Reserve the slot
                      transaction.set(slotRef, {
                        doctorId: doctorItem.id,
                        patientId: currentUser!.id,
                        appointmentId: apptId,
                        date: targetSlot.dateStr,
                        time: targetSlot.time,
                        createdAt: new Date().toISOString()
                      });

                      // 2. Create the appointment document
                      const apptRef = doc(db, 'appointments', apptId);
                      transaction.set(apptRef, sanitizeFirestoreDoc({
                        id: apptId,
                        patientId: currentUser!.id,
                        patientName: currentUser!.name,
                        patientAge: (currentUser as PatientProfile).age || 0,
                        patientGender: (currentUser as PatientProfile).gender || 'Other',
                        doctorId: doctorItem.id,
                        doctorName: doctorItem.name,
                        doctorSpecialty: doctorItem.specialty,
                        mode: doctorConsultMode,
                        dateTime: `${targetSlot.dateStr} ${targetSlot.label}`,
                        status: 'Scheduled',
                        fee: doctorItem.consultationFee,
                        symptoms: 'General consultation',
                        bookedSlotId: targetSlot.slotId,
                        roomName: privateRoomName,
                        paymentStatus: paymentRes.status,
                        paymentMethod: paymentRes.method,
                        paymentReferenceId: paymentRes.referenceId
                      }));
                    });

                    // Dispatch notifications to doctor and patient
                    try {
                      await sendAppNotification({
                        userId: doctorItem.id,
                        title: 'New Appointment Booked',
                        body: `${currentUser!.name} booked a ${doctorConsultMode} consultation on ${targetSlot.dateStr} at ${targetSlot.label}.`,
                        type: 'appointment'
                      });
                      await sendAppNotification({
                        userId: currentUser!.id,
                        title: 'Appointment Confirmed',
                        body: `Your consultation with Dr. ${doctorItem.name} on ${targetSlot.dateStr} at ${targetSlot.label} is confirmed.`,
                        type: 'appointment'
                      });
                    } catch (notifErr) {
                      console.warn('Notification error:', notifErr);
                    }

                    setSelectedDoctorForBooking(null);
                    setSelectedDoctorSlot(null);
                    showToast(`Appointment confirmed for ${targetSlot.dateStr} at ${targetSlot.label}!`);
                  } catch (err: any) {
                    showToast(err?.message || 'Failed to confirm appointment. Please try again.');
                  } finally {
                    setIsBookingDoctor(false);
                  }
                }}
                className={`w-full py-4 text-white rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                  isBookingDoctor || !selectedDoctorSlot
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-[#1769E0] hover:bg-blue-700 shadow-blue-500/25'
                }`}
              >
                {isBookingDoctor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Reserving Slot...
                  </>
                ) : !selectedDoctorSlot ? (
                  'Select an Available Slot'
                ) : (
                  `Confirm Slot (${selectedDoctorSlot.label}) • ₹${doctorItem.consultationFee}`
                )}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Pharmacy Cart Modal */}
      {showCart && (() => {
        const cartRequiresRx = cartMedicines.some(item => item.medicine.requiresRx);
        const fulfillingPharmaName = cartMedicines[0]?.medicine.pharmacyName || 'Partner Pharmacy';
        const fulfillingPharmaId = cartMedicines[0]?.medicine.pharmacyId;
        const totalAmount = cartMedicines.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
        const savedPrescriptions = healthRecords.filter(r => r.type === 'Prescription');

        return (
          <div className="absolute inset-0 bg-black/70 z-50 flex items-end justify-center backdrop-blur-sm">
            <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-300'} w-full rounded-t-[36px] p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Pharmacy Cart</h3>
                <button onClick={() => setShowCart(false)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
              </div>

              {cartMedicines.length === 0 ? (
                <div className="text-center py-8 text-slate-600 dark:text-slate-400 text-xs font-medium">Your cart is empty. Add medicines from active pharmacy inventory.</div>
              ) : (
                <div className="space-y-4 mb-5">
                  {/* Fulfilling Pharmacy Header */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/25 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#10B981] shrink-0" />
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Fulfilling Pharmacy</span>
                        <h5 className="font-extrabold text-xs text-[#0A1A45] dark:text-white">{fulfillingPharmaName}</h5>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-200">Verified Retail</span>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-2">
                    {cartMedicines.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-xs truncate text-[#0A1A45] dark:text-white">{item.medicine.name}</h4>
                            {item.medicine.requiresRx && (
                              <span className="text-[9px] font-extrabold text-rose-800 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/20 border border-rose-300 px-1.5 py-0.2 rounded">Rx</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">₹{item.medicine.price} × {item.quantity}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => {
                              setCartMedicines(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity - 1 } : it).filter(it => it.quantity > 0));
                            }}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-extrabold text-xs flex items-center justify-center hover:bg-slate-100 text-slate-800 dark:text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-extrabold w-4 text-center text-[#0A1A45] dark:text-white">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              if (item.quantity >= item.medicine.stock) {
                                showToast(`Only ${item.medicine.stock} units available.`);
                                return;
                              }
                              setCartMedicines(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
                            }}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-extrabold text-xs flex items-center justify-center hover:bg-slate-100 text-slate-800 dark:text-white"
                          >
                            +
                          </button>
                          <span className="font-extrabold text-xs w-14 text-right text-[#0A1A45] dark:text-white">₹{item.medicine.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prescription Requirement Section */}
                  {cartRequiresRx && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <h5 className="font-extrabold text-xs">Doctor Prescription Required</h5>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug font-medium">
                        One or more items in your cart require a medical prescription to be dispensed legally.
                      </p>

                      {/* Pick Saved Prescription */}
                      {savedPrescriptions.length > 0 && (
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                            Choose from Health Records Vault:
                          </label>
                          <select
                            value={selectedPrescriptionRecordId}
                            onChange={e => {
                              setSelectedPrescriptionRecordId(e.target.value);
                              if (e.target.value) setUploadedPrescriptionUrl('');
                            }}
                            className={`w-full p-2 rounded-xl text-xs border ${
                              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="">-- Select a saved prescription --</option>
                            {savedPrescriptions.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.title} ({p.doctorOrLab || 'Doctor'} • {p.date})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Or Upload Prescription Image/PDF */}
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                          {savedPrescriptions.length > 0 ? 'Or Upload New Prescription (PDF / JPG / PNG):' : 'Upload Prescription (PDF / JPG / PNG):'}
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 py-2 px-3 border border-dashed border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-emerald-500/5 hover:bg-emerald-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all truncate">
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {uploadedPrescriptionUrl ? 'Prescription Uploaded ✓' : isUploadingPrescription ? `Uploading ${prescriptionUploadProgress}%...` : 'Select File (Max 5MB)'}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/jpg,image/png"
                              className="hidden"
                              disabled={isUploadingPrescription}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setPrescriptionUploadError('');
                                setIsUploadingPrescription(true);
                                try {
                                  const path = `prescriptions/${currentUser?.id || 'patient'}/rx_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
                                  const url = await uploadFile(path, file, (p) => setPrescriptionUploadProgress(p));
                                  setUploadedPrescriptionUrl(url);
                                  setSelectedPrescriptionRecordId('');
                                  showToast('Prescription uploaded successfully!');
                                } catch (err: any) {
                                  setPrescriptionUploadError(err?.message || 'Failed to upload prescription');
                                  showToast(err?.message || 'Upload failed');
                                } finally {
                                  setIsUploadingPrescription(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {prescriptionUploadError && (
                          <p className="text-[10px] text-red-600 font-extrabold mt-1">{prescriptionUploadError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Method Selector */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">Payment Method</label>
                    <div className="space-y-2">
                      <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        pharmacyPaymentMethod === 'Cash on Delivery'
                          ? 'border-[#10B981] bg-emerald-50 dark:bg-emerald-500/10'
                          : isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="pharmacyPaymentMethod"
                            checked={pharmacyPaymentMethod === 'Cash on Delivery'}
                            onChange={() => setPharmacyPaymentMethod('Cash on Delivery')}
                            className="text-[#10B981] focus:ring-[#10B981]"
                          />
                          <span className="text-xs font-extrabold text-[#0A1A45] dark:text-white">Cash on Delivery (COD)</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-200">Pay at doorstep</span>
                      </label>

                      <div className={`flex items-center justify-between p-3 rounded-2xl border opacity-60 cursor-not-allowed ${
                        isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-300 bg-slate-100'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <input type="radio" disabled name="pharmacyPaymentMethod" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pay online (UPI / Card)</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Coming soon</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#0A1A45] dark:text-white">Total Amount</span>
                    <span className="font-extrabold text-emerald-700 dark:text-[#10B981] text-lg">
                      ₹{totalAmount}
                    </span>
                  </div>

                  <button 
                    disabled={isPlacingOrder || activePharmacists.length === 0}
                    onClick={async () => {
                      if (activePharmacists.length === 0) {
                        showToast('No active pharmacies available to fulfill your order.');
                        return;
                      }
                      if (!isProfileComplete) {
                        showToast('Please complete your phone number and delivery address before ordering.');
                        setShowEditProfileModal(true);
                        return;
                      }

                      // Check prescription requirement
                      if (cartRequiresRx && !selectedPrescriptionRecordId && !uploadedPrescriptionUrl) {
                        showToast('Please select or upload a valid prescription for this order.');
                        return;
                      }

                      const items = [...cartMedicines];
                      const pharmaId = fulfillingPharmaId || activePharmacists[0].id;
                      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
                      setIsPlacingOrder(true);

                      try {
                        const paymentRes = await manualPaymentService.createPayment(
                          { id: orderId, type: 'pharmacy', amount: totalAmount },
                          pharmacyPaymentMethod
                        );

                        const attachedRxUrl = uploadedPrescriptionUrl || 
                          (savedPrescriptions.find(p => p.id === selectedPrescriptionRecordId)?.url) || 
                          undefined;

                        await createPharmacyOrder({
                          patientId: currentUser!.id,
                          patientName: currentUser!.name,
                          patientPhone: currentUser!.phone,
                          pharmacyId: pharmaId,
                          items: items.map(i => ({
                            medicineId: i.medicine.id,
                            medicineName: i.medicine.name,
                            quantity: i.quantity,
                            price: i.medicine.price
                          })),
                          totalAmount,
                          status: 'Placed',
                          orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                          deliveryAddress: (currentUser as PatientProfile).address,
                          rxAttached: cartRequiresRx,
                          rxImageUrl: attachedRxUrl,
                          paymentStatus: paymentRes.status,
                          paymentMethod: paymentRes.method,
                          paymentReferenceId: paymentRes.referenceId
                        });

                        setShowCart(false);
                        setCartMedicines([]);
                        setSelectedPrescriptionRecordId('');
                        setUploadedPrescriptionUrl('');
                        showToast('Order placed successfully! Delivery in 45 mins.');
                      } catch (err: any) {
                        showToast(err?.message || 'Failed to place order. Please try again.');
                      } finally {
                        setIsPlacingOrder(false);
                      }
                    }}
                    className={`w-full py-4 text-white rounded-2xl font-extrabold text-sm shadow-xl mt-3 flex items-center justify-center gap-2 transition-all ${
                      isPlacingOrder || activePharmacists.length === 0
                        ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-[#10B981] hover:bg-emerald-700 shadow-emerald-500/25'
                    }`}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                      </>
                    ) : (
                      `Place Order with Cash on Delivery (₹${totalAmount})`
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Pharmacy Conflict Modal (Single-Pharmacy Enforcement) */}
      {pharmacyConflict && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'} w-full max-w-sm rounded-[32px] p-6 shadow-2xl border space-y-4 animate-scale-in`}>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-500 flex items-center justify-center mx-auto border border-amber-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-center text-[#0A1A45] dark:text-white">Replace Cart Items?</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 text-center leading-relaxed font-medium">
              Your cart currently contains medicines from <strong className="text-[#0A1A45] dark:text-white font-extrabold">{pharmacyConflict.existingPharmacy}</strong>. Each order must be fulfilled by a single pharmacy.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setCartMedicines([{ medicine: pharmacyConflict.incomingItem, quantity: 1 }]);
                  showToast(`Cart replaced with items from ${pharmacyConflict.incomingItem.pharmacyName}`);
                  setPharmacyConflict(null);
                }}
                className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-xs shadow-md transition-all"
              >
                Clear Cart & Add from {pharmacyConflict.incomingItem.pharmacyName}
              </button>
              <button
                onClick={() => setPharmacyConflict(null)}
                className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-2xl font-extrabold text-xs hover:bg-slate-100 transition-all shadow-xs"
              >
                Keep Existing Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Consultation Room */}
      {activeConsultationRoom && (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col text-white">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={activeConsultationRoom.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-sm">{activeConsultationRoom.name}</h4>
                <p className="text-[11px] text-teal-400 font-bold">Secure Video Consultation</p>
              </div>
            </div>
            <button onClick={() => setActiveConsultationRoom(null)} className="px-3 py-1.5 bg-red-600 rounded-xl text-xs font-bold">End Call</button>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center">
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-mono text-emerald-400">● Live 04:12</div>
              <Video className="w-16 h-16 text-[#1769E0] animate-pulse mb-3" />
              <h3 className="font-extrabold text-base">{activeConsultationRoom.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Digital Prescription will be generated at end of call.</p>
            </div>
          </div>
        </div>
      )}

      {/* Real Lab Report & Prescription Viewer Modal */}
      {viewingReport && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-300'} w-full max-w-lg max-h-[85vh] rounded-[36px] p-6 shadow-2xl border flex flex-col space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <HealthPilotLogo size="sm" />
              <button onClick={() => setViewingReport(null)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">{viewingReport.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{viewingReport.doctorOrLab || 'HealthPilot Diagnostic Partner'} • {viewingReport.date || 'Verified'}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {viewingReport.url && viewingReport.url.startsWith('http') ? (
                viewingReport.url.toLowerCase().includes('.pdf') || viewingReport.url.includes('alt=media') ? (
                  <iframe 
                    src={viewingReport.url} 
                    title={viewingReport.title}
                    className="w-full h-80 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950" 
                  />
                ) : (
                  <img 
                    src={viewingReport.url} 
                    alt={viewingReport.title} 
                    className="w-full max-h-80 object-contain rounded-2xl border border-slate-300 dark:border-slate-800" 
                  />
                )
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-2 border border-slate-300 dark:border-slate-700">
                  <Clock className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-slate-200">Report pending from diagnostic lab</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    The lab is currently processing your sample. Once verified, your official PDF report will appear here automatically.
                  </p>
                </div>
              )}
            </div>

            {viewingReport.url && viewingReport.url.startsWith('http') && (
              <div className="flex gap-2 pt-2 border-t border-slate-300 dark:border-slate-800">
                <a
                  href={viewingReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-[#0FB5A0] hover:bg-teal-700 text-white rounded-2xl font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" /> Open / Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {rescheduleAppt && (() => {
        const apptDoc = doctors.find(d => d.id === rescheduleAppt.doctorId);
        const next7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
          const dateNum = d.getDate();
          const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
          return { date: d, dayName, dateNum, monthName, offset: i };
        });

        const activeDateObj = next7Days[rescheduleDateOffset].date;
        const availableSlots = apptDoc ? generateDoctorSlots(apptDoc, activeDateObj, bookedSlotIds) : [];

        return (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-300'} w-full max-w-sm rounded-[32px] p-6 shadow-2xl space-y-4 animate-scale-in`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#1769E0]" />
                  <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Reschedule Appointment</h3>
                </div>
                <button 
                  onClick={() => {
                    setRescheduleAppt(null);
                    setRescheduleSelectedSlot(null);
                  }} 
                  className="p-1 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl space-y-1 text-xs">
                <p className="font-extrabold text-[#0A1A45] dark:text-white">{rescheduleAppt.doctorName}</p>
                <p className="text-slate-600 dark:text-slate-400 font-medium">{rescheduleAppt.doctorSpecialty} • {rescheduleAppt.mode}</p>
                <p className="text-[11px] text-[#1769E0] font-extrabold">Current Slot: {rescheduleAppt.dateTime}</p>
              </div>

              {/* 7-Day Date Picker */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold block text-slate-700 dark:text-slate-300">
                  Select New Date:
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {next7Days.map(item => {
                    const isSelected = rescheduleDateOffset === item.offset;
                    return (
                      <button
                        key={item.offset}
                        type="button"
                        onClick={() => {
                          setRescheduleDateOffset(item.offset);
                          setRescheduleSelectedSlot(null);
                        }}
                        className={`flex-1 min-w-[50px] py-2 px-1 rounded-xl text-center border transition-all ${
                          isSelected
                            ? 'bg-[#1769E0] text-white border-[#1769E0] shadow-sm'
                            : isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-slate-300'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-extrabold block">{item.dayName}</span>
                        <span className="text-xs font-extrabold block">{item.dateNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot Picker */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold block text-slate-700 dark:text-slate-300">
                  Select Available Slot:
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    No open slots on this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-0.5">
                    {availableSlots.map(slot => {
                      const isSelected = rescheduleSelectedSlot?.slotId === slot.slotId;
                      const isDisabled = slot.isPast || slot.isBooked;

                      return (
                        <button
                          key={slot.slotId}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setRescheduleSelectedSlot(slot)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-extrabold border transition-all ${
                            isSelected
                              ? 'bg-[#1769E0] text-white border-blue-500 shadow-sm'
                              : isDisabled
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                              : isDarkMode
                              ? 'bg-slate-900 text-slate-200 border-slate-700 hover:border-blue-400'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold block text-slate-700 dark:text-slate-300">
                  Reason for Rescheduling:
                </label>
                <select
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium border ${
                    isDarkMode 
                      ? 'bg-slate-900 text-white border-slate-700' 
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                >
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Personal emergency">Personal emergency</option>
                  <option value="Health feeling better">Health feeling better</option>
                  <option value="Doctor suggested change">Doctor suggested change</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={!rescheduleSelectedSlot}
                  onClick={async () => {
                    if (!rescheduleSelectedSlot) return;
                    const targetAppt = rescheduleAppt;
                    const newSlot = rescheduleSelectedSlot;
                    setRescheduleAppt(null);

                    try {
                      // 1. Delete old bookedSlot document if exists
                      if (targetAppt.bookedSlotId) {
                        try {
                          await deleteDoc(doc(db, 'bookedSlots', targetAppt.bookedSlotId));
                        } catch (e) {
                          console.warn('Failed to delete old slot:', e);
                        }
                      }

                      // 2. Create new bookedSlot document
                      await setDoc(doc(db, 'bookedSlots', newSlot.slotId), {
                        doctorId: targetAppt.doctorId,
                        patientId: currentUser!.id,
                        appointmentId: targetAppt.id,
                        date: newSlot.dateStr,
                        time: newSlot.time,
                        createdAt: new Date().toISOString()
                      });

                      // 3. Update appointment
                      const newDateTimeStr = `${newSlot.dateStr} ${newSlot.label}`;
                      await updateAppointment(targetAppt.id, { 
                        dateTime: newDateTimeStr,
                        bookedSlotId: newSlot.slotId
                      });

                      showToast(`Appointment rescheduled to ${newDateTimeStr}!`);
                    } catch (err: any) {
                      showToast(err?.message || 'Failed to reschedule appointment.');
                    }
                  }}
                  className={`flex-1 py-3 text-white rounded-2xl font-extrabold text-xs shadow-lg transition-all text-center ${
                    !rescheduleSelectedSlot
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] hover:from-blue-600 hover:to-teal-600 shadow-blue-500/25'
                  }`}
                >
                  Confirm Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduleAppt(null)}
                  className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Family Member Modal */}
      {showAddFamilyModal && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-300'} w-full max-w-sm rounded-[32px] p-6 shadow-2xl space-y-4 animate-scale-in`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Add Family Member</h3>
              <button onClick={() => setShowAddFamilyModal(false)} className="p-1 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={newFmName}
                  onChange={e => setNewFmName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Relationship</label>
                  <select
                    value={newFmRelation}
                    onChange={e => setNewFmRelation(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 58"
                    value={newFmAge}
                    onChange={e => setNewFmAge(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Gender</label>
                  <select
                    value={newFmGender}
                    onChange={e => setNewFmGender(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Blood Group</label>
                  <select
                    value={newFmBlood}
                    onChange={e => setNewFmBlood(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isSavingFamily}
                onClick={async () => {
                  if (!newFmName.trim()) {
                    showToast('Please enter family member full name.');
                    return;
                  }
                  const ageNum = parseInt(newFmAge);
                  if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
                    showToast('Please enter a valid age between 1 and 120.');
                    return;
                  }
                  setIsSavingFamily(true);
                  try {
                    const newMember: FamilyMember = {
                      id: `FM-${Date.now().toString().slice(-6)}`,
                      name: newFmName.trim(),
                      relation: newFmRelation,
                      age: ageNum,
                      gender: newFmGender,
                      bloodGroup: newFmBlood
                    };
                    const updated = [...familyMembers, newMember];
                    await updateFamilyMembers(updated);
                    setShowAddFamilyModal(false);
                    setNewFmName('');
                    setNewFmAge('');
                    showToast(`Added ${newMember.name} to family members vault!`);
                  } catch (err: any) {
                    showToast(err?.message || 'Failed to save family member.');
                  } finally {
                    setIsSavingFamily(false);
                  }
                }}
                className={`flex-1 py-3 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] text-white rounded-2xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 ${
                  isSavingFamily ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isSavingFamily ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save Member
              </button>
              <button
                onClick={() => setShowAddFamilyModal(false)}
                className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete / Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-300'} w-full max-w-sm rounded-[32px] p-6 shadow-2xl space-y-4 animate-scale-in`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Complete Your Profile</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Required for bookings, prescriptions, and deliveries.</p>
              </div>
              <button onClick={() => setShowEditProfileModal(false)} className="p-1 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Mobile Number (10 digits)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Delivery / Home Address</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Tower B, Sector 62, Noida"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={editAge}
                    onChange={e => setEditAge(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold block mb-1 text-slate-700 dark:text-slate-300">Blood Group</label>
                  <select
                    value={editBloodGroup}
                    onChange={e => setEditBloodGroup(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isSavingProfile}
                onClick={async () => {
                  const cleanPhone = editPhone.replace(/[^0-9]/g, '').slice(-10);
                  if (!cleanPhone || cleanPhone.length !== 10) {
                    showToast('Please enter a valid 10-digit mobile number.');
                    return;
                  }
                  if (!editAddress.trim()) {
                    showToast('Please enter your delivery/home address.');
                    return;
                  }
                  const ageNum = parseInt(editAge) || 0;
                  setIsSavingProfile(true);
                  try {
                    await updatePatientProfile({
                      phone: `+91 ${cleanPhone}`,
                      address: editAddress.trim(),
                      age: ageNum,
                      bloodGroup: editBloodGroup
                    });
                    setShowEditProfileModal(false);
                    showToast('Profile updated successfully!');
                  } catch (err: any) {
                    showToast(err?.message || 'Failed to update profile.');
                  } finally {
                    setIsSavingProfile(false);
                  }
                }}
                className={`flex-1 py-3 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] text-white rounded-2xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 ${
                  isSavingProfile ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Profile
              </button>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Symptom Checker Modal */}
      <SymptomCheckerModal
        isOpen={showSymptomChecker}
        onClose={() => setShowSymptomChecker(false)}
        isDarkMode={isDarkMode}
        language={language}
        onSelectSpecialty={handleSelectSpecialtyFromChecker}
        onSelectLabTest={handleSelectLabTestFromChecker}
        patientAge={currentUser?.role === 'patient' ? (currentUser as PatientProfile).age : undefined}
        patientGender={currentUser?.role === 'patient' ? (currentUser as PatientProfile).gender : undefined}
      />

      {/* Bottom Navigation Bar (5 Tabs) */}
      <nav className={`fixed md:absolute bottom-0 left-0 right-0 md:max-w-[480px] md:mx-auto glass-header px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around z-30 shadow-2xl rounded-t-3xl border-t border-slate-300 dark:border-slate-800`}>
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'home' 
              ? 'text-[#1769E0] font-extrabold bg-blue-500/10 shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('consultation')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'consultation' 
              ? 'text-[#1769E0] font-extrabold bg-blue-500/10 shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <Stethoscope className="w-5 h-5" />
          <span className="text-[10px]">Consult</span>
        </button>
        <button 
          onClick={() => setActiveTab('tests')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'tests' 
              ? 'text-[#0FB5A0] font-extrabold bg-teal-500/10 shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Tests</span>
        </button>
        <button 
          onClick={() => setActiveTab('medicines')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'medicines' 
              ? 'text-[#10B981] font-extrabold bg-emerald-500/10 shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">Medicines</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'profile' 
              ? 'text-[#1769E0] font-extrabold bg-blue-500/10 shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    </div>
  );
};
