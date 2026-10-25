import React, { useState } from 'react';
import { 
  Sparkles, X, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, 
  Stethoscope, Activity, ShieldAlert, HeartPulse, Clock, ArrowRight,
  Info, RefreshCw, Send, HelpCircle, Thermometer, User, FileText, Check
} from 'lucide-react';
import { LabTest, DoctorProfile } from '../../types';

export interface SymptomAnalysisResult {
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  urgencyTitle: string;
  summary: string;
  possibleCauses: string[];
  suggestedSpecialties: Array<{
    specialty: string;
    reason: string;
    isPrimary: boolean;
  }>;
  suggestedLabTests: Array<{
    testName: string;
    category: string;
    reason: string;
  }>;
  homeCareAdvice: string[];
  redFlags: string[];
  disclaimer: string;
}

interface SymptomCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  language: 'en' | 'hi';
  onSelectSpecialty: (specialty: string) => void;
  onSelectLabTest: (testName: string) => void;
  availableSpecialties?: string[];
  patientAge?: number | string;
  patientGender?: string;
}

const COMMON_SYMPTOM_CHIPS = [
  'Fever & Chills',
  'Persistent Cough',
  'Severe Headache',
  'Stomach Pain & Acidity',
  'Sore Throat',
  'Joint & Muscle Aches',
  'Skin Rash / Itching',
  'Fatigue & Weakness',
  'Chest Tightness / Flutter',
  'Dizziness & Nausea',
  'Back Pain',
  'Shortness of Breath'
];

export const SymptomCheckerModal: React.FC<SymptomCheckerModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  language,
  onSelectSpecialty,
  onSelectLabTest,
  patientAge,
  patientGender
}) => {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('2-3 Days');
  const [selectedSeverity, setSelectedSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);

  if (!isOpen) return null;

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => {
      const exists = prev.includes(chip);
      let updated: string[];
      if (exists) {
        updated = prev.filter(c => c !== chip);
      } else {
        updated = [...prev, chip];
      }
      return updated;
    });
  };

  const handleAnalyze = async () => {
    // Combine typed text with chips
    const combinedSymptomsList = [
      ...selectedChips,
      symptomsInput.trim()
    ].filter(Boolean);

    const fullSymptomString = combinedSymptomsList.join(', ');

    if (!fullSymptomString.trim()) {
      setError(language === 'en' ? 'Please select or enter at least one symptom.' : 'कृपया कम से कम एक लक्षण चुनें या दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: fullSymptomString,
          duration: selectedDuration,
          severity: selectedSeverity,
          age: patientAge || 'Adult',
          gender: patientGender || 'Unspecified',
          medicalHistory: medicalNotes.trim(),
          language: language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: SymptomAnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Symptom analysis error:', err);
      setError(err?.message || 'Unable to connect to AI symptom analysis service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return {
          bg: 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-400',
          badge: 'bg-red-600 text-white',
          icon: <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
        };
      case 'high':
        return {
          bg: 'bg-orange-500/15 border-orange-500 text-orange-800 dark:text-orange-300',
          badge: 'bg-orange-600 text-white',
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300',
          badge: 'bg-amber-500 text-slate-950 font-bold',
          icon: <AlertCircle className="w-5 h-5 text-amber-500" />
        };
      case 'low':
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300',
          badge: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-700 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20 border border-white/20">
                  AI Powered
                </span>
                <span className="text-[10px] font-semibold text-blue-100">
                  Gemini 3.8 Medical Triage
                </span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {language === 'en' ? 'Smart Symptom Navigator' : 'स्मार्ट लक्षण विश्लेषक'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-blue-100 leading-snug mt-1">
            {language === 'en' 
              ? 'Tell us what you are experiencing to discover the right doctor specialty and recommended diagnostic tests.'
              : 'अपने लक्षणों का विवरण दें ताकि सही डॉक्टर विशेषज्ञ और आवश्यक लैब टेस्ट का सुझाव प्राप्त हो सके।'}
          </p>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!result ? (
            /* Input View */
            <div className="space-y-4">
              {/* Quick Symptom Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {language === 'en' ? '1. Tap Common Symptoms (Select any that apply)' : '1. सामान्य लक्षण चुनें:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SYMPTOM_CHIPS.map(chip => {
                    const isSelected = selectedChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleChip(chip)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#1769E0] text-white border-[#1769E0] shadow-sm scale-[1.02]'
                            : isDarkMode
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Freeform Symptom Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {language === 'en' ? '2. Describe Your Symptoms in Detail' : '2. अपने लक्षणों का विस्तार से वर्णन करें:'}
                </label>
                <textarea
                  rows={3}
                  value={symptomsInput}
                  onChange={e => {
                    setSymptomsInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={language === 'en' 
                    ? "e.g. Throbbing pain behind my left eye and forehead for 2 days, worse with bright lights and nausea..." 
                    : "उदा. सिर में लगातार तेज दर्द, हल्का बुखार और गले में खराश पिछले 2 दिनों से..."}
                  className={`w-full text-xs font-medium p-3 rounded-2xl border ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-[#1769E0]' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1769E0]'
                  } focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 transition-all resize-none`}
                />
              </div>

              {/* Duration and Severity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {language === 'en' ? 'Duration' : 'अवधि'}
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={e => setSelectedDuration(e.target.value)}
                    className={`w-full text-xs font-semibold p-2.5 rounded-xl border ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    } focus:outline-none focus:border-[#1769E0]`}
                  >
                    <option value="Just started today (&lt; 24 hrs)">Just started today (&lt; 24 hrs)</option>
                    <option value="2-3 Days">2 to 3 Days</option>
                    <option value="4-7 Days">4 to 7 Days</option>
                    <option value="1-2 Weeks">1 to 2 Weeks</option>
                    <option value="More than 2 Weeks (Chronic)">More than 2 Weeks (Chronic)</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                    {language === 'en' ? 'Severity' : 'तीव्रता'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Mild', 'Moderate', 'Severe'] as const).map(sev => {
                      const isSelected = selectedSeverity === sev;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSelectedSeverity(sev)}
                          className={`py-2 text-[11px] font-extrabold rounded-xl border transition-all ${
                            isSelected
                              ? sev === 'Severe'
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : sev === 'Moderate'
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : isDarkMode
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Optional Health Context */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  {language === 'en' ? 'Known Health History (Optional)' : 'पूर्व ज्ञात बीमारियां / इतिहास (वैकल्पिक)'}
                </label>
                <input
                  type="text"
                  value={medicalNotes}
                  onChange={e => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Diabetics, Hypertension, Allergic to Penicillin, Asthmatic"
                  className={`w-full text-xs font-medium p-2.5 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } focus:outline-none focus:border-[#1769E0]`}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Disclaimer notice */}
              <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                <Info className="w-4 h-4 text-[#1769E0] shrink-0 mt-0.5" />
                <p>
                  {language === 'en'
                    ? 'AI Symptom Checker is an educational triage tool and does not provide an official diagnosis. In case of emergency or severe chest pain, immediately call 108 or visit an emergency room.'
                    : 'यह एआई लक्षण विश्लेषक केवल सामान्य मार्गदर्शन के लिए है। किसी भी आपातकालीन स्थिति में तुरंत 108 पर कॉल करें।'}
                </p>
              </div>
            </div>
          ) : (
            /* Analysis Result View */
            <div className="space-y-4">
              {/* Urgency Card */}
              {(() => {
                const styles = getUrgencyStyles(result.urgency);
                return (
                  <div className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-3 ${styles.bg}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{styles.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${styles.badge}`}>
                            {result.urgency.toUpperCase()} TRIAGE
                          </span>
                          <span className="text-xs font-extrabold tracking-tight">
                            {result.urgencyTitle}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed font-medium">
                          {result.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Critical Red Flags Warning (if emergency or high) */}
              {result.redFlags && result.redFlags.length > 0 && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-1.5 text-rose-700 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      {language === 'en' ? 'Emergency Red Flags to Watch' : 'आपातकालीन चेतावनी संकेत:'}
                    </h4>
                  </div>
                  <ul className="grid grid-cols-1 gap-1 text-[11px] text-rose-800 dark:text-rose-300">
                    {result.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Doctor Specialties */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-[#1769E0]" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {language === 'en' ? 'Recommended Doctor Specialties' : 'सुझाए गए विशेषज्ञ डॉक्टर:'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#1769E0]">One-Click Consultation</span>
                </div>

                <div className="space-y-2">
                  {result.suggestedSpecialties.map((spec, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all ${
                        spec.isPrimary
                          ? isDarkMode 
                            ? 'bg-blue-950/30 border-blue-600/50' 
                            : 'bg-blue-50/80 border-blue-200'
                          : isDarkMode 
                            ? 'bg-slate-800/60 border-slate-700' 
                            : 'bg-white border-slate-200'
                      } flex items-center justify-between gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-extrabold text-xs text-[#0A1A45] dark:text-white">
                            {spec.specialty}
                          </span>
                          {spec.isPrimary && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 bg-[#1769E0] text-white rounded-md">
                              Primary Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {spec.reason}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectSpecialty(spec.specialty);
                          onClose();
                        }}
                        className="shrink-0 px-3 py-2 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <span>Consult</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Diagnostic Lab Tests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#0FB5A0]" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {language === 'en' ? 'Suggested Lab Investigations' : 'सुझाए गए लैब टेस्ट:'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#0FB5A0]">NABL Accredited</span>
                </div>

                <div className="space-y-2">
                  {result.suggestedLabTests.map((lab, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-2xl border ${
                        isDarkMode 
                          ? 'bg-teal-950/20 border-teal-700/40' 
                          : 'bg-teal-50/70 border-teal-200'
                      } flex items-center justify-between gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-extrabold text-xs text-[#0A1A45] dark:text-white truncate">
                            {lab.testName}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-teal-600 text-white rounded-md shrink-0">
                            {lab.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {lab.reason}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectLabTest(lab.testName);
                          onClose();
                        }}
                        className="shrink-0 px-3 py-2 bg-[#0FB5A0] hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
                      >
                        <span>Book Test</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Possible Causes (Clinical considerations to discuss with doctor) */}
              {result.possibleCauses && result.possibleCauses.length > 0 && (
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-indigo-500" />
                    {language === 'en' ? 'Potential Causes for Discussion with Doctor' : 'डॉक्टर के साथ चर्चा हेतु संभावित कारण:'}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.possibleCauses.map((cause, idx) => (
                      <span 
                        key={idx}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                      >
                        {cause}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Home Care Comfort Tips */}
              {result.homeCareAdvice && result.homeCareAdvice.length > 0 && (
                <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {language === 'en' ? 'Comfort & Supportive Care Tips' : 'घरेलू देखभाल व सुझाव:'}
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                    {result.homeCareAdvice.map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clinical Disclaimer */}
              <div className="text-[10px] text-slate-500 dark:text-slate-400 p-2.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl leading-relaxed text-center">
                {result.disclaimer}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          {!result ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleAnalyze}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{language === 'en' ? 'Analyze Symptoms Now' : 'लक्षणों का विश्लेषण करें'}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Check Another Symptom' : 'पुनः जांचें'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-extrabold hover:opacity-90 transition-opacity cursor-pointer"
              >
                {language === 'en' ? 'Done' : 'पूर्ण'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
