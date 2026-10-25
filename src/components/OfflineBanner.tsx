import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useT } from '../i18n';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const { t } = useT();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-center gap-2 shadow-md animate-slide-up">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t('offlineNotice')}</span>
    </div>
  );
};
