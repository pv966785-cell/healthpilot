import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HealthPilotLogo } from './HealthPilotLogo';
import { 
  LayoutDashboard, Shield, Users, Stethoscope, Activity, ShoppingBag, 
  Truck, CreditCard, Headphones, FileText, Settings, Search, CheckCircle2, 
  XCircle, AlertCircle, Download, Plus, Lock, Unlock, ArrowUpRight, Check, X,
  UserCheck, Eye, EyeOff, Ban, RefreshCw, Trash2, LogOut, Phone, Menu,
  Clock, DollarSign, Calendar, MapPin, ExternalLink, Filter, ChevronRight,
  Receipt, FileCheck, Layers, Copy
} from 'lucide-react';
import { 
  AdminRoleConfig, UserStatus, UserRole, PatientProfile, DoctorProfile, 
  PharmacistProfile, LabProfile, DoctorAppointment, LabBooking, PharmacyOrder,
  HealthRecord, PharmacyInventoryItem 
} from '../types';

export const AdminPanel: React.FC = () => {
  const { 
    currentUser, logout, patients, doctors, pharmacists, labs, 
    appointments, labBookings, pharmacyOrders, healthRecords, pharmacyInventory, auditLogs, supportTickets,
    dataLoading, dataError, logAudit,
    approveUser, rejectUser, requestMoreDocs, updateUserStatus, deleteUser,
    updateAppointment, deleteAppointment,
    updateLabBooking, deleteLabBooking,
    updatePharmacyOrder, deletePharmacyOrder
  } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'approval_queue' | 'user_management' | 'orders' | 'finance' | 'activity' | 'rbac' | 'audit' | 'support'
  >('dashboard');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRoleSubTab, setUserRoleSubTab] = useState<'all' | 'patient' | 'doctor' | 'pharmacist' | 'lab'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'Active' | 'Pending' | 'Suspended' | 'Blocked'>('all');
  const [orderTypeSubTab, setOrderTypeSubTab] = useState<'all' | 'appointments' | 'labs' | 'pharmacy'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  const [maskSensitiveData, setMaskSensitiveData] = useState<boolean>(true);
  const [unmaskedUserIds, setUnmaskedUserIds] = useState<Set<string>>(new Set());
  const [inventorySearch, setInventorySearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Side panel for selected user detail
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  
  // Modal for selected order detail
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<{ type: 'appointment' | 'lab' | 'pharmacy'; data: any } | null>(null);

  const [rejectModalData, setRejectModalData] = useState<{ role: 'doctor' | 'pharmacist' | 'lab'; id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Documents are incomplete or council registration expired.');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      showToast(`Copied ${label}: ${text}`);
    } catch {
      showToast(`Copied: ${text}`);
    }
  };

  const isImageUrl = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.svg') || lower.includes('images.unsplash.com') || lower.startsWith('data:image/');
  };

  const renderDocumentsBlock = (docsObj: any) => {
    if (!docsObj || typeof docsObj !== 'object' || Object.keys(docsObj).length === 0) {
      return (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500 italic">
          No verification documents attached.
        </div>
      );
    }

    const standardDocLabels: { [k: string]: string } = {
      degreeUrl: 'Degree Certificate',
      licenceUrl: 'Licence Document',
      accreditationCertUrl: 'Accreditation Certificate',
      gstCertUrl: 'GST Certificate',
      photoUrl: 'Photo ID'
    };

    const entries = Object.entries(docsObj);

    return (
      <div className="space-y-2 mt-2">
        <span className="text-xs font-bold text-slate-300 block">Verification Documents ({entries.length})</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {entries.map(([key, rawUrl]) => {
            const urlStr = typeof rawUrl === 'string' ? rawUrl.trim() : '';
            const label = standardDocLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

            if (!urlStr) {
              return (
                <div key={key} className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">{label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold">Missing</span>
                </div>
              );
            }

            const isImg = isImageUrl(urlStr);
            const isPdf = urlStr.toLowerCase().includes('.pdf') || urlStr.toLowerCase().includes('pdf');

            return (
              <a
                key={key}
                href={urlStr}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/40 rounded-2xl flex items-center justify-between gap-2 group transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isImg ? (
                    <img src={urlStr} alt={label} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {isPdf ? 'PDF' : 'DOC'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate group-hover:text-amber-300">{label}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">{urlStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${isImg ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {isImg ? 'Image' : 'PDF'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  const handleTabSelect = (tab: typeof activeAdminTab) => {
    setActiveAdminTab(tab);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  };

  const maskPhone = (phone?: string, forceUnmask = false) => {
    if (!phone) return 'N/A';
    if (!maskSensitiveData || forceUnmask) return phone;
    return phone.length >= 8 ? phone.slice(0, 4) + '****' + phone.slice(-2) : '****';
  };

  const maskAddress = (address?: string, forceUnmask = false) => {
    if (!address) return 'N/A';
    if (!maskSensitiveData || forceUnmask) return address;
    const parts = address.split(',');
    return `${parts[0]}, **********, ${parts[parts.length - 1] || 'India'}`;
  };

  // Safe Audit log trigger wrapper
  const triggerAuditLog = async (action: string, targetId: string, details?: string) => {
    try {
      await logAudit(action, targetId, details);
    } catch (err) {
      console.warn('Audit log trigger failed non-fatally:', err);
    }
  };

  // Open user side panel and write audit log for viewing profile & health records
  const handleOpenUserDetail = (user: any) => {
    setSelectedUserDetail(user);
    try {
      triggerAuditLog(`Admin viewed health records of ${user.name || user.id}`, user.id, `Opened profile & health records for ${user.name || user.id}`);
    } catch (err) {
      console.warn(err);
    }
  };


  // Universal User List
  const allUsersList = [
    ...patients.map(p => ({ ...p, roleType: 'patient' as const })),
    ...doctors.map(d => ({ ...d, roleType: 'doctor' as const })),
    ...pharmacists.map(ph => ({ ...ph, roleType: 'pharmacist' as const })),
    ...labs.map(l => ({ ...l, roleType: 'lab' as const }))
  ];

  const filteredUsers = allUsersList.filter(u => {
    const matchesRole = userRoleSubTab === 'all' || u.roleType === userRoleSubTab;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || '').includes(searchQuery);
    return matchesRole && matchesStatus && matchesSearch;
  });

  // Pending Approval Queue
  const pendingDoctors = doctors.filter(d => d.status === 'Pending');
  const pendingPharmacists = pharmacists.filter(p => p.status === 'Pending');
  const pendingLabs = labs.filter(l => l.status === 'Pending');
  const totalPending = pendingDoctors.length + pendingPharmacists.length + pendingLabs.length;

  // Unified Orders List
  const unifiedAppointments = appointments.map(a => ({
    id: a.id,
    orderType: 'appointment' as const,
    patientId: a.patientId,
    patientName: a.patientName || 'Patient',
    providerName: a.doctorName || 'Doctor',
    providerRole: 'Doctor',
    amount: a.fee || 0,
    paymentMethod: (a.mode === 'Video' || a.mode === 'Audio' || a.mode === 'Chat') ? 'Prepaid Online' : 'Pay at Clinic',
    paymentStatus: a.status === 'Completed' ? 'Paid' : a.status === 'Cancelled' ? 'Refunded' : 'Paid',
    orderStatus: a.status,
    date: a.dateTime || 'N/A',
    raw: a
  }));

  const unifiedLabBookings = labBookings.map(l => {
    const assignedLabDoc = labs.find(lab => lab.id === l.assignedLabId);
    return {
      id: l.id,
      orderType: 'lab' as const,
      patientId: l.patientId,
      patientName: l.patientName || 'Patient',
      providerName: assignedLabDoc?.labName || assignedLabDoc?.name || l.assignedLabId || 'Diagnostic Lab',
      providerRole: 'Lab',
      amount: l.amount || 0,
      paymentMethod: l.collectionType === 'Home Collection' ? 'UPI / Online' : 'Pay at Lab',
      paymentStatus: l.status === 'Report ready' ? 'Paid' : 'Paid',
      orderStatus: l.status,
      date: l.dateTime || 'N/A',
      raw: l
    };
  });

  const unifiedPharmacyOrders = pharmacyOrders.map(p => {
    const assignedPharmDoc = pharmacists.find(pharm => pharm.id === p.pharmacyId);
    return {
      id: p.id,
      orderType: 'pharmacy' as const,
      patientId: p.patientId,
      patientName: p.patientName || 'Patient',
      providerName: assignedPharmDoc?.pharmacyName || assignedPharmDoc?.name || p.pharmacyId || 'Partner Pharmacy',
      providerRole: 'Pharmacy',
      amount: p.totalAmount || 0,
      paymentMethod: p.status === 'Delivered' ? 'Card / UPI' : 'COD',
      paymentStatus: p.status === 'Delivered' ? 'Paid' : p.status === 'Rejected' ? 'Refunded' : 'Pending',
      orderStatus: p.status,
      date: p.orderDate || 'N/A',
      raw: p
    };
  });

  const allOrdersList = [...unifiedAppointments, ...unifiedLabBookings, ...unifiedPharmacyOrders];

  const filteredOrders = allOrdersList.filter(o => {
    const matchesType = orderTypeSubTab === 'all' || o.orderType === orderTypeSubTab;
    const matchesStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.providerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Aggregated Payments List (Appointments + Lab Bookings + Pharmacy Orders)
  const allPayments = [
    ...appointments.map(a => {
      const ptDoc = patients.find(p => p.id === a.patientId);
      return {
        id: `PAY-${a.id}`,
        dateTime: a.dateTime || '2026-04-25',
        razorpayPaymentId: `pay_rzp_${a.id.replace(/[^a-zA-Z0-9]/g, '')}`,
        bookingOrOrderId: a.id,
        type: 'Doctor Consultation' as const,
        patientName: a.patientName,
        patientPhone: ptDoc?.phone || '',
        providerName: a.doctorName,
        amount: a.fee || 0,
        method: (a.mode === 'Video' || a.mode === 'Audio' || a.mode === 'Chat') ? 'UPI / Online' : 'Pay at Clinic',
        status: a.status === 'Completed' ? 'Paid' : a.status === 'Cancelled' ? 'Refunded' : 'Paid',
        itemsSummary: `Consultation (${a.doctorSpecialty || 'General'})`
      };
    }),
    ...labBookings.map(b => {
      const assignedLabDoc = labs.find(lab => lab.id === b.assignedLabId);
      return {
        id: `PAY-${b.id}`,
        dateTime: b.dateTime || '2026-04-25',
        razorpayPaymentId: `pay_rzp_${b.id.replace(/[^a-zA-Z0-9]/g, '')}`,
        bookingOrOrderId: b.id,
        type: 'Lab Test' as const,
        patientName: b.patientName,
        patientPhone: b.patientPhone || '',
        providerName: assignedLabDoc?.labName || assignedLabDoc?.name || 'Diagnostic Lab',
        amount: b.amount || 0,
        method: b.collectionType === 'Home Collection' ? 'UPI' : 'Pay at Lab',
        status: b.status === 'Report ready' ? 'Paid' : 'Paid',
        itemsSummary: b.testName
      };
    }),
    ...pharmacyOrders.map(o => {
      const assignedPharmDoc = pharmacists.find(pharm => pharm.id === o.pharmacyId);
      return {
        id: `PAY-${o.id}`,
        dateTime: o.orderDate || '2026-04-25',
        razorpayPaymentId: `pay_rzp_${o.id.replace(/[^a-zA-Z0-9]/g, '')}`,
        bookingOrOrderId: o.id,
        type: 'Medicine Order' as const,
        patientName: o.patientName,
        patientPhone: o.patientPhone || '',
        providerName: assignedPharmDoc?.pharmacyName || assignedPharmDoc?.name || 'Partner Pharmacy',
        amount: o.totalAmount || 0,
        method: o.status === 'Delivered' ? 'Card / UPI' : 'COD',
        status: o.status === 'Delivered' ? 'Paid' : o.status === 'Rejected' ? 'Refunded' : 'Pending',
        itemsSummary: o.items ? o.items.map(i => `${i.medicineName} (${i.quantity})`).join(', ') : 'Medicines'
      };
    })
  ];

  const filteredPayments = allPayments.filter(p => {
    const matchesStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
    const matchesSearch = 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.razorpayPaymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bookingOrOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientPhone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const totalCollected = filteredPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const totalPendingAmt = filteredPayments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const totalFailedAmt = filteredPayments.filter(p => p.status === 'Failed' || p.status === 'Refunded').reduce((s, p) => s + p.amount, 0);
  const totalCodAmt = filteredPayments.filter(p => p.method === 'COD' || p.method === 'Pay at Lab' || p.method === 'Pay at Clinic').reduce((s, p) => s + p.amount, 0);

  // Helper function to export real CSV downloads
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isUserUnmasked = (userId: string) => unmaskedUserIds.has(userId);

  const toggleRevealUser = (userId: string, userName: string) => {
    setUnmaskedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        triggerAuditLog(`Admin revealed contact details of ${userName}`, userId);
      }
      return next;
    });
  };

  const handleExportPaymentsCSV = () => {
    const headers = ['Payment ID', 'Reference ID', 'Order/Booking ID', 'Type', 'Date', 'Patient', 'Phone', 'Provider', 'Amount (INR)', 'Method', 'Status', 'Items Summary'];
    const rows = filteredPayments.map(p => [
      p.id, p.razorpayPaymentId, p.bookingOrOrderId, p.type, p.dateTime, p.patientName, p.patientPhone, p.providerName, p.amount, p.method, p.status, p.itemsSummary
    ]);
    downloadCSV(`healthpilot_payments_export_${Date.now()}.csv`, headers, rows);
    triggerAuditLog('Admin exported payments CSV', 'system', `Exported ${rows.length} payment records`);
    showToast('Payments CSV exported successfully!');
  };

  const handleExportOrdersCSV = () => {
    const headers = ['Order ID', 'Type', 'Date', 'Patient Name', 'Provider Name', 'Amount (INR)', 'Payment Method', 'Order Status'];
    const rows = filteredOrders.map(o => [
      o.id, o.orderType, o.date, o.patientName, o.providerName, o.amount, o.paymentMethod, o.orderStatus
    ]);
    downloadCSV(`healthpilot_orders_export_${Date.now()}.csv`, headers, rows);
    triggerAuditLog('Admin exported orders CSV', 'system', `Exported ${rows.length} order records`);
    showToast('Orders CSV exported successfully!');
  };

  const handleExportUsersCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Created Date', 'Wallet Balance'];
    const rows = filteredUsers.map(u => [
      u.id, u.name, u.email, u.phone, u.roleType, u.status, u.createdAt || '', (u as any).walletBalance || 0
    ]);
    downloadCSV(`healthpilot_users_export_${Date.now()}.csv`, headers, rows);
    triggerAuditLog('Admin exported users CSV', 'system', `Exported ${rows.length} user records`);
    showToast('Users CSV exported successfully!');
  };

  const renderNavButtons = () => (
    <>
      <button 
        onClick={() => handleTabSelect('dashboard')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'dashboard' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" /> Operations Dashboard
      </button>
      <button 
        onClick={() => handleTabSelect('approval_queue')}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'approval_queue' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-3">
          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" /> Approval Queue
        </span>
        {totalPending > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs">
            {totalPending}
          </span>
        )}
      </button>
      <button 
        onClick={() => handleTabSelect('user_management')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'user_management' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4 text-amber-400 shrink-0" /> User Directory
      </button>
      <button 
        onClick={() => handleTabSelect('orders')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'orders' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" /> All Platform Orders
      </button>
      <button 
        onClick={() => handleTabSelect('finance')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'finance' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <CreditCard className="w-4 h-4 text-amber-400 shrink-0" /> Payments & Settlements
      </button>
      <button 
        onClick={() => handleTabSelect('activity')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'activity' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <Activity className="w-4 h-4 text-amber-400 shrink-0" /> Live Surveillance
      </button>
      <button 
        onClick={() => handleTabSelect('rbac')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'rbac' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <Shield className="w-4 h-4 text-amber-400 shrink-0" /> RBAC Matrix
      </button>
      <button 
        onClick={() => handleTabSelect('audit')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'audit' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <FileText className="w-4 h-4 text-amber-400 shrink-0" /> Immutable Audit Logs
      </button>
      <button 
        onClick={() => handleTabSelect('support')}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
          activeAdminTab === 'support' 
            ? 'bg-gradient-to-r from-[#0B2A6F] to-slate-900 border border-amber-400/40 text-amber-300 font-extrabold shadow-md shadow-amber-500/10' 
            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
        }`}
      >
        <Headphones className="w-4 h-4 text-amber-400 shrink-0" /> Support Tickets
      </button>
    </>
  );

  return (
    <div className="w-full min-h-[100dvh] bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0FB5A0] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in border border-teal-300">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 flex-col shrink-0 min-h-[100dvh]">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <HealthPilotLogo size="sm" variant="white" />
        </div>

        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto text-xs font-semibold">
          {renderNavButtons()}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-extrabold text-white truncate">{currentUser?.name || 'Praveen Verma'}</p>
          <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Shield className="w-3 h-3 text-amber-400" /> Super Admin
          </span>
        </div>
      </aside>

      {/* Mobile Sidebar Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-slate-950 h-full border-r border-slate-800 flex flex-col p-4 shadow-2xl z-50 overflow-y-auto">
            <div className="p-2 border-b border-slate-800 flex items-center justify-between mb-2">
              <HealthPilotLogo size="sm" variant="white" />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1 text-xs font-semibold py-2">
              {renderNavButtons()}
            </nav>

            <div className="p-3 border-t border-slate-800 text-xs text-slate-400 mt-auto">
              <p className="font-extrabold text-white truncate">{currentUser?.name || 'Praveen Verma'}</p>
              <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Shield className="w-3 h-3 text-amber-400" /> Super Admin
              </span>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
        
        {/* Top Header */}
        <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl md:hidden hover:bg-slate-800 shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm md:text-base font-extrabold text-white capitalize flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">{activeAdminTab.replace('_', ' ')}</span>
                </h1>
                
                {/* REQUIRED SUPER ADMIN BADGE */}
                <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-400/40 text-amber-300 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                  <Shield className="w-3 h-3 text-amber-400" /> Access: Super Admin - full access
                </span>
              </div>
              <span className="text-[10px] md:text-[11px] text-slate-400 hidden sm:inline-block truncate">HealthPilot Command HQ • DPDP Act Compliant</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Sensitive Data Masking Toggle */}
            <button
              onClick={() => {
                setMaskSensitiveData(!maskSensitiveData);
                showToast(`Data Masking: ${!maskSensitiveData ? 'ENABLED (Phone/Address Hidden)' : 'DISABLED (Full View)'}`);
              }}
              className={`px-2.5 py-1.5 md:px-3 rounded-xl text-[11px] md:text-xs font-bold flex items-center gap-1.5 border transition-all ${
                maskSensitiveData ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs' : 'bg-red-500/15 text-red-300 border-red-500/40'
              }`}
            >
              {maskSensitiveData ? <EyeOff className="w-3.5 h-3.5 shrink-0" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden sm:inline">{maskSensitiveData ? 'Data Masking ON' : 'Data Masking OFF'}</span>
              <span className="sm:hidden">{maskSensitiveData ? 'Masked' : 'Raw'}</span>
            </button>

            <button
              onClick={logout}
              className="px-2.5 py-1.5 md:px-3.5 bg-slate-800 hover:bg-red-950/50 hover:border-red-500/40 border border-slate-700/60 text-slate-300 hover:text-red-300 rounded-xl text-[11px] md:text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Logout Admin</span>
            </button>
          </div>
        </header>

        {/* Global Loading / Error Banners */}
        {dataLoading && (
          <div className="m-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-amber-400 text-xs font-bold">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>Synchronizing live Firestore records for Super Admin...</span>
          </div>
        )}

        {dataError && (
          <div className="m-4 p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-300 text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        {/* 1. OPERATIONS DASHBOARD */}
        {activeAdminTab === 'dashboard' && (
          <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-3xl backdrop-blur-sm shadow-sm hover:border-slate-700 transition-all">
                <span className="text-xs text-slate-400 font-bold">Total Platform Revenue</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl md:text-2xl font-extrabold text-white">₹ {totalCollected.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center"><ArrowUpRight className="w-3.5 h-3.5" /> Live</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-3xl backdrop-blur-sm shadow-sm hover:border-amber-500/50 transition-all">
                <span className="text-xs text-amber-400 font-bold">Pending Approvals</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl md:text-2xl font-extrabold text-amber-400">{totalPending}</span>
                  <span className="text-xs text-amber-400 font-bold">Requires Verification</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-3xl backdrop-blur-sm shadow-sm hover:border-slate-700 transition-all">
                <span className="text-xs text-slate-400 font-bold">Registered Doctors</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl md:text-2xl font-extrabold text-white">{doctors.length}</span>
                  <span className="text-xs text-[#0FB5A0] font-bold">{doctors.filter(d => d.status === 'Active').length} Active</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-3xl backdrop-blur-sm shadow-sm hover:border-slate-700 transition-all">
                <span className="text-xs text-slate-400 font-bold">Pharmacy & Lab Partners</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl md:text-2xl font-extrabold text-white">{pharmacists.length + labs.length}</span>
                  <span className="text-xs text-violet-400 font-bold">Verified Outlets</span>
                </div>
              </div>
            </div>

            {/* Quick Action Queue Banner */}
            {totalPending > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-amber-400">
                    Action Required: {totalPending} Professional Registration(s) Pending Review
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Doctors, pharmacies, and diagnostic labs are awaiting your document sign-off before being allowed to practice.
                  </p>
                </div>
                <button
                  onClick={() => handleTabSelect('approval_queue')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shrink-0 w-full sm:w-auto"
                >
                  Open Approval Queue
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. APPROVAL QUEUE */}
        {activeAdminTab === 'approval_queue' && (
          <div className="p-4 md:p-6 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-white">Healthcare Professional & Partner Approval Queue</h2>
              <p className="text-xs text-slate-400">Examine NMC registration, drug licence certificates, and NABL accreditation files.</p>
            </div>

            {totalPending === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-[#0FB5A0] mx-auto mb-3" />
                <h3 className="font-extrabold text-white text-base">All Approvals Cleared</h3>
                <p className="text-xs text-slate-400 mt-1">There are no pending doctor, pharmacy, or diagnostic lab registrations at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pending Doctors */}
                {pendingDoctors.map(docItem => (
                  <div key={docItem.id} className="bg-slate-950 border border-slate-800 p-4 md:p-5 rounded-3xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={docItem.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-white">{docItem.name}</h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-[#0FB5A0]">Doctor Registration</span>
                          </div>
                          <p className="text-xs text-slate-400">{docItem.specialty} • {docItem.qualification} ({docItem.experienceYears} yrs exp)</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-mono mt-0.5">
                            <span>Council Reg: {docItem.councilRegistrationNumber || 'N/A'}</span>
                            {docItem.councilRegistrationNumber && (
                              <button onClick={() => copyToClipboard(docItem.councilRegistrationNumber, 'Council Reg No')} className="p-0.5 text-slate-400 hover:text-white" title="Copy Registration Number">
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                        <button
                          onClick={async () => {
                            setActionLoadingId(docItem.id);
                            try {
                              await approveUser('doctor', docItem.id);
                              showToast(`Dr. ${docItem.name} approved`);
                            } catch (err: any) {
                              showToast(`Approval failed: ${err?.message || 'Permission denied'}`);
                            } finally {
                              setActionLoadingId(null);
                            }
                          }}
                          disabled={actionLoadingId === docItem.id}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                        >
                          {actionLoadingId === docItem.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          {actionLoadingId === docItem.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectModalData({ role: 'doctor', id: docItem.id, name: docItem.name })}
                          disabled={actionLoadingId === docItem.id}
                          className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                        >
                          Reject
                        </button>
                        <button
                          onClick={async () => {
                            setActionLoadingId(docItem.id);
                            try {
                              await requestMoreDocs('doctor', docItem.id, 'Please upload clearer Council Registration Certificate');
                              showToast('Requested more documents from doctor');
                            } catch (err: any) {
                              showToast(`Action failed: ${err?.message || 'Error'}`);
                            } finally {
                              setActionLoadingId(null);
                            }
                          }}
                          disabled={actionLoadingId === docItem.id}
                          className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                        >
                          Request Docs
                        </button>
                      </div>
                    </div>
                    {renderDocumentsBlock(docItem.documents || { degreeUrl: (docItem as any).degreeUrl, licenceUrl: (docItem as any).licenceUrl })}
                  </div>
                ))}

                {/* Pending Pharmacists */}
                {pendingPharmacists.map(pharma => (
                  <div key={pharma.id} className="bg-slate-950 border border-slate-800 p-4 md:p-5 rounded-3xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-white">{pharma.pharmacyName}</h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">Pharmacy Registration</span>
                        </div>
                        <p className="text-xs text-slate-400">Manager: {pharma.name} • Address: {pharma.pharmacyAddress}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-violet-400 font-mono mt-0.5">
                          <span className="flex items-center gap-1">
                            Drug Licence: {pharma.drugLicenceNumber}
                            {pharma.drugLicenceNumber && (
                              <button onClick={() => copyToClipboard(pharma.drugLicenceNumber, 'Drug Licence Number')} className="p-0.5 text-slate-400 hover:text-white" title="Copy Drug Licence">
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            GST: {pharma.gstNumber}
                            {pharma.gstNumber && (
                              <button onClick={() => copyToClipboard(pharma.gstNumber, 'GST Number')} className="p-0.5 text-slate-400 hover:text-white" title="Copy GSTIN">
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            setActionLoadingId(pharma.id);
                            try {
                              await approveUser('pharmacist', pharma.id);
                              showToast(`${pharma.pharmacyName} approved`);
                            } catch (err: any) {
                              showToast(`Approval failed: ${err?.message || 'Permission denied'}`);
                            } finally {
                              setActionLoadingId(null);
                            }
                          }}
                          disabled={actionLoadingId === pharma.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                        >
                          {actionLoadingId === pharma.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          {actionLoadingId === pharma.id ? 'Approving...' : 'Approve Pharmacy'}
                        </button>
                        <button
                          onClick={() => setRejectModalData({ role: 'pharmacist', id: pharma.id, name: pharma.pharmacyName })}
                          disabled={actionLoadingId === pharma.id}
                          className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    {renderDocumentsBlock(pharma.documents || { licenceUrl: (pharma as any).licenceUrl, gstCertUrl: (pharma as any).gstCertUrl })}
                  </div>
                ))}

                {/* Pending Labs */}
                {pendingLabs.map(labItem => (
                  <div key={labItem.id} className="bg-slate-950 border border-slate-800 p-4 md:p-5 rounded-3xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-white">{labItem.labName}</h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Diagnostic Lab Registration</span>
                        </div>
                        <p className="text-xs text-slate-400">Director: {labItem.name} • Address: {labItem.labAddress}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-400 font-mono mt-0.5">
                          <span className="flex items-center gap-1">
                            Licence: {labItem.licenceNumber}
                            {labItem.licenceNumber && (
                              <button onClick={() => copyToClipboard(labItem.licenceNumber, 'Lab Licence Number')} className="p-0.5 text-slate-400 hover:text-white" title="Copy Licence Number">
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                          <span>Accreditation: {labItem.accreditation}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            setActionLoadingId(labItem.id);
                            try {
                              await approveUser('lab', labItem.id);
                              showToast(`${labItem.labName} approved`);
                            } catch (err: any) {
                              showToast(`Approval failed: ${err?.message || 'Permission denied'}`);
                            } finally {
                              setActionLoadingId(null);
                            }
                          }}
                          disabled={actionLoadingId === labItem.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                        >
                          {actionLoadingId === labItem.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          {actionLoadingId === labItem.id ? 'Approving...' : 'Approve Lab'}
                        </button>
                        <button
                          onClick={() => setRejectModalData({ role: 'lab', id: labItem.id, name: labItem.labName })}
                          disabled={actionLoadingId === labItem.id}
                          className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    {renderDocumentsBlock(labItem.documents || { accreditationCertUrl: (labItem as any).accreditationCertUrl, licenceUrl: (labItem as any).licenceUrl })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. USER DIRECTORY (PATIENTS, DOCTORS, PHARMACIES, LABS) */}
        {activeAdminTab === 'user_management' && (
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-white">Universal User Directory</h2>
                <p className="text-xs text-slate-400">Total {allUsersList.length} users registered on HealthPilot.</p>
              </div>

              {/* CSV Export & Actions */}
              <button
                onClick={handleExportUsersCSV}
                className="px-4 py-2 bg-[#1769E0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" /> Export Users CSV
              </button>
            </div>

            {/* Sub-tabs for Role Filters & Status Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'patient', 'doctor', 'pharmacist', 'lab'] as const).map(roleKey => (
                  <button
                    key={roleKey}
                    onClick={() => setUserRoleSubTab(roleKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
                      userRoleSubTab === roleKey 
                        ? 'bg-[#0FB5A0] text-slate-950 shadow-xs' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {roleKey === 'all' ? 'All Roles' : `${roleKey}s`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={userStatusFilter}
                  onChange={e => setUserStatusFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-300 focus:outline-none flex-1 sm:flex-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Blocked">Blocked</option>
                </select>
                
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, email or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Table Container with Horizontal Scroll */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-x-auto w-full">
              <table className="w-full text-xs text-left min-w-[650px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-bold">User</th>
                    <th className="py-3 px-4 font-bold">Role</th>
                    <th className="py-3 px-4 font-bold">Phone</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Created Date</th>
                    <th className="py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No users match the selected role and status filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user: any) => (
                      <tr key={user.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 shrink-0 uppercase">
                              {(user.name || 'U').charAt(0)}
                            </div>
                            <div>
                              <span className="block truncate">{user.name || 'Unnamed User'}</span>
                              <span className="block text-[11px] text-slate-400 font-normal truncate">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold capitalize text-[#0FB5A0]">{user.roleType}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{maskPhone(user.phone)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            user.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                            user.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                            user.status === 'Suspended' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{user.createdAt || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenUserDetail(user)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 rounded-lg text-[11px] font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Details
                            </button>
                            {user.status === 'Active' ? (
                              <button
                                onClick={async () => {
                                  await updateUserStatus(user.roleType, user.id, 'Suspended');
                                  showToast(`Suspended ${user.name}`);
                                }}
                                className="px-2 py-1.5 bg-amber-600/30 hover:bg-amber-600 text-amber-300 rounded-lg text-[11px] font-semibold"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await updateUserStatus(user.roleType, user.id, 'Active');
                                  showToast(`Activated ${user.name}`);
                                }}
                                className="px-2 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 rounded-lg text-[11px] font-semibold"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (confirm(`Delete account for ${user.name}? This action cannot be undone.`)) {
                                  await deleteUser(user.roleType, user.id);
                                  showToast(`Deleted user ${user.name}`);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/40"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ALL ORDERS SECTION */}
        {activeAdminTab === 'orders' && (
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-white">All Platform Orders & Bookings</h2>
                <p className="text-xs text-slate-400">Total {allOrdersList.length} total consultations, lab tests, and medicine dispensations.</p>
              </div>

              <button
                onClick={handleExportOrdersCSV}
                className="px-4 py-2 bg-[#1769E0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" /> Export Orders CSV
              </button>
            </div>

            {/* Order Sub-tabs & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'appointments', 'labs', 'pharmacy'] as const).map(typeKey => (
                  <button
                    key={typeKey}
                    onClick={() => setOrderTypeSubTab(typeKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
                      orderTypeSubTab === typeKey 
                        ? 'bg-[#0FB5A0] text-slate-950 shadow-xs' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {typeKey === 'all' ? 'All Orders' : typeKey === 'appointments' ? 'Consultations' : typeKey === 'labs' ? 'Lab Bookings' : 'Pharmacy Orders'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-300 focus:outline-none flex-1 sm:flex-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Sample collected">Sample collected</option>
                  <option value="Report ready">Report ready</option>
                  <option value="Placed">Placed</option>
                  <option value="Verified">Verified</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter order ID or name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-x-auto w-full">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-bold">Order / Booking ID</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Patient</th>
                    <th className="py-3 px-4 font-bold">Provider / Facility</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">No orders match the selected filters.</td>
                    </tr>
                  ) : (
                    filteredOrders.map(o => (
                      <tr key={o.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{o.id}</td>
                        <td className="py-3.5 px-4 font-semibold capitalize text-slate-300">
                          {o.orderType === 'appointment' ? '👨‍⚕️ Consultation' : o.orderType === 'lab' ? '🧪 Lab Test' : '💊 Pharmacy'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">{o.patientName}</td>
                        <td className="py-3.5 px-4 text-slate-300">{o.providerName}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-400">₹{o.amount}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            o.orderStatus === 'Completed' || o.orderStatus === 'Delivered' || o.orderStatus === 'Report ready' ? 'bg-emerald-500/20 text-emerald-400' :
                            o.orderStatus === 'Cancelled' || o.orderStatus === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{o.date}</td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setSelectedOrderDetail({ type: o.orderType, data: o.raw })}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/20 rounded-lg text-[11px] font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PAYMENTS & SETTLEMENTS */}
        {activeAdminTab === 'finance' && (
          <div className="p-4 md:p-6 space-y-6">
            {/* DEMO MODE AMBER BANNER */}
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Demo mode: payment records are derived from bookings. Real payment gateway (Razorpay) is not connected yet.</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-white">Platform Payments & Razorpay Settlements</h2>
                <p className="text-xs text-slate-400">Financial aggregation from Consultation Fees, Lab Bookings, and Medicine Dispensations.</p>
              </div>

              <button
                onClick={handleExportPaymentsCSV}
                className="px-4 py-2 bg-[#1769E0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" /> Export Payments CSV
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl">
                <span className="text-xs text-slate-400 font-bold">Total Revenue Collected</span>
                <span className="text-lg md:text-xl font-extrabold text-emerald-400 mt-1 block">₹{totalCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl">
                <span className="text-xs text-slate-400 font-bold">Pending Settlements</span>
                <span className="text-lg md:text-xl font-extrabold text-amber-400 mt-1 block">₹{totalPendingAmt.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl">
                <span className="text-xs text-slate-400 font-bold">Refunded / Failed</span>
                <span className="text-lg md:text-xl font-extrabold text-red-400 mt-1 block">₹{totalFailedAmt.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl">
                <span className="text-xs text-slate-400 font-bold">COD / Pay at Facility</span>
                <span className="text-lg md:text-xl font-extrabold text-violet-400 mt-1 block">₹{totalCodAmt.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <select
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search payment ID, patient name or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-x-auto w-full">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-4 font-bold">Reference ID</th>
                    <th className="py-3 px-4 font-bold">Order / Booking ID</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Patient</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">Method</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">No payment records found.</td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => (
                      <tr key={p.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">{p.dateTime}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#0FB5A0]">{p.razorpayPaymentId}</td>
                        <td className="py-3.5 px-4 font-mono text-amber-300">{p.bookingOrOrderId}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">{p.type}</td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div>
                            <span>{p.patientName}</span>
                            <span className="block text-[11px] text-slate-400 font-mono">{maskPhone(p.patientPhone)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-400">₹{p.amount}</td>
                        <td className="py-3.5 px-4 text-slate-300">{p.method}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            p.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                            p.status === 'Refunded' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. LIVE SURVEILLANCE */}
        {activeAdminTab === 'activity' && (
          <div className="p-4 md:p-6 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-white">Omniscience Monitor</h2>
              <p className="text-xs text-slate-400">Real-time platform activity tracking across all modules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-teal-400">Doctor Consultations</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{appointments.length} total</span>
                </div>
                {appointments.map(apt => (
                  <div key={apt.id} className="p-3 bg-slate-900 rounded-2xl text-xs space-y-1 relative">
                    <div className="flex justify-between font-bold">
                      <span>{apt.patientName}</span>
                      <span className="text-[#1769E0]">{apt.mode}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Doctor: {apt.doctorName}</p>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-slate-500">{apt.dateTime} • <strong className="text-teal-400">{apt.status}</strong></span>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete appointment ${apt.id}?`)) {
                            await deleteAppointment(apt.id);
                            showToast(`Deleted appointment ${apt.id}`);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Delete Appointment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-emerald-400">Lab Diagnostic Bookings</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{labBookings.length} total</span>
                </div>
                {labBookings.map(lb => {
                  const labDoc = labs.find(l => l.id === lb.assignedLabId);
                  return (
                    <div key={lb.id} className="p-3 bg-slate-900 rounded-2xl text-xs space-y-1 relative">
                      <div className="flex justify-between font-bold">
                        <span>{lb.patientName}</span>
                        <span className="text-emerald-400">₹{lb.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{lb.testName} • {labDoc?.labName || 'Lab'}</p>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] text-teal-400 font-semibold">{lb.status}</span>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete lab booking ${lb.id}?`)) {
                              await deleteLabBooking(lb.id);
                              showToast(`Deleted lab booking ${lb.id}`);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 p-1"
                          title="Delete Lab Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-violet-400">Pharmacy Orders</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{pharmacyOrders.length} total</span>
                </div>
                {pharmacyOrders.map(ord => {
                  const pharmDoc = pharmacists.find(p => p.id === ord.pharmacyId);
                  return (
                    <div key={ord.id} className="p-3 bg-slate-900 rounded-2xl text-xs space-y-1 relative">
                      <div className="flex justify-between font-bold">
                        <span>{ord.id}</span>
                        <span className="text-violet-400">₹{ord.totalAmount}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{ord.patientName} • {pharmDoc?.pharmacyName || 'Pharmacy'}</p>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] text-amber-400 font-semibold">{ord.status}</span>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete pharmacy order ${ord.id}?`)) {
                              await deletePharmacyOrder(ord.id);
                              showToast(`Deleted pharmacy order ${ord.id}`);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 p-1"
                          title="Delete Pharmacy Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 7. RBAC MATRIX */}
        {activeAdminTab === 'rbac' && (
          <div className="p-4 md:p-6 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-white">RBAC Role Permissions Matrix</h2>
              <p className="text-xs text-slate-400">Granular role-based access rules for platform administrative personnel.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Super Administrator Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Super Admin (`pv966785@gmail.com`) possesses full read/write privileges over all collections and system services.
              </p>
            </div>
          </div>
        )}

        {/* 8. IMMUTABLE AUDIT LOGS */}
        {activeAdminTab === 'audit' && (
          <div className="p-4 md:p-6 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-white">Immutable Platform Audit Logs</h2>
              <p className="text-xs text-slate-400">Cryptographically verifiable record of all administrative actions and views.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-x-auto w-full">
              <table className="w-full text-xs text-left min-w-[650px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-bold">Timestamp</th>
                    <th className="py-3 px-4 font-bold">Admin</th>
                    <th className="py-3 px-4 font-bold">Action</th>
                    <th className="py-3 px-4 font-bold">Module</th>
                    <th className="py-3 px-4 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No audit log entries recorded yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/40">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">{log.timestamp}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{log.adminName}</td>
                        <td className="py-3.5 px-4 text-[#0FB5A0] font-bold">{log.action}</td>
                        <td className="py-3.5 px-4 text-slate-300">{log.module}</td>
                        <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. SUPPORT TICKETS */}
        {activeAdminTab === 'support' && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-white">Support & Escalations</h2>
              <p className="text-xs text-slate-400">Patient, doctor, and pharmacy support tickets.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center">
              <Headphones className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No support tickets active</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Patients and healthcare partners can raise support requests through their respective portals. All support queues are currently clear.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectModalData && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[32px] p-6 shadow-2xl">
            <h3 className="font-extrabold text-base text-red-400 mb-2">Reject {rejectModalData.name}</h3>
            <p className="text-xs text-slate-400 mb-4">State the regulatory or documentation reason for rejection:</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white mb-4 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setActionLoadingId(rejectModalData.id);
                  try {
                    await rejectUser(rejectModalData.role, rejectModalData.id, rejectReason);
                    showToast(`Rejected ${rejectModalData.name}`);
                    setRejectModalData(null);
                  } catch (err: any) {
                    showToast(`Rejection failed: ${err?.message || 'Permission denied'}`);
                  } finally {
                    setActionLoadingId(null);
                  }
                }}
                disabled={actionLoadingId === rejectModalData.id}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {actionLoadingId === rejectModalData.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {actionLoadingId === rejectModalData.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => setRejectModalData(null)}
                disabled={actionLoadingId === rejectModalData.id}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL SIDE PANEL / MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-end backdrop-blur-sm">
          <div className="bg-slate-950 border-l border-slate-800 w-full max-w-xl h-full overflow-y-auto p-6 shadow-2xl flex flex-col space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-extrabold text-base uppercase">
                  {(selectedUserDetail.name || 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{selectedUserDetail.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-[#0FB5A0] uppercase">
                    {selectedUserDetail.roleType || selectedUserDetail.role}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Fields Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
              <h4 className="font-extrabold text-amber-300 text-sm border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Stored Profile Attributes</span>
                <span className="text-[10px] font-mono text-slate-400">ID: {selectedUserDetail.id}</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">User ID:</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate block">{selectedUserDetail.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Account Status:</span>
                  <span className="text-emerald-400 font-bold">{selectedUserDetail.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Email Address:</span>
                  <span className="text-slate-200 truncate block">{selectedUserDetail.email}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Phone:</span>
                    <button
                      onClick={() => toggleRevealUser(selectedUserDetail.id, selectedUserDetail.name)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-0.5"
                    >
                      {isUserUnmasked(selectedUserDetail.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {isUserUnmasked(selectedUserDetail.id) ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <span className="text-slate-200 font-mono">{maskPhone(selectedUserDetail.phone, isUserUnmasked(selectedUserDetail.id))}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Created Date:</span>
                  <span className="text-slate-300">{selectedUserDetail.createdAt || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Wallet Balance:</span>
                  <span className="text-emerald-400 font-extrabold">₹{selectedUserDetail.walletBalance || 0}</span>
                </div>
              </div>

              {/* Role Specific Attributes */}
              {selectedUserDetail.roleType === 'patient' && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block font-semibold">Age & Gender:</span>
                      <span className="text-slate-200">{selectedUserDetail.age || 'N/A'} yrs • {selectedUserDetail.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Blood Group:</span>
                      <span className="text-red-400 font-bold">{selectedUserDetail.bloodGroup || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Allergies:</span>
                      <span className="text-slate-200">{selectedUserDetail.allergies ? (Array.isArray(selectedUserDetail.allergies) ? selectedUserDetail.allergies.join(', ') : selectedUserDetail.allergies) : 'None reported'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Chronic Conditions:</span>
                      <span className="text-slate-200">{selectedUserDetail.chronicConditions ? (Array.isArray(selectedUserDetail.chronicConditions) ? selectedUserDetail.chronicConditions.join(', ') : selectedUserDetail.chronicConditions) : 'None reported'}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Address:</span>
                        <button
                          onClick={() => toggleRevealUser(selectedUserDetail.id, selectedUserDetail.name)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-0.5"
                        >
                          {isUserUnmasked(selectedUserDetail.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {isUserUnmasked(selectedUserDetail.id) ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                      <span className="text-slate-300 block">{maskAddress(selectedUserDetail.address, isUserUnmasked(selectedUserDetail.id))}</span>
                    </div>
                  </div>

                  {/* Family Members */}
                  {selectedUserDetail.familyMembers && selectedUserDetail.familyMembers.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 font-semibold block mb-1">Family Members ({selectedUserDetail.familyMembers.length})</span>
                      <div className="space-y-1">
                        {selectedUserDetail.familyMembers.map((fam: any, fIdx: number) => (
                          <div key={fIdx} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                            <span className="font-bold text-white">{fam.name} ({fam.relation})</span>
                            <span className="text-slate-400">{fam.age || fam.dob || ''} yrs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedUserDetail.roleType === 'doctor' && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block font-semibold">Specialty:</span>
                      <span className="text-teal-300 font-bold">{selectedUserDetail.specialty}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Council Reg No:</span>
                        {selectedUserDetail.councilRegistrationNumber && (
                          <button onClick={() => copyToClipboard(selectedUserDetail.councilRegistrationNumber, 'Council Reg No')} className="p-0.5 text-slate-400 hover:text-white" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-teal-400 font-mono font-bold">{selectedUserDetail.councilRegistrationNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Qualification & Exp:</span>
                      <span className="text-slate-200">{selectedUserDetail.qualification} ({selectedUserDetail.experienceYears} yrs)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Consultation Fee:</span>
                      <span className="text-emerald-400 font-extrabold">₹{selectedUserDetail.consultationFee}</span>
                    </div>
                  </div>
                  {renderDocumentsBlock(selectedUserDetail.documents || { degreeUrl: selectedUserDetail.degreeUrl, licenceUrl: selectedUserDetail.licenceUrl })}
                </div>
              )}

              {selectedUserDetail.roleType === 'pharmacist' && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block font-semibold">Pharmacy Name:</span>
                      <span className="text-white font-bold">{selectedUserDetail.pharmacyName}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Drug Licence No:</span>
                        {selectedUserDetail.drugLicenceNumber && (
                          <button onClick={() => copyToClipboard(selectedUserDetail.drugLicenceNumber, 'Drug Licence Number')} className="p-0.5 text-slate-400 hover:text-white" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-violet-400 font-mono font-bold">{selectedUserDetail.drugLicenceNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">GSTIN:</span>
                        {selectedUserDetail.gstNumber && (
                          <button onClick={() => copyToClipboard(selectedUserDetail.gstNumber, 'GST Number')} className="p-0.5 text-slate-400 hover:text-white" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-slate-200 font-mono">{selectedUserDetail.gstNumber || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Pharmacy Address:</span>
                      <button
                        onClick={() => toggleRevealUser(selectedUserDetail.id, selectedUserDetail.name)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-0.5"
                      >
                        {isUserUnmasked(selectedUserDetail.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {isUserUnmasked(selectedUserDetail.id) ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <span className="text-slate-300">{maskAddress(selectedUserDetail.pharmacyAddress, isUserUnmasked(selectedUserDetail.id))}</span>
                  </div>
                  {renderDocumentsBlock(selectedUserDetail.documents || { licenceUrl: selectedUserDetail.licenceUrl, gstCertUrl: selectedUserDetail.gstCertUrl })}
                </div>
              )}

              {selectedUserDetail.roleType === 'lab' && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block font-semibold">Lab Name:</span>
                      <span className="text-white font-bold">{selectedUserDetail.labName}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Licence Number:</span>
                        {selectedUserDetail.licenceNumber && (
                          <button onClick={() => copyToClipboard(selectedUserDetail.licenceNumber, 'Lab Licence Number')} className="p-0.5 text-slate-400 hover:text-white" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-emerald-400 font-mono font-bold">{selectedUserDetail.licenceNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Accreditation:</span>
                      <span className="text-teal-300 font-semibold">{selectedUserDetail.accreditation || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Lab Address:</span>
                      <button
                        onClick={() => toggleRevealUser(selectedUserDetail.id, selectedUserDetail.name)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-0.5"
                      >
                        {isUserUnmasked(selectedUserDetail.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {isUserUnmasked(selectedUserDetail.id) ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <span className="text-slate-300">{maskAddress(selectedUserDetail.labAddress, isUserUnmasked(selectedUserDetail.id))}</span>
                  </div>
                  {renderDocumentsBlock(selectedUserDetail.documents || { accreditationCertUrl: selectedUserDetail.accreditationCertUrl, licenceUrl: selectedUserDetail.licenceUrl })}
                </div>
              )}
            </div>

            {/* Health Records Section */}
            {(() => {
              const userHealthRecords = healthRecords.filter(hr => hr.patientId === selectedUserDetail.id || hr.doctorId === selectedUserDetail.id || hr.labId === selectedUserDetail.id);
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                  <h4 className="font-extrabold text-amber-300 text-sm border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>Health Records ({userHealthRecords.length})</span>
                  </h4>
                  {userHealthRecords.length === 0 ? (
                    <p className="text-slate-500 text-xs italic">No health records found for this user.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {userHealthRecords.map(record => (
                        <div key={record.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{record.title || record.type || 'Medical Record'}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">{record.type}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">Date: {record.date || 'N/A'} • Provider: {record.doctorName || record.labName || record.providerName || 'N/A'}</p>
                          {(record.fileUrl || record.prescriptionUrl) && (
                            <a
                              href={record.fileUrl || record.prescriptionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" /> View Record File / Prescription
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Pharmacist Inventory Section */}
            {selectedUserDetail.roleType === 'pharmacist' && (() => {
              const pharmItems = pharmacyInventory.filter(item => item.pharmacyId === selectedUserDetail.id);
              const filteredInventory = pharmItems.filter(item => 
                (item.medicineName || '').toLowerCase().includes(inventorySearch.toLowerCase())
              );
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <h4 className="font-extrabold text-amber-300 text-sm">Inventory ({pharmItems.length} items)</h4>
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search medicine..."
                        value={inventorySearch}
                        onChange={e => setInventorySearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 pl-7 pr-2 py-1 rounded-lg text-[11px] text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  {filteredInventory.length === 0 ? (
                    <p className="text-slate-500 text-xs italic">No items found in pharmacy inventory.</p>
                  ) : (
                    <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
                      {filteredInventory.map(item => (
                        <div key={item.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">{item.medicineName}</span>
                            <span className="text-[10px] text-slate-400">Category: {item.category || 'Medicine'}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-400 block">₹{item.price}</span>
                            {(() => {
                              const currentStock = item.stock ?? item.stockCount ?? 0;
                              return (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  currentStock <= 10 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  Stock: {currentStock} {currentStock <= 10 ? '(Low Stock)' : ''}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Related Records Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">User's Associated Platform Activity</h4>

              {/* Related Consultations */}
              {(() => {
                const userAppts = appointments.filter(a => a.patientId === selectedUserDetail.id || a.doctorId === selectedUserDetail.id);
                const userLabs = labBookings.filter(l => l.patientId === selectedUserDetail.id || l.assignedLabId === selectedUserDetail.id);
                const userPharm = pharmacyOrders.filter(p => p.patientId === selectedUserDetail.id || p.pharmacyId === selectedUserDetail.id);

                return (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-teal-400 font-bold block mb-1">Doctor Consultations ({userAppts.length})</span>
                      {userAppts.length === 0 ? (
                        <p className="text-slate-500 italic">No consultations found for this user.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {userAppts.map(a => (
                            <div key={a.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-white block">{a.id} • {a.doctorName}</span>
                                <span className="text-[10px] text-slate-400">{a.dateTime}</span>
                              </div>
                              <span className="text-emerald-400 font-extrabold">₹{a.fee}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-emerald-400 font-bold block mb-1">Lab Test Bookings ({userLabs.length})</span>
                      {userLabs.length === 0 ? (
                        <p className="text-slate-500 italic">No lab bookings found for this user.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {userLabs.map(l => (
                            <div key={l.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-white block">{l.id} • {l.testName}</span>
                                <span className="text-[10px] text-slate-400">{l.assignedLabId}</span>
                              </div>
                              <span className="text-emerald-400 font-extrabold">₹{l.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-violet-400 font-bold block mb-1">Pharmacy Orders ({userPharm.length})</span>
                      {userPharm.length === 0 ? (
                        <p className="text-slate-500 italic">No pharmacy orders found for this user.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {userPharm.map(p => (
                            <div key={p.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-white block">{p.id} • {p.status}</span>
                                <span className="text-[10px] text-slate-400">{p.orderDate}</span>
                              </div>
                              <span className="text-emerald-400 font-extrabold">₹{p.totalAmount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={() => setSelectedUserDetail(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-colors"
            >
              Close Profile Panel
            </button>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-[32px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">
                Order Details: <span className="text-amber-300 font-mono">{selectedOrderDetail.data.id}</span>
              </h3>
              <button onClick={() => setSelectedOrderDetail(null)} className="p-1 rounded-full text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Category:</span>
                  <span className="text-teal-400 font-bold uppercase">{selectedOrderDetail.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient Name:</span>
                  <span className="text-white font-bold">{selectedOrderDetail.data.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">{selectedOrderDetail.data.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Bill Amount:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">₹{selectedOrderDetail.data.totalAmount || selectedOrderDetail.data.amount || selectedOrderDetail.data.fee || 0}</span>
                </div>
              </div>

              {/* Items Breakdown if Pharmacy Order */}
              {selectedOrderDetail.type === 'pharmacy' && selectedOrderDetail.data.items && (
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-amber-300 font-bold block mb-1">Prescribed Medicines Breakdown</span>
                  {selectedOrderDetail.data.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-slate-200 border-b border-slate-800/60 pb-1">
                      <span>{it.medicineName} x {it.quantity}</span>
                      <span className="font-mono">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Address if Pharmacy or Home Lab */}
              {selectedOrderDetail.data.deliveryAddress && (
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block font-semibold">Delivery Address:</span>
                  <span className="text-slate-200">{maskAddress(selectedOrderDetail.data.deliveryAddress)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
