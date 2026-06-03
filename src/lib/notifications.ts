import type { Notification, NotificationType } from '../types';

const STORAGE_KEY = 'sso_notifications';

// Helper to generate UUIDs for notifications
const generateUUID = () =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Seed notifications for demo
const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-director',
    type: 'approval_needed' as NotificationType,
    title: 'หนังสือรับใหม่รอการอนุมัติ',
    message: 'มีหนังสือรับใหม่ เลขที่ ศธ ๐๔๐๐๒/๒๕๓ รอการอนุมัติ',
    is_read: false,
    related_doc_id: 'doc-2',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  },
  {
    id: 'notif-2',
    user_id: 'all',
    type: 'new_circular' as NotificationType,
    title: 'หนังสือเวียนใหม่',
    message: 'หนังสือเวียนใหม่: คำสั่งแต่งตั้งกรรมการวันไหว้ครู',
    is_read: false,
    related_doc_id: 'doc-4',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'notif-3',
    user_id: 'user-registrar',
    type: 'document_approved' as NotificationType,
    title: 'เอกสารได้รับการอนุมัติ',
    message: 'เอกสาร SAR ได้รับการอนุมัติแล้ว',
    is_read: false,
    related_doc_id: 'doc-3',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

function getNotificationsFromStorage(): Notification[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
    return SEED_NOTIFICATIONS;
  }
  return JSON.parse(data) as Notification[];
}

function saveNotificationsToStorage(notifications: Notification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    const all = getNotificationsFromStorage();
    return all
      .filter((n) => n.user_id === userId || n.user_id === 'all')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter((n) => !n.is_read).length;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const all = getNotificationsFromStorage();
    const index = all.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      all[index].is_read = true;
      saveNotificationsToStorage(all);
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const all = getNotificationsFromStorage();
    for (const n of all) {
      if (n.user_id === userId || n.user_id === 'all') {
        n.is_read = true;
      }
    }
    saveNotificationsToStorage(all);
  },

  async createNotification(
    notification: Omit<Notification, 'id' | 'created_at'>
  ): Promise<Notification> {
    const all = getNotificationsFromStorage();
    const newNotification: Notification = {
      ...notification,
      id: 'notif-' + generateUUID(),
      created_at: new Date().toISOString(),
    };
    all.push(newNotification);
    saveNotificationsToStorage(all);
    return newNotification;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const all = getNotificationsFromStorage();
    const filtered = all.filter((n) => n.id !== notificationId);
    saveNotificationsToStorage(filtered);
  },
};
