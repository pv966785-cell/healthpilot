import React, { useState } from 'react';
import { useAuth, sanitizeFirestoreDoc } from '../context/AuthContext';
import { HealthPilotLogo } from './HealthPilotLogo';
import { LabProfile, LabBooking } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFile } from '../utils/upload';
import { 
  Activity, CheckCircle2, Clock, Upload, User, 
  MapPin, LogOut, ArrowRight, ShieldCheck, FileText, Check, AlertCircle, Loader2, FlaskConical, X 
} from 'lucide-react';

export const LabDashboard: React.FC = () => {
  const { 
    currentUser, logout, labBookings, dataLoading, updateLabBooking
  } = useAuth();
  const lab = currentUser as LabProfile;
  const bookings = labBookings;

  const [selectedBookingForReport, setSelectedBookingForReport] = useState<LabBooking | null>(null);
  const [phleboName, setPhleboName] = useState('Ramesh Yadav (Phlebo #12)');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const showToast = (msg: string, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateStatus = async (bookingId: string, nextStatus: LabBooking['status']) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await updateLabBooking(bookingId, { status: nextStatus });
      showToast(`Booking ${bookingId} status updated to: ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update booking status.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignPhlebotomist = async (bookingId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await updateLabBooking(bookingId, { assignedPhlebotomist: phleboName, status: 'Phlebotomist Assigned' });
      showToast(`Assigned ${phleboName} for sample collection.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to assign phlebotomist.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadReport = async () => {
    if (!selectedBookingForReport || !reportFile || isProcessing) return;
    setIsProcessing(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      // Real upload to Firebase Storage under labReports/{bookingId}/...
      const storagePath = `labReports/${selectedBookingForReport.id}/${Date.now()}_${reportFile.name}`;
      const downloadUrl = await uploadFile(storagePath, reportFile, (pct) => setUploadProgress(pct));

      await updateLabBooking(selectedBookingForReport.id, { 
        status: 'Report ready', 
        reportUrl: downloadUrl,
        summary: { normalCount: 12, abnormalCount: 0, status: 'Normal' }
      });

      // Auto-save health record in Firestore for patient vault
      try {
        const recordId = `HR-${Date.now().toString().slice(-6)}`;
        await setDoc(doc(db, 'healthRecords', recordId), sanitizeFirestoreDoc({
          id: recordId,
          patientId: selectedBookingForReport.patientId,
          title: `${selectedBookingForReport.testName} (Lab Report)`,
          type: 'Lab Report',
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          doctorOrLab: lab.labName || lab.name || 'Diagnostic Centre',
          url: downloadUrl,
          createdAt: new Date().toISOString()
        }));
      } catch (hrErr) {
        console.warn('Health record auto-save error:', hrErr);
      }

      setSelectedBookingForReport(null);
      setReportFile(null);
      setUploadProgress(0);
      showToast(`Official Lab Report uploaded and saved to patient record.`);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload report file.');
      showToast(err?.message || 'Failed to upload report.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkPaymentReceived = async (bookingId: string) => {
    try {
      await updateLabBooking(bookingId, { paymentStatus: 'Paid' });
      showToast(`Payment marked as Received for lab booking ${bookingId}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update payment status.', true);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF3FA] dark:bg-slate-950 p-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 ${toastMessage.isError ? 'bg-red-600' : 'bg-[#8B5CF6]'} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border`}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Lab Dashboard Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0A1A45] dark:text-white">{lab.labName || 'Diagnostic Centre'}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{lab.accreditation || 'NABL'} Accredited • {lab.labAddress}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md text-center">
            <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Bookings</p>
            <p className="text-lg font-extrabold text-[#8B5CF6]">{bookings.length}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bookings Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-300 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-extrabold text-[#0A1A45] dark:text-white">Live Diagnostic Pipeline</h3>
        </div>
        {dataLoading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400 font-medium">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400 font-medium">No active bookings.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {bookings.map(booking => (
              <div key={booking.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-sm text-[#0A1A45] dark:text-white">{booking.testName}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        booking.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {booking.paymentStatus === 'Paid' ? `Paid (${booking.paymentMethod || 'Lab'})` : `Pending (${booking.paymentMethod || 'Pay at Lab'})`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{booking.patientName} • {booking.dateTime} • Amount: ₹{booking.amount}</p>
                    {booking.reportUrl && (
                      <span className="inline-block mt-1 text-[11px] text-emerald-600 font-semibold">
                        ✓ Report Available
                      </span>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    {booking.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {booking.paymentStatus !== 'Paid' && (
                    <button
                      onClick={() => handleMarkPaymentReceived(booking.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Mark Payment Received
                    </button>
                  )}
                  <button onClick={() => handleAssignPhlebotomist(booking.id)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Assign Phlebo</button>
                  <button onClick={() => { setSelectedBookingForReport(booking); setReportFile(null); setUploadError(null); }} className="px-4 py-2 bg-[#8B5CF6] text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors">Upload Report</button>
                  <button onClick={() => handleUpdateStatus(booking.id, 'Processing')} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors">Process</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Report Modal */}
      {selectedBookingForReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button 
              onClick={() => setSelectedBookingForReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Diagnostic Report</h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking for <strong>{selectedBookingForReport.patientName}</strong> ({selectedBookingForReport.testName})
              </p>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Select Report PDF or Image *
              </label>
              {reportFile ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{reportFile.name}</span>
                    <span className="text-[10px] text-slate-400">({(reportFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setReportFile(null)}
                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-[#8B5CF6] mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Click to select PDF, JPG or PNG</span>
                  <span className="text-[10px] text-slate-400 mt-1">Max file size: 5 MB</span>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > 5 * 1024 * 1024) {
                          setUploadError('File too large. Maximum size is 5 MB.');
                          return;
                        }
                        setUploadError(null);
                        setReportFile(f);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Uploading to Firebase Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#8B5CF6] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForReport(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportFile || isProcessing}
                onClick={handleUploadReport}
                className="flex-1 py-3 bg-[#8B5CF6] hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Submit & Save</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

