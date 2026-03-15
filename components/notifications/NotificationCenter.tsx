import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, AlertCircle, Calendar, FileText, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { Language, UserRole } from '../../types';
import { useNotifications } from '../../src/hooks/useNotifications';

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  related_type?: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
  link_mode?: string;
}

interface NotificationCenterProps {
  userId: string;
  language: Language;
  userRole?: UserRole;
  onNavigate?: (type: string, id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, language, userRole, onNavigate }) => {
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isAr = language === 'ar';

  // Hook temps-réel: délais urgents + factures + rappels
  const liveNotifs = useNotifications(userId, userRole ?? null);

  // Fusionner les deux sources
  const notifications: Notification[] = [
    // Live notifs (délais, factures, rappels) converties au format Notification
    ...liveNotifs.notifications.map(n => ({
      id: n.id,
      type: n.type,
      priority: n.level === 'error' ? 'urgent' : n.level === 'warning' ? 'high' : 'normal',
      title: isAr && n.title_ar ? n.title_ar : n.title,
      message: isAr && n.message_ar ? n.message_ar : n.message,
      is_read: n.read,
      created_at: n.created_at,
      link_mode: n.link_mode,
    })),
    // DB notifs
    ...dbNotifications,
  ];

  const totalUnread = liveNotifs.unreadCount + dbNotifications.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifications();
    
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setDbNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (!error) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (!error) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (notification.id.startsWith('deadline_') || notification.id.startsWith('invoice_') || notification.id.startsWith('reminder_')) {
      liveNotifs.markAsRead(notification.id);
    } else {
      markAsRead(notification.id);
    }

    // Navigate
    if (notification.link_mode && onNavigate) {
      onNavigate(notification.link_mode, '');
    } else if (notification.related_type && notification.related_id && onNavigate) {
      onNavigate(notification.related_type, notification.related_id);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <AlertCircle size={18} className="text-red-500" />;
      case 'hearing':
      case 'event':
        return <Calendar size={18} className="text-blue-500" />;
      case 'document':
        return <FileText size={18} className="text-purple-500" />;
      case 'task':
        return <Clock size={18} className="text-orange-500" />;
      default:
        return <Bell size={18} className="text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'normal':
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-l-4 border-slate-300 bg-slate-50 dark:bg-slate-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isAr ? 'الآن' : 'À l\'instant';
    if (diffMins < 60) return isAr ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`;
    if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
    if (diffDays < 7) return isAr ? `منذ ${diffDays} يوم` : `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="relative" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <Bell size={20} />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-legal-gold" />
                <h3 className="font-bold">
                  {isAr ? 'الإشعارات' : 'Notifications'}
                </h3>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm text-legal-gold hover:underline disabled:opacity-50"
                    title={isAr ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}
                  >
                    <CheckCheck size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-20" />
                  <p>{isAr ? 'لا توجد إشعارات' : 'Aucune notification'}</p>
                </div>
              ) : (
                <div className="divide-y dark:divide-slate-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        !notification.is_read ? getPriorityColor(notification.priority) : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400">
                              {formatTime(notification.created_at)}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                  title={isAr ? 'تحديد كمقروء' : 'Marquer comme lu'}
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded"
                                title={isAr ? 'حذف' : 'Supprimer'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
