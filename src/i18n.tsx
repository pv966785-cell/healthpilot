import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Language = 'en' | 'hi';

const STORAGE_KEY = 'healthpilot_language';

export function getStoredLanguage(): Language {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'en' || val === 'hi') return val;
  } catch (e) {
    // ignore localStorage errors in sandboxed iframes
  }
  return 'en';
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    // ignore
  }
}

export const translations = {
  en: {
    // Common / Global
    appName: 'HealthPilot',
    tagline: 'Healthcare, Simplified & Trusted',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    close: 'Close',
    remove: 'Remove',
    search: 'Search',
    viewAll: 'View All',
    logout: 'Logout',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications yet',
    enableAlerts: 'Enable alerts',
    offlineNotice: 'You are offline. Some features may not work.',
    somethingWentWrong: 'Something went wrong',
    reload: 'Reload',
    goToHome: 'Go to Home',
    privacyNoteCall: 'Calls use a free public video service. Do not share the link.',
    callWindowNotice: 'Call opens 10 minutes before your appointment time.',

    // Navigation / Tabs
    tabConsult: 'Consultation',
    tabLabs: 'Lab Tests',
    tabMedicines: 'Medicines',
    tabAppointments: 'Appointments',
    tabRecords: 'Health Records',
    tabProfile: 'Profile',
    tabSchedule: 'My Schedule',
    tabInventory: 'Inventory',
    tabQueue: 'Patient Queue',
    tabOrders: 'Orders',
    tabDashboard: 'Dashboard',

    // Doctor Dashboard
    doctorDashboardTitle: 'Doctor Teleconsultation Portal',
    doctorScheduleTitle: 'My Consultation Schedule',
    setWeeklyHours: 'Set weekly consultation hours and unavailable dates',
    saveSchedule: 'Save Schedule',
    saving: 'Saving...',
    scheduleSaved: 'Schedule updated successfully!',
    markUnavailable: 'Mark date unavailable',
    dayOff: 'Day Off',
    slotDuration: 'Slot Duration',
    startConsultation: 'Start consultation',
    joinCall: 'Join Call',
    endConsultation: 'End consultation & write prescription',
    writePrescription: 'Write Prescription',
    printPrescription: 'Print Prescription',
    downloadPdf: 'Download PDF',
    turnOffCameraTip: 'Turn off your camera if you want audio-only',
    clinicDirections: 'Get directions',
    markPaymentReceived: 'Mark Payment Received',
    paymentStatus: 'Payment Status',
    paid: 'Paid',
    pending: 'Pending',
    scheduled: 'Scheduled',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',

    // Patient App
    findDoctors: 'Find Doctors & Specialists',
    bookConsultation: 'Book Slot',
    bookLabTest: 'Book Lab Test',
    orderMedicines: 'Order Medicines',
    availableSlots: 'Available Doctor Slots',
    noSlotsAvailable: 'No slots available on this date. Please select another date.',
    selectDate: 'Select Date (Next 7 Days)',
    consultationMode: 'Consultation Mode',
    videoConsultation: 'Video Consultation',
    clinicVisit: 'Clinic Visit',
    fee: 'Fee',
    paymentMethod: 'Payment Method',
    payAtClinic: 'Pay at Clinic / Post Consultation',
    payAtLab: 'Pay at Lab / Collection',
    cod: 'Cash on Delivery',
    payOnlineComingSoon: 'Pay online (UPI / Card) - Coming soon',
    appointmentConfirmed: 'Appointment and slot confirmed!',
    downloadMyData: 'Download My Data (DPDP)',
    deleteMyAccount: 'Delete My Account',
    deleteAccountConfirmPrompt: 'Type DELETE to permanently request account deletion:',
    deleteRequestSubmitted: 'Your deletion request was received. It will be processed within 30 days.',

    // Pharmacist Dashboard
    pharmaDashboardTitle: 'Pharmacy Orders & Real Inventory',
    manageInventory: 'Manage Inventory',
    addMedicine: 'Add Medicine',
    medicineCatalog: 'Medicine Catalog',
    stock: 'Stock',
    mrp: 'MRP',
    sellingPrice: 'Selling Price',
    requiresRx: 'Requires Prescription',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    verifyRx: 'Verify Prescription',
    acceptOrder: 'Accept & Dispatch',
    rejectOrder: 'Reject Order',
    insufficientStock: 'Insufficient inventory stock to accept order.',
    noMedicinesOnboarding: 'No medicines available yet. Pharmacies are being onboarded.',

    // Lab Dashboard
    labDashboardTitle: 'Diagnostic Lab Bookings & Reports',
    pendingBookings: 'Pending Bookings',
    sampleCollected: 'Sample Collected',
    processing: 'Processing',
    uploadReport: 'Upload Report',
    reportReady: 'Report Ready',
    reportUploadSuccess: 'Lab report uploaded and shared with patient!',

    // Waiting Approval Screen
    verificationRequired: 'Email Verification Required',
    pleaseVerifyEmail: 'Please verify your email address to complete registration.',
    resendEmail: 'Resend Verification Email',
    iHaveVerified: 'I Have Verified My Email',
    emailVerifiedSuccess: 'Email verified successfully!',
    approvalPending: 'Profile Under Verification',
    approvalPendingNote: 'Your healthcare credentials are being audited by our verification team.'
  },
  hi: {
    // Common / Global
    appName: 'हेल्थपायलट',
    tagline: 'विश्वसनीय और सरल स्वास्थ्य सेवा',
    loading: 'लोड हो रहा है...',
    save: 'सुरक्षित करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'वापस',
    close: 'बंद करें',
    remove: 'हटाएं',
    search: 'खोजें',
    viewAll: 'सभी देखें',
    logout: 'लॉगआउट',
    notifications: 'सूचनाएं',
    markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    noNotifications: 'अभी कोई सूचना नहीं है',
    enableAlerts: 'अलर्ट सक्षम करें',
    offlineNotice: 'आप ऑफ़लाइन हैं। कुछ सुविधाएं काम नहीं कर सकती हैं।',
    somethingWentWrong: 'कुछ गलत हो गया',
    reload: 'पुनः लोड करें',
    goToHome: 'होम पर जाएं',
    privacyNoteCall: 'कॉल एक निःशुल्क सार्वजनिक वीडियो सेवा का उपयोग करते हैं। लिंक साझा न करें।',
    callWindowNotice: 'कॉल आपके अपॉइंटमेंट समय से 10 मिनट पहले खुलता है।',

    // Navigation / Tabs
    tabConsult: 'डॉक्टर परामर्श',
    tabLabs: 'लैब टेस्ट',
    tabMedicines: 'दवाइयां',
    tabAppointments: 'अपॉइंटमेंट्स',
    tabRecords: 'स्वास्थ्य रिकॉर्ड्स',
    tabProfile: 'प्रोफाइल',
    tabSchedule: 'मेरा शेड्यूल',
    tabInventory: 'इन्वेंटरी',
    tabQueue: 'मरीज सूची',
    tabOrders: 'ऑर्डर्स',
    tabDashboard: 'डैशबोर्ड',

    // Doctor Dashboard
    doctorDashboardTitle: 'डॉक्टर टेलीकंसल्टेशन पोर्टल',
    doctorScheduleTitle: 'मेरा परामर्श शेड्यूल',
    setWeeklyHours: 'साप्ताहिक परामर्श समय और अनुपलब्ध तिथियां निर्धारित करें',
    saveSchedule: 'शेड्यूल सहेजें',
    saving: 'सहेज रहा है...',
    scheduleSaved: 'शेड्यूल सफलतापूर्वक अपडेट किया गया!',
    markUnavailable: 'तिथि को अनुपलब्ध चिह्नित करें',
    dayOff: 'अवकाश',
    slotDuration: 'स्लॉट अवधि',
    startConsultation: 'परामर्श शुरू करें',
    joinCall: 'कॉल से जुड़ें',
    endConsultation: 'परामर्श समाप्त करें व पर्चा लिखें',
    writePrescription: 'पर्चा लिखें',
    printPrescription: 'पर्चा प्रिंट करें',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
    turnOffCameraTip: 'यदि आप केवल ऑडियो चाहते हैं तो कैमरा बंद करें',
    clinicDirections: 'दिशा-निर्देश प्राप्त करें',
    markPaymentReceived: 'भुगतान प्राप्त चिह्नित करें',
    paymentStatus: 'भुगतान स्थिति',
    paid: 'भुगतान प्राप्त',
    pending: 'लंबित',
    scheduled: 'शेड्यूल किया गया',
    inProgress: 'प्रगति पर है',
    completed: 'पूर्ण',
    cancelled: 'रद्द',

    // Patient App
    findDoctors: 'डॉक्टर और विशेषज्ञ खोजें',
    bookConsultation: 'स्लॉट बुक करें',
    bookLabTest: 'लैब टेस्ट बुक करें',
    orderMedicines: 'दवाइयां ऑर्डर करें',
    availableSlots: 'उपलब्ध डॉक्टर स्लॉट',
    noSlotsAvailable: 'इस तिथि पर कोई स्लॉट उपलब्ध नहीं है। कृपया दूसरी तिथि चुनें।',
    selectDate: 'तारीख चुनें (अगले 7 दिन)',
    consultationMode: 'परामर्श का प्रकार',
    videoConsultation: 'वीडियो परामर्श',
    clinicVisit: 'क्लिनिक विजिट',
    fee: 'शुल्क',
    paymentMethod: 'भुगतान विधि',
    payAtClinic: 'क्लिनिक पर भुगतान करें / परामर्श उपरांत',
    payAtLab: 'लैब / सैंपल कलेक्शन पर भुगतान करें',
    cod: 'कैश ऑन डिलीवरी',
    payOnlineComingSoon: 'ऑनलाइन भुगतान (यूपीआई / कार्ड) - जल्द आ रहा है',
    appointmentConfirmed: 'अपॉइंटमेंट और स्लॉट की पुष्टि हो गई!',
    downloadMyData: 'मेरा डेटा डाउनलोड करें (DPDP)',
    deleteMyAccount: 'मेरा खाता हटाएं',
    deleteAccountConfirmPrompt: 'खाता हटाने का अनुरोध करने के लिए DELETE टाइप करें:',
    deleteRequestSubmitted: 'आपका खाता हटाने का अनुरोध प्राप्त हुआ। इसे 30 दिनों में संसाधित किया जाएगा।',

    // Pharmacist Dashboard
    pharmaDashboardTitle: 'फार्मेसी ऑर्डर्स और रियल इन्वेंटरी',
    manageInventory: 'इन्वेंटरी प्रबंधित करें',
    addMedicine: 'दवा जोड़ें',
    medicineCatalog: 'दवा सूची',
    stock: 'स्टॉक',
    mrp: 'एमआरपी',
    sellingPrice: 'बिक्री मूल्य',
    requiresRx: 'पर्चे की आवश्यकता है',
    lowStock: 'कम स्टॉक',
    outOfStock: 'स्टॉक समाप्त',
    verifyRx: 'पर्चे का सत्यापन करें',
    acceptOrder: 'स्वीकार व डिस्पैच करें',
    rejectOrder: 'ऑर्डर अस्वीकार करें',
    insufficientStock: 'ऑर्डर स्वीकार करने के लिए इन्वेंटरी स्टॉक अपर्याप्त है।',
    noMedicinesOnboarding: 'अभी कोई दवा उपलब्ध नहीं है। फार्मेसियों को जोड़ा जा रहा है।',

    // Lab Dashboard
    labDashboardTitle: 'डायग्नोस्टिक लैब बुकिंग व रिपोर्ट्स',
    pendingBookings: 'लंबित बुकिंग्स',
    sampleCollected: 'सैंपल एकत्रित',
    processing: 'प्रसंस्करण',
    uploadReport: 'रिपोर्ट अपलोड करें',
    reportReady: 'रिपोर्ट तैयार है',
    reportUploadSuccess: 'लैब रिपोर्ट अपलोड कर मरीज के साथ साझा कर दी गई!',

    // Waiting Approval Screen
    verificationRequired: 'ईमेल सत्यापन आवश्यक है',
    pleaseVerifyEmail: 'पंजीकरण पूरा करने के लिए कृपया अपना ईमेल पता सत्यापित करें।',
    resendEmail: 'सत्यापन ईमेल पुनः भेजें',
    iHaveVerified: 'मैंने अपना ईमेल सत्यापित कर लिया है',
    emailVerifiedSuccess: 'ईमेल सफलतापूर्वक सत्यापित हुआ!',
    approvalPending: 'प्रोफाइल सत्यापन प्रक्रिया में है',
    approvalPendingNote: 'हमारी सत्यापन टीम द्वारा आपकी स्वास्थ्य सेवा साख का ऑडिट किया जा रहा है।'
  }
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => {
      const next = prev === 'en' ? 'hi' : 'en';
      setStoredLanguage(next);
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    const val = dict[key];
    if (val) return val;
    return translations.en[key] || fallback || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useT() {
  return useContext(LanguageContext);
}

export const useTranslation = useT;
export { LanguageContext };
export default useT;

