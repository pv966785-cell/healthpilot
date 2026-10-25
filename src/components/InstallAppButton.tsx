import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, MoreVertical, AlertTriangle } from 'lucide-react';

const SESSION_DISMISSED_KEY = 'healthpilot_install_bar_dismissed';

function getIsSessionDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function setIsSessionDismissed(): void {
  try {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
  } catch {
    // Ignore error in restricted iframe / storage settings
  }
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

interface InstallAppButtonProps {
  language?: 'en' | 'hi';
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({ language = 'en' }) => {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsStandalone());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => getIsSessionDismissed());
  const [showModal, setShowModal] = useState<boolean>(false);
  const isHi = language === 'hi';

  useEffect(() => {
    if (checkIsStandalone()) {
      setIsStandalone(true);
    }

    const handlePromptReady = () => {
      // Prompt event is ready on window.deferredPrompt
    };

    const handleInstalled = () => {
      setIsStandalone(true);
      setShowModal(false);
    };

    window.addEventListener('healthpilot:beforeinstallprompt', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handlePromptReady);
    window.addEventListener('healthpilot:appinstalled', handleInstalled);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('healthpilot:beforeinstallprompt', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handlePromptReady);
      window.removeEventListener('healthpilot:appinstalled', handleInstalled);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // Hide the bar when app already runs in standalone mode or dismissed for session
  if (isStandalone || isDismissed) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSessionDismissed();
    setIsDismissed(true);
  };

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          (window as any).deferredPrompt = null;
          setIsStandalone(true);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowModal(true);
      }
    } else {

      // Fallback modal for iOS Safari, in-app browsers, or browsers without prompt support
      setShowModal(true);
    }
  };

  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const isInAppBrowser =
    typeof navigator !== 'undefined' &&
    /FBAN|FBAV|Instagram|WhatsApp|Line|Snapchat|Twitter|WeChat|MicroMessenger/i.test(
      navigator.userAgent
    );

  return (
    <>
      {/* Slim full-width bar with blue to teal to purple gradient */}
      <aside
        aria-label="Install HealthPilot"
        className="w-full bg-gradient-to-r from-[#1769E0] via-[#0FB5A0] to-[#8B5CF6] text-white shadow-md z-50 relative pt-[env(safe-area-inset-top,0px)]"
      >
        <div className="max-w-xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5">
          {/* Left: small logo mark and message */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/logo-mark.png"
              alt="HealthPilot Icon"
              className="w-6 h-6 rounded-lg object-cover shadow-xs shrink-0 border border-white/20"
            />
            <span className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-xs">
              {isHi
                ? 'अपने फ़ोन पर HealthPilot ऐप प्राप्त करें'
                : 'Get the HealthPilot app on your phone'}
            </span>
          </div>

          {/* Right: white install button & small close X */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-[#1769E0] font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Install app"
            >
              <Download className="w-3.5 h-3.5 text-[#1769E0]" />
              <span>{isHi ? 'इंस्टॉल' : 'Install'}</span>
            </button>

            <button
              onClick={handleDismiss}
              type="button"
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-colors cursor-pointer"
              aria-label="Dismiss install notification"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Manual installation guide modal (iOS Safari, in-app browser, or unsupported browser) */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-slate-800 dark:text-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with App Logo */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo-mark.png"
                alt="HealthPilot"
                className="w-12 h-12 rounded-2xl shadow-md object-cover shrink-0"
              />
              <div>
                <h3 className="font-extrabold text-base leading-tight text-[#0A1A45] dark:text-white">
                  {isHi ? 'HealthPilot ऐप इंस्टॉल करें' : 'Install HealthPilot App'}
                </h3>
                <p className="text-xs text-teal-700 dark:text-teal-300 font-bold">
                  Health Beyond Borders
                </p>
              </div>
            </div>

            {/* In-App Browser Warning */}
            {isInAppBrowser && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/50 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200 font-medium">
                  {isHi
                    ? 'आप एक इन-ऐप ब्राउज़र (जैसे WhatsApp, Instagram) में हैं। ऐप यहाँ से इंस्टॉल नहीं होगा। कृपया इसे Safari या Chrome में खोलें।'
                    : 'You are using an in-app browser (e.g. WhatsApp, Instagram). Apps cannot be installed directly from here. Please open this page in Safari or Chrome.'}
                </p>
              </div>
            )}

            {/* Platform Instructions */}
            <div className="space-y-3.5 mb-5 text-xs text-slate-700 dark:text-slate-300">
              {isIOS ? (
                <>
                  <p className="font-bold text-[#0A1A45] dark:text-white text-xs">
                    {isHi ? 'iPhone / iPad पर कैसे इंस्टॉल करें:' : 'How to install on iPhone & iPad:'}
                  </p>
                  <div className="space-y-2.5 pl-1">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </span>
                      <span>
                        {isHi ? 'Safari में, नीचे दिए गए बार में ' : 'Open in Safari, tap the '}
                        <strong className="text-slate-900 dark:text-white">{isHi ? 'शेयर (Share) बटन' : 'Share'}</strong>{' '}
                        <Share className="inline w-3.5 h-3.5 text-[#1769E0] align-text-bottom" />{' '}
                        {isHi ? 'दबाएं।' : 'button.'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </span>
                      <span>
                        {isHi ? 'नीचे स्क्रॉल करें और ' : 'Scroll down and choose '}
                        <strong className="text-slate-900 dark:text-white">{isHi ? 'होम स्क्रीन में जोड़ें' : 'Add to Home Screen'}</strong>{' '}
                        <PlusSquare className="inline w-3.5 h-3.5 text-emerald-600 align-text-bottom" />{' '}
                        {isHi ? 'चुनें।' : '.'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        3
                      </span>
                      <span>
                        {isHi ? 'ऊपर दाईं ओर ' : 'Tap '}
                        <strong className="text-slate-900 dark:text-white">{isHi ? 'जोड़ें (Add)' : 'Add'}</strong>{' '}
                        {isHi ? 'पर टैप करें।' : 'in the top-right corner.'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#0A1A45] dark:text-white text-xs">
                    {isHi ? 'Android और Chrome पर कैसे इंस्टॉल करें:' : 'How to install on Android & Chrome:'}
                  </p>
                  <div className="space-y-2.5 pl-1">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </span>
                      <span>
                        {isHi ? 'इस पेज को ' : 'Open in '}
                        <strong className="text-slate-900 dark:text-white">{isHi ? 'Google Chrome' : 'Google Chrome'}</strong>{' '}
                        {isHi ? 'में खोलें (WhatsApp या अन्य ऐप के अंदर नहीं)।' : '(not inside WhatsApp or another app).'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </span>
                      <span>
                        {isHi ? 'ऊपर दाईं ओर ' : 'Tap the menu '}
                        <MoreVertical className="inline w-3.5 h-3.5 text-slate-700 dark:text-slate-300 align-text-bottom" />{' '}
                        {isHi ? 'तीन बिंदुओं पर टैप करें।' : 'icon.'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        3
                      </span>
                      <span>
                        <strong className="text-slate-900 dark:text-white">{isHi ? 'ऐप इंस्टॉल करें' : 'Install app'}</strong>{' '}
                        {isHi ? 'या ' : 'or '}
                        <strong className="text-slate-900 dark:text-white">{isHi ? 'होम स्क्रीन में जोड़ें' : 'Add to Home screen'}</strong>{' '}
                        {isHi ? 'चुनें।' : '.'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 font-medium">
                {isHi
                  ? 'ध्यान दें: WhatsApp या अन्य इन-ऐप ब्राउज़र से इंस्टॉल नहीं किया जा सकता।'
                  : "Note: Installation won't work inside WhatsApp or other in-app browsers."}
              </p>
            </div>

            {/* Got It Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1769E0] to-[#0FB5A0] text-white font-bold rounded-2xl text-xs shadow-md shadow-blue-600/20 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
            >
              {isHi ? 'समझ गया' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
