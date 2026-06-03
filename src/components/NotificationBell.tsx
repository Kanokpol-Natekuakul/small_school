import React, { useState, useEffect, useRef } from 'react';
import { Bell, FileDown, CheckCircle, FileText, X, Circle } from 'lucide-react';
import { notificationService } from '../lib/notifications';
import { timeAgo } from '../lib/timeAgo';
import type { Notification, Profile } from '../types';

interface NotificationBellProps {
  currentUser: Profile;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const list = await notificationService.getNotifications(currentUser.id);
      const count = await notificationService.getUnreadCount(currentUser.id);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Poll notifications every 30 seconds for demo
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(currentUser.id);
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    try {
      if (!notif.is_read) {
        await notificationService.markAsRead(notif.id);
        await loadNotifications();
      }
      // In a real app, you would navigate to the related document page, e.g.:
      // if (notif.related_doc_id) { navigateToDoc(notif.related_doc_id); }
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_document':
      case 'approval_needed':
        return <FileDown className="h-4 w-4 text-blue-500" />;
      case 'document_approved':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'new_circular':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all relative cursor-pointer"
        aria-label="การแจ้งเตือน"
        data-testid="notification-bell-btn"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''}`} />
        {unreadCount > 0 && (
          <span
            data-testid="unread-count-badge"
            className="absolute top-1.5 right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs border border-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Tailwind keyframes injection for wiggle animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wiggle {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(-10deg); }
          30% { transform: rotate(8deg); }
          45% { transform: rotate(-6deg); }
          60% { transform: rotate(4deg); }
          75% { transform: rotate(-2deg); }
        }
      `}} />

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          data-testid="notifications-dropdown"
          className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <span className="font-bold text-slate-800 text-xs md:text-sm">การแจ้งเตือน</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] md:text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  data-testid="notification-item"
                  className={`p-4 hover:bg-slate-50/50 transition-colors cursor-pointer flex gap-3.5 items-start ${
                    !notif.is_read ? 'bg-emerald-50/10' : ''
                  }`}
                >
                  <div className="p-2 bg-white border border-slate-100 rounded-xl shadow-xs shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs text-slate-800 truncate leading-snug ${!notif.is_read ? 'font-bold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <Circle className="h-2 w-2 text-emerald-500 fill-emerald-500 shrink-0" data-testid="unread-indicator" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-slate-400 block pt-1">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center" data-testid="empty-notifications">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-medium">ไม่มีการแจ้งเตือนในขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
