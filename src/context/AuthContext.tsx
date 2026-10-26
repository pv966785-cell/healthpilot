import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  AppUser, UserRole, UserStatus, PatientProfile, DoctorProfile, 
  PharmacistProfile, LabProfile, AdminProfile, DoctorAppointment, 
  LabBooking, PharmacyOrder, AuditLog, FamilyMember, SupportTicket,
  LabTest, HealthRecord, PharmacyInventoryItem
} from '../types';
import { SAMPLE_LAB_TESTS, PRICE_MARKUP_PERCENT } from '../content';
import { auth, db, googleProvider, handleFirestoreError, OperationType, logFirestoreError } from '../firebase';
import { uploadFile } from '@/src/utils/upload';
import { 
  onAuthStateChanged, signInWithPopup, signInWithRedirect, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, sendPasswordResetEmail, sendEmailVerification, User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc, collection, 
  query, where, onSnapshot, getDocs, runTransaction, limit
} from 'firebase/firestore';

export const ADMIN_EMAIL = 'pv966785@gmail.com';

/**
 * Removes undefined fields from objects before saving to Firestore,
 * preventing 'Function setDoc() called with invalid data. Unsupported field value: undefined' errors.
 */
export function sanitizeFirestoreDoc<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const clean: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeFirestoreDoc(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  isAdminLocked: boolean;
  adminFailedAttempts: number;
  inactivityRemainingSeconds: number;
  // Refresh user profile directly from Firestore server
  refreshUserProfile: () => Promise<{ success: boolean; status?: UserStatus; error?: string }>;
  // Google sign in pending first profile
  isNewGoogleUser: boolean;
  googlePendingUser: { uid: string; email: string; displayName: string; photoURL?: string } | null;
  cancelGoogleSetup: () => void;
  completeGoogleProfile: (role: UserRole, data: any) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  // Data stores accessible to components
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  pharmacists: PharmacistProfile[];
  labs: LabProfile[];
  admin: AdminProfile;
  appointments: DoctorAppointment[];
  labBookings: LabBooking[];
  pharmacyOrders: PharmacyOrder[];
  healthRecords: HealthRecord[];
  pharmacyInventory: PharmacyInventoryItem[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  dataError: string | null;

  logAudit: (action: string, targetId: string, details?: string) => Promise<void>;
  updateFamilyMembers: (members: FamilyMember[]) => Promise<void>;
  updatePatientProfile: (updates: Partial<PatientProfile>) => Promise<void>;
  loginWithGoogle: (preferredRole?: UserRole) => Promise<{ success: boolean; error?: string; isNewUser?: boolean; cancelled?: boolean }>;
  loginWithEmail: (role: UserRole, email: string, pass: string) => Promise<{ success: boolean; error?: string; status?: UserStatus }>;
  signupWithEmail: (role: UserRole, data: any) => Promise<{ success: boolean; error?: string; user?: AppUser; message?: string }>;
  resetUserPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
  // Admin controls over roles & data
  approveUser: (role: 'doctor' | 'pharmacist' | 'lab', userId: string) => Promise<void>;
  rejectUser: (role: 'doctor' | 'pharmacist' | 'lab', userId: string, reason: string) => Promise<void>;
  requestMoreDocs: (role: 'doctor' | 'pharmacist' | 'lab', userId: string, notes: string) => Promise<void>;
  updateUserStatus: (role: UserRole, userId: string, status: UserStatus) => Promise<void>;
  deleteUser: (role: UserRole, userId: string) => Promise<void>;
  forceLogoutUser: (userId: string) => void;
  // Booking & order mutations
  createAppointment: (appointment: Omit<DoctorAppointment, 'id'>) => Promise<DoctorAppointment>;
  updateAppointment: (appointmentId: string, updates: Partial<DoctorAppointment>) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  createLabBooking: (booking: Omit<LabBooking, 'id'>) => Promise<LabBooking>;
  updateLabBooking: (bookingId: string, updates: Partial<LabBooking>) => Promise<void>;
  deleteLabBooking: (bookingId: string) => Promise<void>;
  createPharmacyOrder: (order: Omit<PharmacyOrder, 'id'>) => Promise<PharmacyOrder>;
  updatePharmacyOrder: (orderId: string, updates: Partial<PharmacyOrder>) => Promise<void>;
  deletePharmacyOrder: (orderId: string) => Promise<void>;
  // Master Lab Test Catalogue & Markup controls
  labTests: LabTest[];
  priceMarkupPercent: number;
  updatePriceMarkup: (percent: number) => void;
  updateLabTest: (testId: string, updates: Partial<LabTest>) => void;
  addLabTest: (test: Omit<LabTest, 'id'>) => void;
  deleteLabTest: (testId: string) => void;
  getPatientPrice: (labRate: number) => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const signupInProgress = React.useRef(false);

  // New Google User Setup State
  const [isNewGoogleUser, setIsNewGoogleUser] = useState<boolean>(false);
  const [googlePendingUser, setGooglePendingUser] = useState<{ uid: string; email: string; displayName: string; photoURL?: string } | null>(null);

  // Data Stores - Initialize with empty arrays (NO mock data fallbacks)
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [pharmacists, setPharmacists] = useState<PharmacistProfile[]>([]);
  const [labs, setLabs] = useState<LabProfile[]>([]);
  const [admin, setAdmin] = useState<AdminProfile>({
    id: 'admin',
    name: 'Praveen Verma (Director)',
    email: ADMIN_EMAIL,
    phone: '+91 9311601420',
    role: 'super_admin',
    status: 'Active',
    twoFactorEnabled: false,
    failedAttempts: 0,
    createdAt: '2026-01-01',
    assignedRoleName: 'Super Administrator'
  });

  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [pharmacyInventory, setPharmacyInventory] = useState<PharmacyInventoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Lab Test Catalogue & Markup Store (synced with localStorage)
  const [priceMarkupPercent, setPriceMarkupPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('healthpilot_lab_markup');
      return saved !== null ? Number(saved) : PRICE_MARKUP_PERCENT;
    } catch {
      return PRICE_MARKUP_PERCENT;
    }
  });

  const [labTests, setLabTests] = useState<LabTest[]>(() => {
    try {
      const saved = localStorage.getItem('healthpilot_lab_tests_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_LAB_TESTS;
  });

  // Admin lock tracking with localStorage persistence ('hp_admin_lock')
  const getInitialAdminLock = (): { attempts: number; isLocked: boolean } => {
    try {
      const saved = localStorage.getItem('hp_admin_lock');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const attempts = Number(parsed.attempts) || 0;
          const lockUntil = Number(parsed.lockUntil) || 0;
          if (lockUntil > Date.now()) {
            return { attempts: Math.max(attempts, 5), isLocked: true };
          } else {
            localStorage.removeItem('hp_admin_lock');
          }
        }
      }
    } catch {}
    return { attempts: 0, isLocked: false };
  };

  const initialAdminLock = getInitialAdminLock();
  const [adminFailedAttempts, setAdminFailedAttempts] = useState<number>(initialAdminLock.attempts);
  const [isAdminLocked, setIsAdminLocked] = useState<boolean>(initialAdminLock.isLocked);

  const saveAdminLockState = (attempts: number, lockUntil: number) => {
    try {
      localStorage.setItem('hp_admin_lock', JSON.stringify({ attempts, lockUntil }));
    } catch {}
  };

  const clearAdminLockState = () => {
    try {
      localStorage.removeItem('hp_admin_lock');
    } catch {}
  };

  // Inactivity tracking (15 minutes = 900 seconds)
  const [inactivityRemainingSeconds, setInactivityRemainingSeconds] = useState<number>(900);

  const resetInactivityTimer = () => {
    setInactivityRemainingSeconds(900);
  };


  const refreshUserProfile = async (): Promise<{ success: boolean; status?: UserStatus; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'Please login again.' };
    }
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      let userSnap;
      try {
        userSnap = await getDocFromServer(userDocRef);
      } catch {
        // Fall back to cache / default fetch if server fetch is unavailable
        userSnap = await getDoc(userDocRef);
      }
      if (userSnap && userSnap.exists()) {
        const data = userSnap.data() as AppUser;
        setCurrentUser(data);
        setCurrentRole(data.role);
        return { success: true, status: data.status };
      } else {
        return { success: false, error: 'Could not check status. Check your internet connection and try again.' };
      }
    } catch (err) {
      console.warn('Note refreshing user profile:', err);
      return { success: false, error: 'Could not check status. Check your internet connection and try again.' };
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setInactivityRemainingSeconds(prev => {
        if (prev <= 1) {
          logout();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Firebase Auth State Observer
  useEffect(() => {
    // Safety fallback: if Firebase Auth takes more than 2.5s, resolve loading to allow guest/login view
    const fallbackTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      clearTimeout(fallbackTimer);
      if (!fbUser) {
        if (signupInProgress.current) return;
        setCurrentUser(null);
        setCurrentRole(null);
        setIsAuthenticated(false);
        setIsNewGoogleUser(false);
        setGooglePendingUser(null);
        setAuthLoading(false);
        return;
      }

      const email = (fbUser.email || '').toLowerCase().trim();
      const isAdminEmail = email === ADMIN_EMAIL.toLowerCase();

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userDocRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
        }

        if (isAdminEmail) {
          // Designated Super Admin Account
          const adminProfile: AdminProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Praveen Verma (Director)',
            email: ADMIN_EMAIL,
            phone: '+91 9311601420',
            role: 'super_admin',
            status: 'Active',
            twoFactorEnabled: false,
            failedAttempts: 0,
            createdAt: '2026-01-01',
            assignedRoleName: 'Super Administrator',
            ...(fbUser.photoURL ? { avatarUrl: fbUser.photoURL } : {})
          };

          // Save/Sync Admin Doc in Firestore
          try {
            await setDoc(userDocRef, sanitizeFirestoreDoc(adminProfile), { merge: true });
            await setDoc(doc(db, 'admins', fbUser.uid), {
              id: fbUser.uid,
              email: ADMIN_EMAIL,
              role: 'super_admin',
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
          }

          setCurrentUser(adminProfile);
          setCurrentRole('super_admin');
          setIsAuthenticated(true);
          setIsNewGoogleUser(false);
          setGooglePendingUser(null);
          setAdmin(adminProfile);
          setAuthLoading(false);
          resetInactivityTimer();
          return;
        }

        if (userSnap && userSnap.exists()) {
          const userData = userSnap.data() as AppUser;
          setCurrentUser(userData);
          setCurrentRole(userData.role);
          setIsAuthenticated(true);
          setIsNewGoogleUser(false);
          setGooglePendingUser(null);
          resetInactivityTimer();
        } else {
          // First time sign-in via Google (no profile yet in Firestore)
          if (fbUser.providerData.some(p => p.providerId === 'google.com')) {
            setGooglePendingUser({
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || '',
              photoURL: fbUser.photoURL || undefined
            });
            setIsNewGoogleUser(true);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.warn('Error fetching user profile from Firestore:', err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Listeners based on Authenticated Role
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const unsubs: (() => void)[] = [];

    // 1. Admin gets real-time view of ALL users, appointments, labBookings, pharmacyOrders, auditLogs, supportTickets
    if (currentUser.role === 'super_admin' || currentUser.role === 'sub_admin') {
      setDataError(null);
      try {
        const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
          const pts: PatientProfile[] = [];
          const dcts: DoctorProfile[] = [];
          const phs: PharmacistProfile[] = [];
          const lbs: LabProfile[] = [];

          snapshot.forEach(docSnap => {
            const data = docSnap.data() as AppUser;
            if (data.role === 'patient') pts.push(data as PatientProfile);
            else if (data.role === 'doctor') dcts.push(data as DoctorProfile);
            else if (data.role === 'pharmacist') phs.push(data as PharmacistProfile);
            else if (data.role === 'lab') lbs.push(data as LabProfile);
          });

          setPatients(pts);
          setDoctors(dcts);
          setPharmacists(phs);
          setLabs(lbs);
          setDataLoading(false);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'users');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(usersUnsub);
      } catch (err) {
        console.warn('Admin users snapshot error:', err);
      }

      try {
        const apptsUnsub = onSnapshot(collection(db, 'appointments'), (snapshot) => {
          const list: DoctorAppointment[] = [];
          snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as DoctorAppointment));
          setAppointments(list);
          setDataLoading(false);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'appointments');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(apptsUnsub);
      } catch (err) {
        console.warn('Admin appointments snapshot error:', err);
      }

      try {
        const labUnsub = onSnapshot(collection(db, 'labBookings'), (snapshot) => {
          const list: LabBooking[] = [];
          snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as LabBooking));
          setLabBookings(list);
          setDataLoading(false);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'labBookings');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(labUnsub);
      } catch (err) {
        console.warn('Admin lab snapshot error:', err);
      }

      try {
        const ordersUnsub = onSnapshot(collection(db, 'pharmacyOrders'), (snapshot) => {
          const list: PharmacyOrder[] = [];
          snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as PharmacyOrder));
          setPharmacyOrders(list);
          setDataLoading(false);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'pharmacyOrders');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(ordersUnsub);
      } catch (err) {
        console.warn('Admin orders snapshot error:', err);
      }

      try {
        const healthRecordsUnsub = onSnapshot(collection(db, 'healthRecords'), (snapshot) => {
          const list: HealthRecord[] = [];
          snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as HealthRecord));
          setHealthRecords(list);
          setDataLoading(false);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'healthRecords');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(healthRecordsUnsub);
      } catch (err) {
        console.warn('Admin healthRecords snapshot error:', err);
      }

      try {
        const inventoryUnsub = onSnapshot(collection(db, 'pharmacyInventory'), (snapshot) => {
          const list: PharmacyInventoryItem[] = [];
          snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as PharmacyInventoryItem));
          setPharmacyInventory(list);
          setDataLoading(false);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'pharmacyInventory');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(inventoryUnsub);
      } catch (err) {
        console.warn('Admin pharmacyInventory snapshot error:', err);
      }

      try {
        const auditUnsub = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
          const list: AuditLog[] = [];
          snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as AuditLog));
          list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setAuditLogs(list);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'auditLogs');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(auditUnsub);

        const supportUnsub = onSnapshot(collection(db, 'supportTickets'), (snapshot) => {
          const list: SupportTicket[] = [];
          snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as SupportTicket));
          setSupportTickets(list);
          setDataLoading(false);
        }, (error) => {
          logFirestoreError(error, OperationType.LIST, 'supportTickets');
          setDataError('Admin access denied - check admin permissions');
          setDataLoading(false);
        });
        unsubs.push(supportUnsub);
      } catch (err) {
        console.warn('Admin audit logs snapshot error:', err);
      }

    } else {
      // Non-Admin: Listen to current user's profile document for instant status & profile updates (e.g. approval)
      try {
        const myDocUnsub = onSnapshot(doc(db, 'users', currentUser.id), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AppUser;
            setCurrentUser(data);
            setCurrentRole(data.role);
          }
        }, (error) => {
          logFirestoreError(error, OperationType.GET, `users/${currentUser.id}`);
          setDataLoading(false);
        });
        unsubs.push(myDocUnsub);
      } catch (err) {
        console.warn('User profile listener error:', err);
      }

      // Patients: listen to approved doctors, pharmacies, labs, and own appointments/bookings/orders
      if (currentUser.role === 'patient') {
        try {
          const activeUsersQ = query(
            collection(db, 'users'), 
            where('role', 'in', ['doctor', 'pharmacist', 'lab']),
            where('status', '==', 'Active'),
            limit(100)
          );
          const activeUsersUnsub = onSnapshot(activeUsersQ, (snapshot) => {
            const dcts: DoctorProfile[] = [];
            const phs: PharmacistProfile[] = [];
            const lbs: LabProfile[] = [];

            snapshot.forEach(docSnap => {
              const data = docSnap.data() as AppUser;
              if (data.role === 'doctor') dcts.push(data as DoctorProfile);
              else if (data.role === 'pharmacist') phs.push(data as PharmacistProfile);
              else if (data.role === 'lab') lbs.push(data as LabProfile);
            });

            setDoctors(dcts);
            setPharmacists(phs);
            setLabs(lbs);
            setDataLoading(false);
          }, (error) => {
            logFirestoreError(error, OperationType.LIST, 'users');
            setDataLoading(false);
          });
          unsubs.push(activeUsersUnsub);
        } catch (err) {
          console.warn('Active providers query error:', err);
        }

        // Own appointments
        try {
          const myApptsQ = query(collection(db, 'appointments'), where('patientId', '==', currentUser.id));
          const myApptsUnsub = onSnapshot(myApptsQ, (snapshot) => {
            const list: DoctorAppointment[] = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as DoctorAppointment));
            setAppointments(list);
            setDataLoading(false);
          }, (error) => {
            logFirestoreError(error, OperationType.LIST, 'appointments');
            setDataLoading(false);
          });
          unsubs.push(myApptsUnsub);
        } catch (err) {
          console.warn('Patient appointments query error:', err);
        }

        // Own lab bookings
        try {
          const myLabsQ = query(collection(db, 'labBookings'), where('patientId', '==', currentUser.id));
          const myLabsUnsub = onSnapshot(myLabsQ, (snapshot) => {
            const list: LabBooking[] = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as LabBooking));
            setLabBookings(list);
            setDataLoading(false);
          }, (error) => {
            logFirestoreError(error, OperationType.LIST, 'labBookings');
            setDataLoading(false);
          });
          unsubs.push(myLabsUnsub);
        } catch (err) {
          console.warn('Patient lab bookings query error:', err);
        }

        // Own pharmacy orders
        try {
          const myOrdersQ = query(collection(db, 'pharmacyOrders'), where('patientId', '==', currentUser.id));
          const myOrdersUnsub = onSnapshot(myOrdersQ, (snapshot) => {
            const list: PharmacyOrder[] = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as PharmacyOrder));
            setPharmacyOrders(list);
            setDataLoading(false);
          }, (error) => {
            logFirestoreError(error, OperationType.LIST, 'pharmacyOrders');
            setDataLoading(false);
          });
          unsubs.push(myOrdersUnsub);
        } catch (err) {
          console.warn('Patient pharmacy orders query error:', err);
        }

        // Active pharmacy inventory for medicines catalogue
        try {
          const invQ = collection(db, 'pharmacyInventory');
          const invUnsub = onSnapshot(invQ, (snapshot) => {
            const list: PharmacyInventoryItem[] = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as PharmacyInventoryItem));
            setPharmacyInventory(list);
          }, (err) => {
            console.warn('Patient inventory listener warning:', err);
          });
          unsubs.push(invUnsub);
        } catch (err) {
          console.warn('Inventory setup error:', err);
        }
      }

      // Doctors: listen to appointments assigned to them
      if (currentUser.role === 'doctor') {
        try {
          const docApptsQ = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.id));
          const docApptsUnsub = onSnapshot(docApptsQ, (snapshot) => {
            const list: DoctorAppointment[] = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as DoctorAppointment));
            setAppointments(list);
            setDataLoading(false);
          }, (error) => {
            logFirestoreError(error, OperationType.LIST, 'appointments');
            setDataLoading(false);
          });
          unsubs.push(docApptsUnsub);
        } catch (err) {
          console.warn('Doctor appointments query error:', err);
        }
      }

      // Pharmacists: listen to pharmacy orders assigned to them
      if (currentUser.role === 'pharmacist') {
        try {
          const pharmaOrdersQ = query(collection(db, 'pharmacyOrders'), where('pharmacyId', '==', currentUser.id));
          const pharmaOrdersUnsub = onSnapshot(pharmaOrdersQ, (snapshot) => {
            const list: PharmacyOrder[] = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as PharmacyOrder));
            setPharmacyOrders(list);
            setDataLoading(false);
          }, (error) => {
            logFirestoreError(error, OperationType.LIST, 'pharmacyOrders');
            setDataLoading(false);
          });
          unsubs.push(pharmaOrdersUnsub);
        } catch (err) {
          console.warn('Pharmacist orders query error:', err);
        }
      }

      // Labs: listen to lab bookings assigned to them
      if (currentUser.role === 'lab') {
        try {
          const labBookingsQ = query(collection(db, 'labBookings'), where('assignedLabId', '==', currentUser.id));
          const labBookingsUnsub = onSnapshot(labBookingsQ, (snapshot) => {
            const list: LabBooking[] = [];
            snapshot.forEach(d => list.push({ ...d.data(), id: d.id } as LabBooking));
            setLabBookings(list);
            setDataLoading(false);
          }, (error) => {
            logFirestoreError(error, OperationType.LIST, 'labBookings');
            setDataLoading(false);
          });
          unsubs.push(labBookingsUnsub);
        } catch (err) {
          console.warn('Lab bookings query error:', err);
        }
      }
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [isAuthenticated, currentUser?.id, currentUser?.role]);

  // Check and claim unique registration keys via uniqueKeys collection transaction
  const checkAndClaimUniqueKey = async (field: string, value: string): Promise<boolean> => {
    if (!value || !value.trim()) return false;
    const cleanVal = value.trim().toLowerCase().replace(/[^a-z0-9_\-]+/g, '_');
    const keyId = `${field}_${cleanVal}`;
    const keyRef = doc(db, 'uniqueKeys', keyId);

    try {
      let isDuplicate = false;
      await runTransaction(db, async (transaction) => {
        const keySnap = await transaction.get(keyRef);
        if (keySnap.exists()) {
          isDuplicate = true;
        } else {
          transaction.set(keyRef, { createdAt: new Date().toISOString(), field, value: value.trim() });
        }
      });
      return isDuplicate;
    } catch (err) {
      console.warn('Unique key transaction error:', err);
      return true; // fail safe to prevent duplicate
    }
  };

  // GOOGLE SIGN IN
  const loginWithGoogle = async (preferredRole?: UserRole) => {
    try {
      let res;
      try {
        res = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        // User closed or cancelled popup - graceful return
        if (
          popupErr.code === 'auth/popup-closed-by-user' ||
          popupErr.code === 'auth/user-cancelled' ||
          popupErr.code === 'auth/cancelled-popup-request' ||
          popupErr.message?.includes('user-cancelled') ||
          popupErr.message?.includes('popup-closed-by-user')
        ) {
          return { success: false, cancelled: true };
        }
        // Fallback for mobile browsers where popups might be blocked
        if (popupErr.code === 'auth/popup-blocked') {
          try {
            await signInWithRedirect(auth, googleProvider);
            return { success: true };
          } catch (redirectErr: any) {
            if (
              redirectErr.code === 'auth/user-cancelled' ||
              redirectErr.code === 'auth/popup-closed-by-user' ||
              redirectErr.code === 'auth/cancelled-popup-request' ||
              redirectErr.message?.includes('user-cancelled')
            ) {
              return { success: false, cancelled: true };
            }
            return {
              success: false,
              error: 'Unable to open Google sign-in. Please ensure popups or redirects are permitted.'
            };
          }
        }
        throw popupErr;
      }

      const fbUser = res.user;
      const cleanEmail = (fbUser.email || '').toLowerCase().trim();

      // Check if admin
      if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
        const lockStatus = getInitialAdminLock();
        if (lockStatus.isLocked) {
          return { success: false, error: 'Admin account is locked due to 5 consecutive failed attempts. Please wait 15 minutes.' };
        }
        setAdminFailedAttempts(0);
        setIsAdminLocked(false);
        clearAdminLockState();

        const adminProfile: AdminProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Praveen Verma (Director)',
          email: ADMIN_EMAIL,
          phone: '+91 9311601420',
          role: 'super_admin',
          status: 'Active',
          twoFactorEnabled: false,
          failedAttempts: 0,
          createdAt: '2026-01-01',
          assignedRoleName: 'Super Administrator',
          ...(fbUser.photoURL ? { avatarUrl: fbUser.photoURL } : {})
        };
        try {
          await setDoc(doc(db, 'users', fbUser.uid), sanitizeFirestoreDoc(adminProfile), { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
        }
        setCurrentUser(adminProfile);
        setCurrentRole('super_admin');
        setIsAuthenticated(true);
        setIsNewGoogleUser(false);
        setGooglePendingUser(null);
        setAdmin(adminProfile);
        return { success: true };
      }


      // Check if user doc exists
      const userDocRef = doc(db, 'users', fbUser.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      }

      if (userSnap && userSnap.exists()) {
        const existingData = userSnap.data() as AppUser;
        if (existingData.status === 'Blocked' || existingData.status === 'Suspended') {
          return { 
            success: false, 
            error: `Your account has been ${existingData.status}. Please contact HealthPilot support at 9311601420.` 
          };
        }
        setCurrentUser(existingData);
        setCurrentRole(existingData.role);
        setIsAuthenticated(true);
        setIsNewGoogleUser(false);
        setGooglePendingUser(null);
        resetInactivityTimer();
        return { success: true };
      }

      // New Google User: requires profile creation
      setGooglePendingUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || '',
        photoURL: fbUser.photoURL || undefined
      });
      setIsNewGoogleUser(true);
      return { success: true, isNewUser: true };
    } catch (err: any) {
      if (
        err?.code === 'auth/user-cancelled' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('user-cancelled') ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: err?.message || 'Google Sign-In failed. Please try again.' };
    }
  };

  const cancelGoogleSetup = () => {
    signOut(auth);
    setIsNewGoogleUser(false);
    setGooglePendingUser(null);
  };

  // COMPLETE GOOGLE PROFILE (First-time Google Sign-In)
  const completeGoogleProfile = async (role: UserRole, data: any) => {
    if (!googlePendingUser) {
      return { success: false, error: 'No authenticated Google session found.' };
    }

    const uid = googlePendingUser.uid;
    const cleanEmail = googlePendingUser.email.toLowerCase().trim();

    // Check credential duplicates via uniqueKeys transaction
    if (role === 'doctor' && data.councilRegistrationNumber) {
      const isDup = await checkAndClaimUniqueKey('councilRegistrationNumber', data.councilRegistrationNumber);
      if (isDup) {
        return { success: false, error: 'Medical Council Registration Number is already registered.' };
      }
    }
    if (role === 'pharmacist') {
      if (data.drugLicenceNumber) {
        const isDupDl = await checkAndClaimUniqueKey('drugLicenceNumber', data.drugLicenceNumber);
        if (isDupDl) return { success: false, error: 'Drug Licence Number is already registered.' };
      }
      if (data.gstNumber) {
        const isDupGst = await checkAndClaimUniqueKey('gstNumber', data.gstNumber);
        if (isDupGst) return { success: false, error: 'GSTIN Number is already registered.' };
      }
    }
    if (role === 'lab' && data.licenceNumber) {
      const isDupLic = await checkAndClaimUniqueKey('licenceNumber', data.licenceNumber);
      if (isDupLic) return { success: false, error: 'Diagnostic Lab Licence Number is already registered.' };
    }

    // Upload any attached files to Firebase Storage under users/{uid}/...
    if (data.filesToUpload && typeof data.filesToUpload === 'object') {
      const docsObj: any = { ...data.documents };
      for (const [key, fileObj] of Object.entries(data.filesToUpload as Record<string, File>)) {
        if (fileObj) {
          try {
            const url = await uploadFile(`users/${uid}/${Date.now()}_${fileObj.name}`, fileObj);
            docsObj[key] = url;
          } catch (upErr: any) {
            console.warn(`Failed to upload ${key}:`, upErr);
          }
        }
      }
      data.documents = docsObj;
    }

    const baseData: any = {
      id: uid,
      name: data.name || googlePendingUser.displayName || 'HealthPilot User',
      email: cleanEmail,
      phone: data.phone || '',
      role,
      status: (role === 'patient' ? 'Active' : 'Pending') as UserStatus,
      createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      ...(googlePendingUser.photoURL ? { avatarUrl: googlePendingUser.photoURL } : {})
    };

    let fullProfile: AppUser;

    if (role === 'patient') {
      fullProfile = {
        ...baseData,
        role: 'patient',
        status: 'Active',
        age: parseInt(data.age) || 0,
        gender: data.gender || '',
        bloodGroup: data.bloodGroup || '',
        allergies: [],
        chronicConditions: [],
        address: data.address || '',
        walletBalance: 0,
        familyMembers: []
      };
    } else if (role === 'doctor') {
      fullProfile = {
        ...baseData,
        name: data.name?.startsWith('Dr.') ? data.name : `Dr. ${data.name || googlePendingUser.displayName || ''}`,
        role: 'doctor',
        status: 'Pending',
        specialty: data.specialty || '',
        qualification: data.qualification || '',
        experienceYears: parseInt(data.experienceYears) || 0,
        councilRegistrationNumber: data.councilRegistrationNumber || '',
        hospitalOrClinic: data.hospitalOrClinic || '',
        clinicAddress: data.clinicAddress || '',
        consultationFee: parseInt(data.consultationFee) || 0,
        languages: data.languages || ['English', 'Hindi'],
        bio: data.bio || '',
        rating: 0,
        reviewCount: 0,
        isAvailableNow: false,
        documents: {
          degreeUrl: data.documents?.degreeUrl || data.degreeUrl || '',
          licenceUrl: data.documents?.licenceUrl || data.licenceUrl || '',
          photoUrl: data.documents?.photoUrl || data.photoUrl || ''
        }
      };
    } else if (role === 'pharmacist') {
      fullProfile = {
        ...baseData,
        role: 'pharmacist',
        status: 'Pending',
        pharmacyName: data.pharmacyName || '',
        drugLicenceNumber: data.drugLicenceNumber || '',
        gstNumber: data.gstNumber || '',
        pharmacyAddress: data.pharmacyAddress || '',
        rating: 0,
        reviewCount: 0,
        documents: {
          licenceUrl: data.documents?.licenceUrl || data.licenceUrl || '',
          gstCertUrl: data.documents?.gstCertUrl || data.gstCertUrl || ''
        }
      };
    } else if (role === 'lab') {
      fullProfile = {
        ...baseData,
        role: 'lab',
        status: 'Pending',
        labName: data.labName || '',
        accreditation: data.accreditation || 'State Certified',
        licenceNumber: data.licenceNumber || '',
        labAddress: data.labAddress || '',
        rating: 0,
        reviewCount: 0,
        documents: {
          accreditationCertUrl: data.documents?.accreditationCertUrl || data.accreditationCertUrl || '',
          licenceUrl: data.documents?.licenceUrl || data.licenceUrl || ''
        }
      };
    } else {
      return { success: false, error: 'Invalid role.' };
    }

    try {
      await setDoc(doc(db, 'users', uid), sanitizeFirestoreDoc(fullProfile));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }

    setCurrentUser(fullProfile);
    setCurrentRole(role);
    setIsAuthenticated(true);
    setIsNewGoogleUser(false);
    setGooglePendingUser(null);
    resetInactivityTimer();

    return { success: true, user: fullProfile };
  };

  // EMAIL + PASSWORD LOGIN
  const loginWithEmail = async (role: UserRole, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Super Admin Login
    if (role === 'super_admin' || role === 'sub_admin' || cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      const lockStatus = getInitialAdminLock();
      if (lockStatus.isLocked) {
        setIsAdminLocked(true);
        return { success: false, error: 'Admin account is locked due to 5 consecutive failed attempts. Please wait 15 minutes.' };
      }

      // Mandatory verification for admin (email check)
      if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
        return { success: false, error: 'This email is not authorised for admin access.' };
      }

      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const fbUser = res.user;

        const adminProfile: AdminProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Praveen Verma (Director)',
          email: ADMIN_EMAIL,
          phone: '+91 9311601420',
          role: 'super_admin',
          status: 'Active',
          twoFactorEnabled: false, // 2FA Disabled
          failedAttempts: 0,
          createdAt: '2026-01-01',
          assignedRoleName: 'Super Administrator',
          ...(fbUser.photoURL ? { avatarUrl: fbUser.photoURL } : {})
        };

        try {
          await setDoc(doc(db, 'users', fbUser.uid), sanitizeFirestoreDoc(adminProfile), { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
        }

        setAdminFailedAttempts(0);
        setIsAdminLocked(false);
        clearAdminLockState();

        setCurrentUser(adminProfile);
        setCurrentRole('super_admin');
        setIsAuthenticated(true);
        setAdmin(adminProfile);
        resetInactivityTimer();
        return { success: true };
      } catch (err: any) {
        const currentLock = getInitialAdminLock();
        const newAttempts = currentLock.attempts + 1;
        setAdminFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          const lockUntil = Date.now() + 15 * 60 * 1000;
          saveAdminLockState(newAttempts, lockUntil);
          setIsAdminLocked(true);
          return { success: false, error: 'Security Alert: 5 failed attempts! Admin account locked for 15 minutes.' };
        } else {
          saveAdminLockState(newAttempts, 0);
          return { success: false, error: `Invalid admin credentials. (${5 - newAttempts} attempts remaining before 15m lockout)` };
        }
      }
    }


    // Role-based user login
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = res.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      }

      if (!userSnap || !userSnap.exists()) {
        return { success: false, error: `No profile found for ${cleanEmail}. Please complete registration.` };
      }

      const user = userSnap.data() as AppUser;

      if (user.role !== role) {
        return { 
          success: false, 
          error: `This account is registered as a ${user.role}. Please select "${user.role.toUpperCase()}" tab to login.` 
        };
      }

      if (user.status === 'Blocked' || user.status === 'Suspended') {
        return { 
          success: false, 
          error: `Your account has been ${user.status}. Please contact HealthPilot support at 9311601420.` 
        };
      }

      setCurrentUser(user);
      setCurrentRole(role);
      setIsAuthenticated(true);
      resetInactivityTimer();
      return { success: true, status: user.status };
    } catch (err: any) {
      console.warn('Email login error:', err?.message || err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return { success: false, error: 'Invalid email or password. Please check your credentials.' };
      }
      return { success: false, error: err.message || 'Login failed. Please try again.' };
    }
  };

  // SIGN UP WITH EMAIL & PASSWORD
  const signupWithEmail = async (role: UserRole, data: any) => {
    const cleanEmail = (data.email || '').trim().toLowerCase();

    // Check duplicate licence numbers for HCPs via uniqueKeys transaction
    
    try {
      signupInProgress.current = true;
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      
      // Move checkAndClaimUniqueKey calls here
      if (role === 'doctor' && data.councilRegistrationNumber) {
        const isDup = await checkAndClaimUniqueKey('councilRegistrationNumber', data.councilRegistrationNumber);
        if (isDup) {
          throw new Error('Medical Council Registration Number is already registered.');
        }
      }
      if (role === 'pharmacist') {
        if (data.drugLicenceNumber) {
          const isDupDl = await checkAndClaimUniqueKey('drugLicenceNumber', data.drugLicenceNumber);
          if (isDupDl) throw new Error('Drug Licence Number is already registered.');
        }
        if (data.gstNumber) {
          const isDupGst = await checkAndClaimUniqueKey('gstNumber', data.gstNumber);
          if (isDupGst) throw new Error('GSTIN Number is already registered.');
        }
      }
      if (role === 'lab' && data.licenceNumber) {
        const isDupLic = await checkAndClaimUniqueKey('licenceNumber', data.licenceNumber);
        if (isDupLic) throw new Error('Diagnostic Lab Licence Number is already registered.');
      }
      
      const uid = res.user.uid;

      try {
        await sendEmailVerification(res.user);
      } catch (verifyErr) {
        console.warn('Email verification send warning:', verifyErr);
      }

      // Upload any attached files to Firebase Storage under users/{uid}/...
      if (data.filesToUpload && typeof data.filesToUpload === 'object') {
        const docsObj: any = { ...data.documents };
        for (const [key, fileObj] of Object.entries(data.filesToUpload as Record<string, File>)) {
          if (fileObj) {
            try {
              const url = await uploadFile(`users/${uid}/${Date.now()}_${fileObj.name}`, fileObj);
              docsObj[key] = url;
            } catch (upErr: any) {
              console.warn(`Failed to upload ${key}:`, upErr);
            }
          }
        }
        data.documents = docsObj;
      }

      const baseData: any = {
        id: uid,
        name: data.name || '',
        email: cleanEmail,
        phone: data.phone || '',
        role,
        status: (role === 'patient' ? 'Active' : 'Pending') as UserStatus,
        createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {})
      };

      let fullProfile: AppUser;

      if (role === 'patient') {
        fullProfile = {
          ...baseData,
          role: 'patient',
          status: 'Active',
          age: parseInt(data.age) || 0,
          gender: data.gender || '',
          bloodGroup: data.bloodGroup || '',
          allergies: [],
          chronicConditions: [],
          address: data.address || '',
          walletBalance: 0,
          familyMembers: []
        };
      } else if (role === 'doctor') {
        fullProfile = {
          ...baseData,
          name: data.name?.startsWith('Dr.') ? data.name : `Dr. ${data.name || ''}`,
          role: 'doctor',
          status: 'Pending',
          specialty: data.specialty || '',
          qualification: data.qualification || '',
          experienceYears: parseInt(data.experienceYears) || 0,
          councilRegistrationNumber: data.councilRegistrationNumber || '',
          hospitalOrClinic: data.hospitalOrClinic || '',
          clinicAddress: data.clinicAddress || '',
          consultationFee: parseInt(data.consultationFee) || 0,
          languages: data.languages || ['English', 'Hindi'],
          bio: data.bio || '',
          rating: 0,
          reviewCount: 0,
          isAvailableNow: false,
          documents: {
            degreeUrl: data.documents?.degreeUrl || data.degreeUrl || '',
            licenceUrl: data.documents?.licenceUrl || data.licenceUrl || '',
            photoUrl: data.documents?.photoUrl || data.photoUrl || ''
          }
        };
      } else if (role === 'pharmacist') {
        fullProfile = {
          ...baseData,
          role: 'pharmacist',
          status: 'Pending',
          pharmacyName: data.pharmacyName || '',
          drugLicenceNumber: data.drugLicenceNumber || '',
          gstNumber: data.gstNumber || '',
          pharmacyAddress: data.pharmacyAddress || '',
          rating: 0,
          reviewCount: 0,
          documents: {
            licenceUrl: data.documents?.licenceUrl || data.licenceUrl || '',
            gstCertUrl: data.documents?.gstCertUrl || data.gstCertUrl || ''
          }
        };
      } else if (role === 'lab') {
        fullProfile = {
          ...baseData,
          role: 'lab',
          status: 'Pending',
          labName: data.labName || '',
          accreditation: data.accreditation || 'State Certified',
          licenceNumber: data.licenceNumber || '',
          labAddress: data.labAddress || '',
          rating: 0,
          reviewCount: 0,
          documents: {
            accreditationCertUrl: data.documents?.accreditationCertUrl || data.accreditationCertUrl || '',
            licenceUrl: data.documents?.licenceUrl || data.licenceUrl || ''
          }
        };
      } else {
        return { success: false, error: 'Invalid role.' };
      }

      // Save to Firestore without any plain-text password!
      try {
        await setDoc(doc(db, 'users', uid), sanitizeFirestoreDoc(fullProfile));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }

      setCurrentUser(fullProfile);
      setCurrentRole(role);
      setIsAuthenticated(true);
      resetInactivityTimer();

      const message = role === 'patient' 
        ? 'Account created successfully! You are now logged in.'
        : 'Account created! Note: Admin approval is required before your profile is activated.';

      return { success: true, user: fullProfile, message };
    } catch (err: any) {
      console.warn('Email sign up note:', err?.message || err);
      if (err.code === 'auth/email-already-in-use') {
        return { success: false, error: `An account with email "${cleanEmail}" already exists. Please login instead.` };
      }
      return { success: false, error: err.message || 'Registration failed. Please try again.' };
    } finally {
      signupInProgress.current = false;
    }
  };

  // PASSWORD RESET via Firebase Auth
  const resetUserPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (err: any) {
      console.warn('Password reset note:', err?.message || err);
      return { success: false, error: err.message || 'Failed to send password reset email.' };
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Logout note:', err);
    } finally {
      setCurrentUser(null);
      setCurrentRole(null);
      setIsAuthenticated(false);
      setIsNewGoogleUser(false);
      setGooglePendingUser(null);
      setAppointments([]);
      setLabBookings([]);
      setPharmacyOrders([]);
      setDoctors([]);
      setPharmacists([]);
      setLabs([]);
      setPatients([]);
      setAuditLogs([]);
      setDataLoading(false);
      resetInactivityTimer();
    }
  };

  // AUDIT LOG HELPER
  const logAudit = async (action: string, targetId: string, details?: string) => {
    try {
      const logId = `LOG-${Date.now().toString()}`;
      await setDoc(doc(db, 'auditLogs', logId), sanitizeFirestoreDoc({
        id: logId,
        adminId: currentUser?.id || 'admin',
        adminName: currentUser?.name || 'Administrator',
        action,
        targetId,
        details: details || '',
        module: 'User Management',
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        createdAt: new Date().toISOString()
      }));
    } catch (err) {
      console.warn('Audit log write error:', err);
    }
  };

  // PATIENT FAMILY MEMBERS UPDATE
  const updateFamilyMembers = async (familyMembers: FamilyMember[]) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), sanitizeFirestoreDoc({ familyMembers }));
      setCurrentUser(prev => prev ? { ...prev, familyMembers } as AppUser : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
      throw err;
    }
  };

  // PATIENT PROFILE UPDATE (Address, Phone, etc.)
  const updatePatientProfile = async (updates: Partial<PatientProfile>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), sanitizeFirestoreDoc(updates));
      setCurrentUser(prev => prev ? ({ ...prev, ...updates } as AppUser) : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
      throw err;
    }
  };

  // ADMIN ACTIONS OVER USERS WITH REAL AUDIT LOGGING
  const approveUser = async (role: 'doctor' | 'pharmacist' | 'lab', userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'Active' });
      try {
        await logAudit(`Approved ${role.toUpperCase()}`, userId, `Approved ${role} profile for active platform service.`);
      } catch (auditErr) {
        console.warn('Audit log creation failed non-fatally:', auditErr);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      throw err;
    }
  };

  const rejectUser = async (role: 'doctor' | 'pharmacist' | 'lab', userId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        status: 'Suspended', 
        rejectionReason: reason 
      });
      try {
        await logAudit(`Rejected ${role.toUpperCase()}`, userId, `Rejected provider. Reason: ${reason}`);
      } catch (auditErr) {
        console.warn('Audit log creation failed non-fatally:', auditErr);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      throw err;
    }
  };

  const requestMoreDocs = async (role: 'doctor' | 'pharmacist' | 'lab', userId: string, notes: string) => {
    await rejectUser(role, userId, `Additional documents requested: ${notes}`);
  };

  const updateUserStatus = async (role: UserRole, userId: string, status: UserStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
      await logAudit(`Status Changed to ${status}`, userId, `Updated user ${userId} status to ${status}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      throw err;
    }
  };

  const deleteUser = async (role: UserRole, userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      await logAudit(`Deleted ${role.toUpperCase()} User`, userId, `Deleted user profile ${userId}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
      throw err;
    }
  };

  const forceLogoutUser = (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      logout();
    }
  };

  // APPOINTMENT MUTATIONS IN FIRESTORE (rethrowing error for UI feedback)
  const createAppointment = async (apptData: Omit<DoctorAppointment, 'id'>): Promise<DoctorAppointment> => {
    const id = `APPT-${Date.now().toString().slice(-6)}`;
    const newAppt: DoctorAppointment = { ...apptData, id };
    try {
      await setDoc(doc(db, 'appointments', id), sanitizeFirestoreDoc(newAppt));
      return newAppt;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `appointments/${id}`);
      throw err;
    }
  };

  const updateAppointment = async (appointmentId: string, updates: Partial<DoctorAppointment>) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), sanitizeFirestoreDoc(updates));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
      throw err;
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `appointments/${appointmentId}`);
      throw err;
    }
  };

  // LAB BOOKING MUTATIONS IN FIRESTORE
  const createLabBooking = async (bookingData: Omit<LabBooking, 'id'>): Promise<LabBooking> => {
    const id = `LAB-${Date.now().toString().slice(-6)}`;
    const newBooking: LabBooking = { ...bookingData, id };
    try {
      await setDoc(doc(db, 'labBookings', id), sanitizeFirestoreDoc(newBooking));
      return newBooking;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `labBookings/${id}`);
      throw err;
    }
  };

  const updateLabBooking = async (bookingId: string, updates: Partial<LabBooking>) => {
    try {
      await updateDoc(doc(db, 'labBookings', bookingId), sanitizeFirestoreDoc(updates));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `labBookings/${bookingId}`);
      throw err;
    }
  };

  const deleteLabBooking = async (bookingId: string) => {
    try {
      await deleteDoc(doc(db, 'labBookings', bookingId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `labBookings/${bookingId}`);
      throw err;
    }
  };

  // PHARMACY ORDER MUTATIONS IN FIRESTORE
  const createPharmacyOrder = async (orderData: Omit<PharmacyOrder, 'id'>): Promise<PharmacyOrder> => {
    const id = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: PharmacyOrder = { ...orderData, id };
    try {
      await setDoc(doc(db, 'pharmacyOrders', id), sanitizeFirestoreDoc(newOrder));
      return newOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pharmacyOrders/${id}`);
      throw err;
    }
  };

  const updatePharmacyOrder = async (orderId: string, updates: Partial<PharmacyOrder>) => {
    try {
      await updateDoc(doc(db, 'pharmacyOrders', orderId), sanitizeFirestoreDoc(updates));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pharmacyOrders/${orderId}`);
      throw err;
    }
  };

  const deletePharmacyOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'pharmacyOrders', orderId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pharmacyOrders/${orderId}`);
      throw err;
    }
  };

  const updatePriceMarkup = (percent: number) => {
    const val = Math.max(0, percent);
    setPriceMarkupPercent(val);
    try {
      localStorage.setItem('healthpilot_lab_markup', String(val));
    } catch {}
  };

  const updateLabTest = (testId: string, updates: Partial<LabTest>) => {
    setLabTests(prev => {
      const next = prev.map(t => {
        if (t.id === testId) {
          const updated = { ...t, ...updates };
          if (updates.labRate !== undefined) {
            updated.price = updates.labRate;
            updated.discountPrice = updates.labRate;
            updated.discountedPrice = updates.labRate;
            updated.originalPrice = updates.labRate;
          }
          return updated;
        }
        return t;
      });
      try {
        localStorage.setItem('healthpilot_lab_tests_catalog', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addLabTest = (testData: Omit<LabTest, 'id'>) => {
    setLabTests(prev => {
      const newId = `lab-${Date.now().toString().slice(-4)}`;
      const newTest: LabTest = {
        ...testData,
        id: newId,
        price: testData.labRate,
        discountPrice: testData.labRate,
        discountedPrice: testData.labRate,
        originalPrice: testData.labRate,
        parametersCount: testData.parameters || (testData.includes ? testData.includes.length : 1),
        reportTimeHours: testData.reportHours || 24,
        active: testData.active !== undefined ? testData.active : true
      };
      const next = [newTest, ...prev];
      try {
        localStorage.setItem('healthpilot_lab_tests_catalog', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const deleteLabTest = (testId: string) => {
    setLabTests(prev => {
      const next = prev.filter(t => t.id !== testId);
      try {
        localStorage.setItem('healthpilot_lab_tests_catalog', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const getPatientPrice = (labRate: number) => {
    return Math.round(labRate * (1 + priceMarkupPercent / 100));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        authLoading,
        dataLoading,
        isAdminLocked,
        adminFailedAttempts,
        inactivityRemainingSeconds,
        refreshUserProfile,
        isNewGoogleUser,
        googlePendingUser,
        cancelGoogleSetup,
        completeGoogleProfile,
        patients,
        doctors,
        pharmacists,
        labs,
        admin,
        appointments,
        labBookings,
        pharmacyOrders,
        healthRecords,
        pharmacyInventory,
        auditLogs,
        supportTickets,
        dataError,

        logAudit,
        updateFamilyMembers,
        updatePatientProfile,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        resetUserPassword,
        logout,
        resetInactivityTimer,
        approveUser,
        rejectUser,
        requestMoreDocs,
        updateUserStatus,
        deleteUser,
        forceLogoutUser,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        createLabBooking,
        updateLabBooking,
        deleteLabBooking,
        createPharmacyOrder,
        updatePharmacyOrder,
        deletePharmacyOrder,
        labTests,
        priceMarkupPercent,
        updatePriceMarkup,
        updateLabTest,
        addLabTest,
        deleteLabTest,
        getPatientPrice
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
