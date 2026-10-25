import React, { useState } from 'react';
import { HealthPilotLogo } from './HealthPilotLogo';
import { founderDetails } from '../mockData';
import { CONTACT_EMAIL } from '../config/constants';
import { 
  X, ShieldCheck, FileText, Phone, Mail, MapPin, 
  CheckCircle2, AlertCircle, Clock, Send, ShieldAlert,
  HelpCircle, ChevronRight, MessageCircle, ExternalLink 
} from 'lucide-react';

export type LegalTab = 'terms' | 'privacy' | 'contact';

interface LegalAndSupportModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const LegalAndSupportModal: React.FC<LegalAndSupportModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
  isDarkMode = false
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  // Contact Support Form State
  const [ticketName, setTicketName] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'Doctor Consultation' | 'Lab Booking' | 'Medicine Delivery' | 'Account & Login' | 'Grievance / DPDP'>('Doctor Consultation');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketName.trim() || !ticketMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedId = `MED-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(generatedId);
      setTicketName('');
      setTicketPhone('');
      setTicketEmail('');
      setTicketMessage('');
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div 
        className={`w-full max-w-3xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Modal Top Header */}
        <div className={`p-5 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <HealthPilotLogo size="sm" showTagline={false} />
            <div>
              <h2 className="text-base font-extrabold text-[#0A1A45] dark:text-white">
                Compliance & Legal Portal
              </h2>
              <p className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                Government of India Regulations • DPDP Act 2023 • Telemedicine Guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-2xl border transition-colors ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-4 gap-2 ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-300 bg-slate-100/60'}`}>
          <button
            onClick={() => { setActiveTab('terms'); setSubmittedTicketId(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'terms'
                ? 'border-[#1769E0] text-[#1769E0]'
                : 'border-transparent text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </button>
          <button
            onClick={() => { setActiveTab('privacy'); setSubmittedTicketId(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'privacy'
                ? 'border-[#0FB5A0] text-teal-800 dark:text-[#0FB5A0]'
                : 'border-transparent text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy (DPDP Act)</span>
          </button>
          <button
            onClick={() => { setActiveTab('contact'); setSubmittedTicketId(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'contact'
                ? 'border-[#8B5CF6] text-purple-800 dark:text-[#8B5CF6]'
                : 'border-transparent text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Contact & Support</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">
          
          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5 text-slate-700 dark:text-slate-300 font-medium">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#1769E0] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-blue-100">Regulatory Binding Agreement</h4>
                  <p className="text-[11px] mt-0.5 text-blue-900 dark:text-blue-200 font-medium">
                    Last updated: October 2026. Governed by the laws of India, including the Information Technology Act 2000, Drugs and Cosmetics Act 1940, and Telemedicine Practice Guidelines 2020.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">1. Nature of the Platform</h3>
                <p>
                  HealthPilot operates as an integrated healthcare technology aggregator connecting Registered Medical Practitioners (RMPs), certified diagnostic laboratories (NABL-accredited), and licensed retail pharmacies with patients across India. HealthPilot facilitates communication, appointments, diagnostic bookings, and prescription fulfillment.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">2. Medical Emergency Disclaimer</h3>
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 rounded-xl text-red-800 dark:text-red-300 font-medium">
                  <strong>CRITICAL NOTICE:</strong> HealthPilot teleconsultation is NOT a substitute for physical emergency medical care. If you or a family member are experiencing acute symptoms, chest pain, difficulty breathing, severe bleeding, or trauma, please contact immediate emergency ambulance services (108 / 112) or visit the nearest emergency medical facility immediately.
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">3. Telemedicine Guidelines Compliance</h3>
                <p>
                  All teleconsultations comply strictly with the Telemedicine Practice Guidelines issued on March 25, 2020 by the Board of Governors (in supersession of the Medical Council of India) and NITI Aayog. Doctors prescribe only medications authorized under Schedule O and general telemedicine schedules. Schedule X and habit-forming narcotics are prohibited on this platform.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">4. Pharmacy & Prescription Orders</h3>
                <p>
                  Prescription medicines are dispensed exclusively through licensed partner pharmacies having valid Form 20B/21B retail drug licenses. No prescription medicine will be dispatched without prior clinical verification by a registered pharmacist. Generic substitutions are suggested with patient consent per statutory guidelines.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">5. Diagnostic Testing & Home Collection</h3>
                <p>
                  Diagnostic blood and pathology samples are collected by trained, verified phlebotomists following aseptic cold-chain protocols. Samples are tested exclusively at NABL / ISO certified central partner laboratories. Digital reports are authorized and signed by registered Pathologists and Biochemists.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">6. Cancellations & Refunds</h3>
                <p>
                  Doctor consultations may be rescheduled or cancelled up to 2 hours prior to the slot time for a 100% refund to the HealthPilot wallet or original payment mode. Lab test home collections can be cancelled free of charge prior to phlebotomist dispatch. Pharmacy orders may be returned within 48 hours if sealed packaging was damaged or in case of shipment discrepancy.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">7. Jurisdiction & Dispute Resolution</h3>
                <p>
                  These Terms are construed in accordance with the laws of the Republic of India. The courts situated in Gautam Buddha Nagar / Noida, Uttar Pradesh shall have exclusive jurisdiction regarding any dispute arising out of or in connection with the platform.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY (DPDP ACT) */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 text-slate-700 dark:text-slate-300 font-medium">
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-teal-700 dark:text-teal-400" />
                <div>
                  <h4 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">Digital Personal Data Protection (DPDP) Act Compliance</h4>
                  <p className="text-[11px] mt-0.5 text-teal-900 dark:text-teal-200 font-medium">
                    We treat health data as Sensitive Personal Data or Information (SPDI). Data is encrypted in transit (TLS 1.3) and at rest (AES-256) within ISO 27001 compliant Indian data regions.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">1. Data Principal Consent & Information We Collect</h3>
                <p>
                  We collect demographic information (Name, Age, Gender, Contact number, Delivery address), clinical parameters (Allergies, Chronic conditions, Blood Group), uploaded medical prescriptions, diagnostic test reports, consultation audio/video records, and transaction logs. Explicit consent is sought before processing each category of clinical data.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">2. Lawful Purpose of Data Processing</h3>
                <p>
                  Your information is utilized solely to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Enable consultations with registered healthcare practitioners.</li>
                  <li>Facilitate diagnostic test processing and report generation.</li>
                  <li>Enable licensed pharmacies to dispense prescriptions.</li>
                  <li>Provide lifetime secure health record access to you and your nominated family members.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">3. Strict Anti-Monetization Policy</h3>
                <p className="font-bold text-[#0A1A45] dark:text-white">
                  HealthPilot NEVER sells, leases, or trades patient health data to pharmaceutical marketing firms, insurance brokers, or third-party advertisers. Your clinical records remain confidential between you, your consulting physician, and your authorized diagnostic provider.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">4. Your Statutory Rights under DPDP Act 2023</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white">Right to Access:</strong> View all collected records and summaries at any time from your Profile tab.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white">Right to Correction:</strong> Rectify or update inaccurate health or contact details instantly.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white">Right to Erasure:</strong> Request permanent deletion of non-statutory records upon account closure.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white">Right to Nominate:</strong> Authorize family members to access records in the event of medical incapacity.
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0A1A45] dark:text-white">5. Data Protection & Grievance Officer</h3>
                <p>
                  For privacy queries or grievance redressal, contact our designated Data Protection Officer:
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-1">
                  <p><strong className="text-slate-900 dark:text-white">Officer Name:</strong> Praveen Verma</p>
                  <p><strong className="text-slate-900 dark:text-white">Designation:</strong> Director & Data Grievance Redressal Officer</p>
                  <p><strong className="text-slate-900 dark:text-white">Email:</strong> {CONTACT_EMAIL}</p>
                  <p><strong className="text-slate-900 dark:text-white">Address:</strong> HealthPilot HQ, Sector-63, Noida, Uttar Pradesh, India - 201301</p>
                  <p><strong className="text-slate-900 dark:text-white">Statutory SLA:</strong> Response within 72 hours per Indian IT Rules.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & SUPPORT */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              
              {/* Contact Headquarter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#1769E0] space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span className="font-extrabold text-xs">Direct Telephone</span>
                  </div>
                  <p className="text-sm font-extrabold text-[#0A1A45] dark:text-white">{founderDetails.phone}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Mon-Sun: 24/7 SOS Support</p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span className="font-extrabold text-xs">Official Email</span>
                  </div>
                  <p className="text-sm font-extrabold text-[#0A1A45] dark:text-white">{founderDetails.email}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Replies within 2 to 4 hours</p>
                </div>
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-purple-800 dark:text-purple-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    <span className="font-extrabold text-xs">Corporate Office</span>
                  </div>
                  <p className="text-xs font-bold text-[#0A1A45] dark:text-white line-clamp-2">{founderDetails.address}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Noida, Uttar Pradesh</p>
                </div>
              </div>

              {/* Direct Quick Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${founderDetails.phone}`}
                  className="flex-1 py-3 bg-[#1769E0] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {founderDetails.phone}</span>
                </a>
                <a
                  href={`https://wa.me/91${founderDetails.phone}?text=Hello%20HealthPilot%20Support`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Support</span>
                </a>
                <a
                  href={`mailto:${founderDetails.email}`}
                  className="flex-1 py-3 bg-[#0A1A45] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-slate-900 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Support Desk</span>
                </a>
              </div>

              {/* Support Ticket Submission Form */}
              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-[#F8FAFC] border-slate-300'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0A1A45] dark:text-white">
                      Submit an Official Support Ticket
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      Our customer care & clinical escalation desk will resolve your query promptly.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    SLA: &lt; 4 Hours
                  </span>
                </div>

                {submittedTicketId ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300">
                      Ticket #{submittedTicketId} Created Successfully!
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto font-medium">
                      A confirmation has been logged. Our grievance and support team in Noida Sector-63 has been notified.
                    </p>
                    <button
                      onClick={() => setSubmittedTicketId(null)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 mt-2"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSupportSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={ticketName}
                          onChange={e => setTicketName(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#1769E0] ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile (+91)</label>
                        <input
                          type="tel"
                          placeholder="9876543210"
                          value={ticketPhone}
                          onChange={e => setTicketPhone(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#1769E0] ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={ticketEmail}
                          onChange={e => setTicketEmail(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#1769E0] ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                        <select
                          value={ticketCategory}
                          onChange={e => setTicketCategory(e.target.value as any)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#1769E0] ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="Doctor Consultation">Doctor Consultation</option>
                          <option value="Lab Booking">Lab Test & Report</option>
                          <option value="Medicine Delivery">Medicine Order & Delivery</option>
                          <option value="Account & Login">Account & Authentication</option>
                          <option value="Grievance / DPDP">Data Privacy / Grievance Officer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Describe Your Issue or Query</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Please describe how we can assist you..."
                        value={ticketMessage}
                        onChange={e => setTicketMessage(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#1769E0] ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] hover:from-blue-600 hover:to-teal-600 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Registering Ticket...' : 'Submit Support Request'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Close Bar */}
        <div className={`p-4 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'}`}>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            HealthPilot Healthcare Technologies • Noida, UP, India
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
