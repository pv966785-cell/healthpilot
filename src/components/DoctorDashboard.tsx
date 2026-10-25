import React, { useState } from 'react';
import { useAuth, sanitizeFirestoreDoc } from '../context/AuthContext';
import { HealthPilotLogo } from './HealthPilotLogo';
import { DoctorProfile, DoctorAppointment, DigitalPrescription, WeekdaySchedule, DoctorSchedule } from '../types';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCallWindowStatus, getJitsiUrl, getDirectionsUrl, generateRoomName } from '../utils/consultation';
import { sendAppNotification } from '../services/notifications';
import { NotificationBell } from './NotificationBell';
import { useT } from '../i18n';
import { 
  Video, MessageSquare, Clock, CheckCircle2, FileText, User, 
  Calendar, CreditCard, Star, Plus, ShieldCheck, LogOut, ArrowRight, X, Download, AlertCircle, Loader2,
  Trash2, Printer, Check, DollarSign, CalendarDays, Lock, ExternalLink, MapPin, Globe, Shield
} from 'lucide-react';

const COMMON_MEDICINE_SUGGESTIONS = [
  'Paracetamol 650',
  'Amoxicillin 500',
  'Pantoprazole 40',
  'Cetirizine 10',
  'Azithromycin 500',
  'Metformin 500',
  'Telmisartan 40'
];

const DEFAULT_WEEKLY_SCHEDULE: WeekdaySchedule[] = [
  { day: 'Mon', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15 },
  { day: 'Tue', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15 },
  { day: 'Wed', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15 },
  { day: 'Thu', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15 },
  { day: 'Fri', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15 },
  { day: 'Sat', enabled: false, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 15 },
  { day: 'Sun', enabled: false, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 15 },
];

export const DoctorDashboard: React.FC = () => {
  const { currentUser, logout, appointments, dataLoading, updateAppointment } = useAuth();
  const { t, language, toggleLanguage } = useT();
  const doctor = currentUser as DoctorProfile;

  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [activeCallAppointment, setActiveCallAppointment] = useState<DoctorAppointment | null>(null);
  const [showRxModal, setShowRxModal] = useState<DoctorAppointment | null>(null);
  const [isSubmittingRx, setIsSubmittingRx] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [showScheduleManager, setShowScheduleManager] = useState<boolean>(false);

  // Doctor Schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<WeekdaySchedule[]>(
    doctor?.schedule?.weeklySchedule?.length ? doctor.schedule.weeklySchedule : DEFAULT_WEEKLY_SCHEDULE
  );
  const [unavailableDates, setUnavailableDates] = useState<string[]>(
    doctor?.schedule?.unavailableDates || []
  );
  const [newUnavailableDate, setNewUnavailableDate] = useState<string>('');
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  // Clean, empty prescription form state
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxMedicines, setRxMedicines] = useState<{ name: string; dosage: string; duration: string; instructions: string }[]>([]);
  const [rxVitals, setRxVitals] = useState({ bp: '', pulse: '', temp: '', weight: '' });
  const [rxTests, setRxTests] = useState('');
  const [rxAdvice, setRxAdvice] = useState('');
  const [rxFollowUp, setRxFollowUp] = useState('');

  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const showToast = (msg: string, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartConsultation = async (apt: DoctorAppointment) => {
    const windowCheck = getCallWindowStatus(apt.dateTime);
    if (!windowCheck.canJoin) {
      showToast(windowCheck.message || t('callWindowNotice'), true);
      return;
    }

    const room = apt.roomName || generateRoomName(apt.id);
    if (!apt.roomName) {
      try {
        await updateAppointment(apt.id, { roomName: room, status: 'In Progress' });
      } catch (e) {
        console.warn('Could not update appointment roomName:', e);
      }
    } else if (apt.status !== 'In Progress') {
      try {
        await updateAppointment(apt.id, { status: 'In Progress' });
      } catch (e) {
        console.warn('Could not update status to In Progress:', e);
      }
    }

    window.open(getJitsiUrl(room), '_blank', 'noopener,noreferrer');
    setActiveCallAppointment(apt);
    showToast(`${t('startConsultation')}: ${apt.patientName}`);
  };

  const handleSaveSchedule = async () => {
    if (!doctor?.id) return;
    setIsSavingSchedule(true);
    try {
      const scheduleObj: DoctorSchedule = {
        weeklySchedule,
        unavailableDates
      };
      await updateDoc(doc(db, 'users', doctor.id), sanitizeFirestoreDoc({ schedule: scheduleObj }));
      showToast('Doctor consultation schedule saved to profile!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save schedule.', true);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleAddUnavailableDate = () => {
    if (!newUnavailableDate) return;
    if (unavailableDates.includes(newUnavailableDate)) {
      showToast('Date already added to unavailable list.', true);
      return;
    }
    setUnavailableDates(prev => [...prev, newUnavailableDate].sort());
    setNewUnavailableDate('');
  };

  const handleRemoveUnavailableDate = (dateStr: string) => {
    setUnavailableDates(prev => prev.filter(d => d !== dateStr));
  };

  const handleMarkPaymentReceived = async (aptId: string) => {
    try {
      await updateAppointment(aptId, { paymentStatus: 'Paid' });
      showToast('Payment marked as Received!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update payment status.', true);
    }
  };

  const handleOpenRxModal = (apt: DoctorAppointment) => {
    setShowRxModal(apt);
    setShowPrintPreview(false);
    // Reset form to clean state
    setRxDiagnosis('');
    setRxMedicines([{ name: 'Paracetamol 650', dosage: '1 Tab BD', duration: '5 Days', instructions: 'After meals' }]);
    setRxVitals({ bp: '120/80', pulse: '72', temp: '98.6', weight: '' });
    setRxTests('');
    setRxAdvice('');
    setRxFollowUp('');
  };

  const handleAddMedicineRow = (initialName = '') => {
    setRxMedicines(prev => [
      ...prev,
      { name: initialName, dosage: '1 Tab Daily', duration: '5 Days', instructions: 'After meals' }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setRxMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    setRxMedicines(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSavePrescription = async () => {
    if (!showRxModal || isSubmittingRx) return;

    if (!rxDiagnosis.trim()) {
      showToast('Diagnosis is required to generate a prescription.', true);
      return;
    }

    const validMedicines = rxMedicines.filter(m => m.name.trim().length > 0);
    if (validMedicines.length === 0) {
      showToast('Please add at least 1 medicine to the prescription.', true);
      return;
    }

    setIsSubmittingRx(true);

    const vitalsFormatted = {
      bp: rxVitals.bp ? `${rxVitals.bp} mmHg` : '',
      pulse: rxVitals.pulse ? `${rxVitals.pulse} bpm` : '',
      temp: rxVitals.temp ? `${rxVitals.temp} °F` : '',
      weight: rxVitals.weight ? `${rxVitals.weight} kg` : ''
    };

    const newRx: DigitalPrescription = {
      id: `RX-${Date.now().toString().slice(-4)}`,
      appointmentId: showRxModal.id,
      patientName: showRxModal.patientName,
      doctorName: doctor?.name || 'Dr. Consultant',
      doctorSpecialty: doctor?.specialty || 'General Physician',
      doctorCouncilNo: doctor?.councilRegistrationNumber || '',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      vitals: vitalsFormatted,
      diagnosis: rxDiagnosis.trim(),
      medicines: validMedicines,
      testsAdvised: rxTests.trim() ? [rxTests.trim()] : [],
      dietAdvice: [rxAdvice.trim(), rxFollowUp ? `Follow up: ${rxFollowUp}` : ''].filter(Boolean).join('. '),
      signatureSvg: doctor?.name || 'Dr. Verified'
    };

    try {
      await updateAppointment(showRxModal.id, { status: 'Completed', prescription: newRx });
      
      // Auto-create health record in Firestore for the patient
      try {
        const recordId = `HR-${Date.now().toString().slice(-6)}`;
        await setDoc(doc(db, 'healthRecords', recordId), sanitizeFirestoreDoc({
          id: recordId,
          patientId: showRxModal.patientId,
          title: `Prescription: ${newRx.diagnosis}`,
          type: 'Prescription',
          date: newRx.date,
          doctorOrLab: doctor.name || 'Dr. Consultant',
          url: '#',
          createdAt: new Date().toISOString()
        }));
      } catch (recErr) {
        console.warn('Health record auto-save note:', recErr);
      }

      // Automatically notify patient about prescription readiness
      try {
        await sendAppNotification({
          userId: showRxModal.patientId,
          title: 'Prescription Ready',
          body: `Dr. ${doctor?.name || 'Doctor'} has issued your digital prescription for ${newRx.diagnosis}.`,
          type: 'prescription'
        });
      } catch (notifErr) {
        console.warn('Notification send note:', notifErr);
      }

      showToast('Digital Prescription generated and saved to patient record!');
      setShowRxModal(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save digital prescription.', true);
    } finally {
      setIsSubmittingRx(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF3FA] dark:bg-slate-950 p-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 ${toastMessage.isError ? 'bg-red-600' : 'bg-[#0FB5A0]'} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border`}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Doctor Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0A1A45] dark:text-white">Dr. {doctor.name}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{doctor.specialty} • Reg: {doctor.councilRegistrationNumber || 'NMC Verified'}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Hindi / English Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          <button
            onClick={() => setShowScheduleManager(!showScheduleManager)}
            className="px-4 py-2 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <CalendarDays className="w-4 h-4" />
            {showScheduleManager ? t('close') : t('tabSchedule')}
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${isAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold">{isAvailable ? 'Available' : 'Offline'}</span>
            <button onClick={() => setIsAvailable(!isAvailable)} className="ml-1 underline text-[10px]">Toggle</button>
          </div>

          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500" title={t('logout')}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Consultation Banner */}
      {activeCallAppointment && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-3xl shadow-xl mb-8 border border-blue-700 space-y-3 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-lg text-blue-200">
                {activeCallAppointment.patientName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                    ● Active Consultation
                  </span>
                  <h4 className="font-extrabold text-base">{activeCallAppointment.patientName}</h4>
                </div>
                <p className="text-xs text-blue-200">
                  {activeCallAppointment.patientAge || 'Adult'} yrs • {activeCallAppointment.patientGender || 'Patient'} • Mode: {activeCallAppointment.mode} • Time: {activeCallAppointment.dateTime}
                </p>
                {(activeCallAppointment.mode === 'Audio' || activeCallAppointment.mode === 'Chat') && (
                  <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                    ℹ {t('turnOffCameraTip')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const room = activeCallAppointment.roomName || generateRoomName(activeCallAppointment.id);
                  window.open(getJitsiUrl(room), '_blank', 'noopener,noreferrer');
                }}
                className="px-4 py-2.5 bg-white text-blue-900 rounded-xl text-xs font-extrabold hover:bg-blue-50 transition-all flex items-center gap-1.5 shadow-md"
              >
                <Video className="w-4 h-4" /> {t('joinCall')}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenRxModal(activeCallAppointment);
                  setActiveCallAppointment(null);
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md"
              >
                <FileText className="w-4 h-4" /> {t('endConsultation')}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-blue-200">
            <Shield className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <span>{t('privacyNoteCall')}</span>
          </div>
        </div>
      )}

      {/* Doctor Schedule Manager Card */}
      {showScheduleManager && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-300 dark:border-slate-800 mb-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-[#0A1A45] dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" /> My Consultation Schedule & Slot Duration
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Set weekly working hours, slot intervals, and mark unavailable leave dates.</p>
            </div>
            <button
              disabled={isSavingSchedule}
              onClick={handleSaveSchedule}
              className="px-5 py-2 bg-[#1769E0] text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSavingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Schedule
            </button>
          </div>

          {/* Weekly Schedule Settings */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Weekly Slot Configuration</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {weeklySchedule.map((ws, idx) => (
                <div key={ws.day} className={`p-3 rounded-2xl border text-xs space-y-2 ${ws.enabled ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <strong className="font-extrabold text-slate-900 dark:text-white">{ws.day}</strong>
                    <input
                      type="checkbox"
                      checked={ws.enabled}
                      onChange={e => {
                        const copy = [...weeklySchedule];
                        copy[idx].enabled = e.target.checked;
                        setWeeklySchedule(copy);
                      }}
                      className="rounded accent-blue-600 cursor-pointer"
                    />
                  </div>
                  {ws.enabled && (
                    <div className="space-y-1.5 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-400 block">Start</label>
                        <input
                          type="time"
                          value={ws.startTime}
                          onChange={e => {
                            const copy = [...weeklySchedule];
                            copy[idx].startTime = e.target.value;
                            setWeeklySchedule(copy);
                          }}
                          className="w-full p-1 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">End</label>
                        <input
                          type="time"
                          value={ws.endTime}
                          onChange={e => {
                            const copy = [...weeklySchedule];
                            copy[idx].endTime = e.target.value;
                            setWeeklySchedule(copy);
                          }}
                          className="w-full p-1 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Slot Length</label>
                        <select
                          value={ws.slotDurationMinutes}
                          onChange={e => {
                            const copy = [...weeklySchedule];
                            copy[idx].slotDurationMinutes = parseInt(e.target.value, 10);
                            setWeeklySchedule(copy);
                          }}
                          className="w-full p-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                        >
                          <option value={10}>10 min</option>
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={30}>30 min</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Unavailable Specific Dates */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Mark Specific Unavailable Dates</span>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={newUnavailableDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewUnavailableDate(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                onClick={handleAddUnavailableDate}
                className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-900"
              >
                + Mark Unavailable
              </button>
            </div>

            {unavailableDates.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {unavailableDates.map(dateStr => (
                  <span key={dateStr} className="px-3 py-1 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl flex items-center gap-2">
                    {dateStr}
                    <button onClick={() => handleRemoveUnavailableDate(dateStr)} className="hover:text-red-800">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-md border border-slate-300 dark:border-slate-800">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Today's Patients</p>
          <p className="text-3xl font-extrabold text-[#1769E0] mt-1">{appointments.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-md border border-slate-300 dark:border-slate-800">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Pending Prescriptions</p>
          <p className="text-3xl font-extrabold text-teal-600 mt-1">{appointments.filter(a => a.status !== 'Completed').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-md border border-slate-300 dark:border-slate-800">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Average Rating</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-1">{doctor.rating || 5.0}</p>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-300 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0A1A45] dark:text-white">Consultations Queue</h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">{appointments.length} Consultations</span>
        </div>
        {dataLoading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400 font-medium">Loading your schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400 font-medium">No appointments scheduled for today.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {appointments.map(apt => (
              <div key={apt.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1769E0] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-lg shrink-0">
                    {apt.patientName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-sm text-[#0A1A45] dark:text-white">{apt.patientName}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        apt.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      }`}>
                        {apt.paymentStatus === 'Paid' ? `✓ Paid (${apt.paymentMethod || 'Clinic'})` : `Pending (${apt.paymentMethod || 'Pay at Clinic'})`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{apt.dateTime} • {apt.mode} • Fee: ₹{apt.fee}</p>
                    {apt.prescription && (
                      <span className="inline-block mt-1 text-[11px] text-teal-600 font-semibold">
                        ✓ Prescription Issued ({apt.prescription.id})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {apt.paymentStatus !== 'Paid' && (
                    <button
                      onClick={() => handleMarkPaymentReceived(apt.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Mark Payment Received
                    </button>
                  )}
                  {apt.mode === 'Clinic visit' ? (
                    <a
                      href={getDirectionsUrl(doctor.clinicAddress || doctor.hospitalOrClinic || 'HealthPilot Clinic')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" /> {t('clinicDirections')}
                    </a>
                  ) : (
                    <button 
                      onClick={() => handleStartConsultation(apt)} 
                      className="px-4 py-2 bg-[#1769E0] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      {apt.status === 'In Progress' ? t('joinCall') : t('startConsultation')}
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenRxModal(apt)} 
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" /> {t('writePrescription')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Creation Modal */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative space-y-4 my-8">
            <button 
              onClick={() => setShowRxModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b pb-3 border-slate-200 dark:border-slate-800">
              <HealthPilotLogo size="sm" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Create Digital Prescription</h3>
                <p className="text-xs text-slate-500">Patient: <strong>{showRxModal.patientName}</strong> ({showRxModal.patientAge || 'Adult'} yrs)</p>
              </div>
            </div>

            {!showPrintPreview ? (
              /* Prescription Form View */
              <div className="space-y-4 text-xs">
                {/* Vitals Section */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 block">Patient Vitals (Optional)</span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">BP (mmHg)</label>
                      <input 
                        type="text" 
                        placeholder="120/80" 
                        value={rxVitals.bp} 
                        onChange={e => setRxVitals({ ...rxVitals, bp: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Pulse (bpm)</label>
                      <input 
                        type="text" 
                        placeholder="72" 
                        value={rxVitals.pulse} 
                        onChange={e => setRxVitals({ ...rxVitals, pulse: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Temp (°F)</label>
                      <input 
                        type="text" 
                        placeholder="98.6" 
                        value={rxVitals.temp} 
                        onChange={e => setRxVitals({ ...rxVitals, temp: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Weight (kg)</label>
                      <input 
                        type="text" 
                        placeholder="65" 
                        value={rxVitals.weight} 
                        onChange={e => setRxVitals({ ...rxVitals, weight: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Diagnosis / Chief Complaint <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Viral Bronchitis, Fever"
                    value={rxDiagnosis}
                    onChange={e => setRxDiagnosis(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Medicines List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">
                      Prescribed Medicines <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddMedicineRow()}
                      className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-teal-700"
                    >
                      <Plus className="w-3 h-3" /> Add Medicine
                    </button>
                  </div>

                  {/* Common Indian Suggestions Quick Chips */}
                  <div className="flex flex-wrap gap-1.5 py-1">
                    <span className="text-[10px] text-slate-400 font-bold self-center">Quick Add:</span>
                    {COMMON_MEDICINE_SUGGESTIONS.map(sugg => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => handleAddMedicineRow(sugg)}
                        className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-lg text-[10px] font-semibold hover:bg-teal-100"
                      >
                        + {sugg}
                      </button>
                    ))}
                  </div>

                  {/* Medicine Rows Table */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {rxMedicines.map((med, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Medicine Name"
                            value={med.name}
                            onChange={e => handleMedicineChange(idx, 'name', e.target.value)}
                            className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Dosage (e.g. 1 Tab BD)"
                            value={med.dosage}
                            onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)}
                            className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px]"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Duration"
                            value={med.duration}
                            onChange={e => handleMedicineChange(idx, 'duration', e.target.value)}
                            className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px]"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Advice"
                            value={med.instructions}
                            onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)}
                            className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px]"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tests & Advice */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Diagnostic Tests Advised</label>
                    <input
                      type="text"
                      placeholder="e.g. CBC, Lipid Profile"
                      value={rxTests}
                      onChange={e => setRxTests(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Follow-Up Date / Advice</label>
                    <input
                      type="text"
                      placeholder="e.g. Follow up in 5 days"
                      value={rxFollowUp}
                      onChange={e => setRxFollowUp(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">General Advice & Dietary Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Drink warm water, complete bed rest for 3 days."
                    value={rxAdvice}
                    onChange={e => setRxAdvice(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPrintPreview(true)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Print Preview
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingRx}
                    onClick={handleSavePrescription}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isSubmittingRx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save & Issue Prescription</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Printable Prescription View */
              <div className="space-y-4">
                <div id="printable-rx" className="p-6 bg-white text-slate-900 rounded-2xl border border-slate-300 space-y-4 font-serif">
                  {/* Doctor Rx Pad Header */}
                  <div className="border-b-2 border-teal-700 pb-3 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-teal-800">Dr. {doctor.name}</h2>
                      <p className="text-xs font-sans text-slate-600">{doctor.qualification || 'MBBS, MD'} • {doctor.specialty}</p>
                      <p className="text-[11px] font-sans text-slate-500">Reg No: {doctor.councilRegistrationNumber || 'NMC Verified'}</p>
                      <p className="text-[11px] font-sans text-slate-500">{doctor.clinicAddress || 'HealthPilot Care Centre'}</p>
                    </div>
                    <div className="text-right font-sans">
                      <p className="text-sm font-bold text-teal-700">HealthPilot Digital Rx</p>
                      <p className="text-[11px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Patient Line */}
                  <div className="grid grid-cols-3 text-xs font-sans p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <p><strong>Patient:</strong> {showRxModal.patientName}</p>
                    <p><strong>Age/Gender:</strong> {showRxModal.patientAge || 'Adult'} / {showRxModal.patientGender || 'Other'}</p>
                    <p><strong>Dx:</strong> {rxDiagnosis || 'Consultation'}</p>
                  </div>

                  {/* Rx Symbol */}
                  <div className="text-2xl font-bold text-teal-800">℞</div>

                  {/* Medicines Table */}
                  <table className="w-full text-xs font-sans border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border p-2 text-left">#</th>
                        <th className="border p-2 text-left">Medicine Name</th>
                        <th className="border p-2 text-left">Dosage</th>
                        <th className="border p-2 text-left">Duration</th>
                        <th className="border p-2 text-left">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rxMedicines.filter(m => m.name.trim()).map((m, i) => (
                        <tr key={i} className="border-b">
                          <td className="border p-2 font-bold">{i + 1}</td>
                          <td className="border p-2 font-bold text-teal-900">{m.name}</td>
                          <td className="border p-2">{m.dosage}</td>
                          <td className="border p-2">{m.duration}</td>
                          <td className="border p-2">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Advice & Signature */}
                  {rxAdvice && <p className="text-xs font-sans"><strong>Advice:</strong> {rxAdvice}</p>}
                  {rxTests && <p className="text-xs font-sans"><strong>Tests Advised:</strong> {rxTests}</p>}

                  <div className="pt-6 flex justify-between items-end border-t border-slate-200 font-sans">
                    <p className="text-[10px] text-slate-400">Digitally Verified via HealthPilot Platform</p>
                    <div className="text-center">
                      <p className="text-xs font-bold text-teal-800">Dr. {doctor.name}</p>
                      <p className="text-[10px] text-slate-500">Digital Signature Stamp</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-[#1769E0] text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Printer className="w-4 h-4" /> Print Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintPreview(false)}
                    className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs"
                  >
                    Back to Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

