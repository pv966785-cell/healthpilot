import React, { useState } from 'react';
import { 
  ShoppingBag, ShieldCheck, Package, Truck, CheckCircle2, 
  AlertCircle, ChevronDown, ChevronUp, Phone, Clock, MapPin, 
  FileText, Check, ArrowRight, X, XCircle, Loader2,
  Building2, Receipt, History, Eye
} from 'lucide-react';
import { PharmacyOrder } from '../types';
import { useAuth } from '../context/AuthContext';

interface PharmacyOrderTrackerProps {
  orders?: PharmacyOrder[];
  isDarkMode?: boolean;
  onGoToPharmacy?: () => void;
}

const ORDER_STEPS = [
  { id: 'Placed', label: 'Placed', description: 'Order received by pharmacy', icon: ShoppingBag },
  { id: 'Verified', label: 'Verified', description: 'Prescription & items approved', icon: ShieldCheck },
  { id: 'Packed', label: 'Packed', description: 'Packed & cold-chain sealed', icon: Package },
  { id: 'Out for delivery', label: 'Out for Delivery', description: 'Agent assigned & en route', icon: Truck },
  { id: 'Delivered', label: 'Delivered', description: 'Safely delivered to address', icon: CheckCircle2 }
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'Placed': return 0;
    case 'Verified': return 1;
    case 'Packed': return 2;
    case 'Out for delivery': return 3;
    case 'Delivered': return 4;
    case 'Rejected': return -1;
    default: return 0;
  }
}

export const PharmacyOrderDetailModal: React.FC<{
  order: PharmacyOrder;
  isDarkMode?: boolean;
  onClose: () => void;
  onCancelClick?: () => void;
}> = ({ order, isDarkMode, onClose, onCancelClick }) => {
  const { pharmacists } = useAuth();
  const assignedPharmacy = pharmacists.find(p => p.id === order.pharmacyId);
  const currentStepIdx = getStepIndex(order.status);
  const isRejected = order.status === 'Rejected';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden animate-scale-in ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#0A1A45] dark:text-white">Order #{order.id}</h3>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  isRejected 
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Placed on {order.orderDate || 'Today'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          
          {/* 1. ITEMS BREAKDOWN TABLE */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-500" /> Prescribed Items & Price Breakdown
            </h4>
            <div className="rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-800">
                    <th className="p-3">Item Name</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-800/60">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-200">{it.medicineName}</td>
                      <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400">x{it.quantity}</td>
                      <td className="p-3 text-right text-slate-700 dark:text-slate-400">₹{it.price}</td>
                      <td className="p-3 text-right font-extrabold text-[#0A1A45] dark:text-white">₹{it.price * it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 border-t border-slate-300 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                  <span>Delivery Charges</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">FREE (HealthPilot Express)</span>
                </div>
                {order.rxAttached && (
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                    <span>Prescription Verification</span>
                    <span className="text-teal-700 dark:text-teal-400 font-bold">Verified by Pharmacist</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-[#0A1A45] dark:text-white pt-1.5 border-t border-slate-300 dark:border-slate-700/80">
                  <span>Total Bill Amount</span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-base">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PHARMACY PARTNER DETAILS */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" /> Fulfilling Partner Pharmacy
            </h4>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <strong className="text-sm font-extrabold text-[#0A1A45] dark:text-white block">
                    {assignedPharmacy?.pharmacyName || 'HealthPilot Partner Pharmacy'}
                  </strong>
                  <span className="text-[11px] text-slate-700 dark:text-slate-400">
                    {assignedPharmacy?.pharmacyAddress || 'Central Dispensation Hub • Sector 63, Noida'}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-500/30">
                  Licensed Retail Pharmacy
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-[11px]">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Drug Licence (Form 20B/21B):</strong> <span className="font-mono">{assignedPharmacy?.drugLicenceNumber || 'DL-UP/2026/7890'}</span>
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>GSTIN Number:</strong> <span className="font-mono">{assignedPharmacy?.gstNumber || '09AAAAA0000A1Z5'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 3. FULL ORDER HISTORY TIMELINE */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" /> Full Order History Timeline
            </h4>
            
            {isRejected ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold text-xs">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Order Status: CANCELLED / REJECTED</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  <strong>Reason:</strong> {order.rejectionReason || 'Order was cancelled.'}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-800 space-y-4">
                {ORDER_STEPS.map((step, idx) => {
                  const isPassed = currentStepIdx > idx;
                  const isCurrent = currentStepIdx === idx;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex items-start gap-3 relative">
                      {idx < ORDER_STEPS.length - 1 && (
                        <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`} />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                        isPassed 
                          ? 'bg-emerald-600 text-white' 
                          : isCurrent 
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white ring-4 ring-emerald-500/20 scale-105' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex justify-between items-center">
                          <strong className={`text-xs ${
                            isCurrent 
                              ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' 
                              : isPassed 
                              ? 'text-[#0A1A45] dark:text-white font-bold' 
                              : 'text-slate-500'
                          }`}>
                            {step.label}
                          </strong>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                              In Progress
                            </span>
                          )}
                          {isPassed && (
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. DELIVERY ADDRESS & RECIPIENT */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Delivery Address & Recipient
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <p><strong>Patient Name:</strong> {order.patientName}</p>
              <p><strong>Contact Phone:</strong> {order.patientPhone || 'Not provided'}</p>
              <p><strong>Delivery Address:</strong> {order.deliveryAddress || 'Registered Home Address'}</p>
              {order.deliveryPartner && (
                <p className="text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-slate-300 dark:border-slate-700">
                  Delivery Agent: {order.deliveryPartner}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-50'
        }`}>
          {order.status === 'Placed' && onCancelClick ? (
            <button
              onClick={onCancelClick}
              className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Cancel Order
            </button>
          ) : (
            <a
              href="tel:9311601420"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Call Helpline 9311601420
            </a>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export const PharmacyOrderTrackerCard: React.FC<{ order: PharmacyOrder; isDarkMode?: boolean }> = ({ order, isDarkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { pharmacists, updatePharmacyOrder } = useAuth();

  const currentStepIdx = getStepIndex(order.status);
  const isRejected = order.status === 'Rejected';
  const assignedPharmacy = pharmacists.find(p => p.id === order.pharmacyId);

  // Progress Bar Percentage
  const progressPercent = isRejected 
    ? 0 
    : currentStepIdx === 0 ? 10
    : Math.round((currentStepIdx / (ORDER_STEPS.length - 1)) * 100);

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      await updatePharmacyOrder(order.id, {
        status: 'Rejected',
        rejectionReason: 'Cancelled by patient'
      });
      setShowCancelModal(false);
      setShowDetailModal(false);
    } catch (err: any) {
      setCancelError(err?.message || 'Could not cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div 
      onClick={() => setShowDetailModal(true)}
      className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 shadow-md cursor-pointer hover:border-emerald-500/50 hover:shadow-lg ${
        isDarkMode 
          ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-black/40' 
          : 'bg-white border-slate-300 text-slate-900 shadow-emerald-950/5'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Order #{order.id}
            </span>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium">
              {order.orderDate || 'Today'}
            </span>
          </div>
          <h4 className="font-extrabold text-sm sm:text-base mt-1 text-[#0A1A45] dark:text-white">
            {assignedPharmacy?.pharmacyName || 'Partner Pharmacy'}
          </h4>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">Total Amount</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400">
              ₹{order.totalAmount}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200 font-bold text-xs flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
            title="View Full Order Breakdown & History"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Details</span>
          </button>

          {order.status === 'Placed' && (
            <button
              onClick={(e) => { 
              e.stopPropagation();
              setCancelError(null); 
              setShowCancelModal(true); 
            }}
              className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
              title="Cancel this order"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* REJECTED / CANCELLED STATE BANNER */}
      {isRejected ? (
        <div className="my-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Order Cancelled / Rejected</span>
          </div>
          <p className="text-[11px] leading-relaxed font-medium">
            {order.rejectionReason || 'The pharmacy could not process this order due to stock unavailability or invalid prescription.'}
          </p>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">Need assistance?</span>
            <a
              href="tel:9311601420"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 bg-rose-600 text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
            >
              <Phone className="w-3 h-3" /> Call 9311601420
            </a>
          </div>
        </div>
      ) : (
        /* VISUAL PROGRESS TRACKER STAGES */
        <div className="my-5 space-y-4">
          
          {/* Linear Progress Bar Track */}
          <div className="relative w-full px-2">
            {/* Background Line */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full z-0" />
            {/* Active Filled Progress Line */}
            <div 
              className="absolute top-1/2 left-4 -translate-y-1/2 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 rounded-full transition-all duration-700 z-0"
              style={{ width: `calc(${progressPercent}% - 1rem)` }}
            />

            {/* Step Nodes */}
            <div className="relative z-10 flex items-center justify-between">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;
                const IconComponent = step.icon;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : isCurrent
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-500/25 scale-110 shadow-lg shadow-teal-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-600 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <IconComponent className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] mt-1.5 font-bold text-center transition-colors ${
                      isCurrent
                        ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                        : isPassed
                        ? 'text-slate-900 dark:text-slate-200'
                        : 'text-slate-500 dark:text-slate-600'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Active Status Card */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                {(() => {
                  const CurIcon = ORDER_STEPS[currentStepIdx]?.icon || Truck;
                  return <CurIcon className="w-5 h-5 animate-pulse" />;
                })()}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Current Status
                </span>
                <h5 className="font-extrabold text-xs sm:text-sm text-[#0A1A45] dark:text-white">
                  {ORDER_STEPS[currentStepIdx]?.label || order.status}
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {ORDER_STEPS[currentStepIdx]?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right shrink-0">
              {order.deliveryPartner && (
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">Delivery Agent</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1 justify-end">
                    <Truck className="w-3 h-3 text-emerald-600" /> {order.deliveryPartner}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary / Expand Trigger Link */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> Click card for item breakdown & timeline
        </span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {order.items.length} prescribed item(s)
        </span>
      </div>

      {/* Expanded Order Details */}
      {expanded && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs" onClick={(e) => e.stopPropagation()}>
          <div>
            <h5 className="font-bold text-[#0A1A45] dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Prescribed Items ({order.items.length})
            </h5>
            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-300 dark:border-slate-700/60">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-slate-800 dark:text-slate-300">
                    {it.medicineName} <strong className="text-emerald-700 dark:text-emerald-400">x{it.quantity}</strong>
                  </span>
                  <span className="font-bold text-[#0A1A45] dark:text-slate-200">
                    ₹{it.price * it.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Address: <strong className="text-slate-800 dark:text-white">{order.deliveryAddress || 'Registered Home Address'}</strong></span>
            </div>
            {order.rxAttached && (
              <span className="text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1 shrink-0">
                <FileText className="w-3.5 h-3.5" /> Doctor Rx Verified
              </span>
            )}
          </div>
        </div>
      )}

      {/* DETAILED ORDER MODAL */}
      {showDetailModal && (
        <PharmacyOrderDetailModal 
          order={order} 
          isDarkMode={isDarkMode} 
          onClose={() => setShowDetailModal(false)}
          onCancelClick={order.status === 'Placed' ? () => {
            setShowDetailModal(false);
            setCancelError(null);
            setShowCancelModal(true);
          } : undefined}
        />
      )}

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`w-full max-w-md rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0A1A45] dark:text-white">Cancel Pharmacy Order?</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Order #{order.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Are you sure you want to cancel this order? Once cancelled, the pharmacy will not prepare or dispatch these items.
            </p>

            {/* Order Summary Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-300 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Pharmacy Partner:</span>
                <strong className="font-bold text-[#0A1A45] dark:text-white">{assignedPharmacy?.pharmacyName || 'Partner Pharmacy'}</strong>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Items Ordered:</span>
                <span>{order.items.length} prescribed item(s)</span>
              </div>
              <div className="flex justify-between text-[#0A1A45] dark:text-white font-extrabold border-t border-slate-300 dark:border-slate-700 pt-1.5">
                <span>Total Amount:</span>
                <span className="text-emerald-700 dark:text-emerald-400">₹{order.totalAmount}</span>
              </div>
            </div>

            {cancelError && (
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-300 dark:border-rose-900">
                {cancelError}
              </p>
            )}

            {/* Modal Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Order</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PharmacyOrderTracker: React.FC<PharmacyOrderTrackerProps> = ({ 
  orders, isDarkMode, onGoToPharmacy 
}) => {
  const { pharmacyOrders } = useAuth();
  const activeOrders = orders || pharmacyOrders;

  if (!activeOrders || activeOrders.length === 0) {
    return (
      <div className={`p-6 rounded-3xl border text-center space-y-3 ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
      }`}>
        <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <Truck className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">No Pharmacy Orders Active</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
          Order prescribed medicines with instant discount & free delivery to track live preparation and delivery status here.
        </p>
        {onGoToPharmacy && (
          <button
            onClick={onGoToPharmacy}
            className="px-4 py-2.5 bg-gradient-to-r from-[#10B981] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            Order Medicines Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm sm:text-base text-[#0A1A45] dark:text-white flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          Real-Time Pharmacy Order Tracker
        </h3>
        <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" /> Live Firestore Sync
        </span>
      </div>

      <div className="space-y-3">
        {activeOrders.map(order => (
          <PharmacyOrderTrackerCard key={order.id} order={order} isDarkMode={isDarkMode} />
        ))}
      </div>
    </div>
  );
};
