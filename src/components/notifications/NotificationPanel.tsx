/**
 * Panneau de notifications in-app
 */
import React, { useRef, useEffect } from 'react';
import { AppNotification, NotifLevel } from '../../hooks/useNotifications';
import { Language, AppMode } from '../../../types';
import { Bell, X, CheckCheck, AlertTriangle, Info, AlertCircle, Clock, FileText, Calendar } from 'lucide-react';

interface NotificationPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  language: Language;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (mode: string) => void;
  onClose: () => void;
}

const levelIcon = (level: NotifLevel, type: string) => {
  if (type === 'deadline') return <Clock size={14} />;
  if (type === 'invoice') return <FileText size={14} />;
  if (type === 'reminder') return <Calendar size={14} />;
  if (level === 'error') return <AlertCircle size={14} />;
  if (level === 'warning') return <AlertTriangle size={14} />;
  return <Info size={14} />;
};

const levelColors: Record<NotifLevel, string> = {
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications, unreadCount, language, onMarkRead, onMarkAllRead, onNavigate, onClose
}) => {
  const isAr = language === 'ar';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute top-12 ${isAr ? 'left-0' : 'right-0'} w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-legal-blue" />
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {isAr ? 'الإشعارات' : 'Notifications'}
          </span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-legal-blue hover:underline flex items-center gap-1"
            >
              <CheckCheck size={12} />
              {isAr ? 'قراءة الكل' : 'Tout lire'}
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">
              {isAr ? 'لا توجد إشعارات' : 'Aucune notification'}
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                n.read ? 'opacity-60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              onClick={() => {
                onMarkRead(n.id);
                if (n.link_mode) onNavigate(n.link_mode);
                onClose();
              }}
            >
              {/* Icon */}
              <div className={`mt-0.5 p-1.5 rounded-lg border flex-shrink-0 ${levelColors[n.level]}`}>
                {levelIcon(n.level, n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr && n.title_ar ? n.title_ar : n.title}
                  </span>
                  {!n.read && (
                    <div className="w-2 h-2 bg-legal-blue rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {isAr && n.message_ar ? n.message_ar : n.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-400">
            {notifications.length} {isAr ? 'إشعار' : 'notification(s)'}
            {unreadCount > 0 && ` · ${unreadCount} ${isAr ? 'غير مقروء' : 'non lue(s)'}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
