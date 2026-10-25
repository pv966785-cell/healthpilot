import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, ExternalLink, Volume2, X, AlertCircle } from 'lucide-react';
import { collection, query, where, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, logFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import { requestBrowserNotificationPermission, showBrowserNotificationIfPermitted } from '../services/notifications';
import { useT } from '../i18n';

interface NotificationBellProps {
  isDarkMode?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ isDarkMode = false }) => {
  const { currentUser } = useAuth();
  const { t } = useT();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<string>('default');
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);

  // Read current browser permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Real-time listener for current user's notifications (limit 30)
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }

    // Query notifications by userId (limited to 30) and sort client-side by createdAt desc
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.id),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // Sort newest first
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        // Check for new unread notifications while app is open
        const unreadCount = items.filter(n => !n.read).length;
        if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
          const newest = items.find(n => !n.read);
          if (newest) {
            showBrowserNotificationIfPermitted(newest.title, newest.body);
          }
        }
        prevCountRef.current = unreadCount;
        setNotifications(items);
      },
      (error) => {
        logFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notifId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await updateDoc(notifRef, { read: true });
    } catch (err: any) {
      logFirestoreError(err, OperationType.UPDATE, `notifications/${notifId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter(n => !n.read);
    if (unreadItems.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadItems.forEach(n => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.update(notifRef, { read: true });
      });
      await batch.commit();
    } catch (err: any) {
      logFirestoreError(err, OperationType.UPDATE, 'notifications/batch');
    }
  };

  const handleEnableAlerts = async () => {
    const res = await requestBrowserNotificationPermission();
    if (res !== 'unsupported') {
      setBrowserPermission(res);
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
          isDarkMode
            ? 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        } shadow-xs`}
        title={t('notifications')}
        aria-label={t('notifications')}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-slide-up ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-inherit flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">{t('notifications')}</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#1769E0]/20 text-[#1769E0] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-bold text-[#1769E0] hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t('markAllRead')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-500/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Browser Notification Banner if not enabled */}
          {browserPermission === 'default' && (
            <div className="p-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#1769E0] font-semibold text-[11px]">
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span>Get real-time alerts in your browser</span>
              </div>
              <button
                type="button"
                onClick={handleEnableAlerts}
                className="px-2 py-1 bg-[#1769E0] text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 shadow-xs"
              >
                {t('enableAlerts')}
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-inherit">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Bell className="w-7 h-7 text-slate-400 opacity-40" />
                <span>{t('noNotifications')}</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                    !notif.read
                      ? isDarkMode ? 'bg-blue-950/20 hover:bg-blue-950/30' : 'bg-blue-50/60 hover:bg-blue-50'
                      : isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? 'bg-[#1769E0]' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {notif.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
