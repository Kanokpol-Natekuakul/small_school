import { describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from './notifications';

describe('notificationService', () => {
  beforeEach(() => {
    localStorage.setItem('sso_notifications', JSON.stringify([]));
  });

  it('initializes with seed notifications if localStorage is empty', async () => {
    localStorage.clear();
    const list = await notificationService.getNotifications('user-director');
    expect(list.length).toBeGreaterThan(0);
    // Seed 1 is for director
    expect(list.some(n => n.user_id === 'user-director')).toBe(true);
  });

  it('creates a new notification', async () => {
    const newNotif = await notificationService.createNotification({
      user_id: 'test-user',
      type: 'new_document',
      title: 'เอกสารทดสอบ',
      message: 'นี่คือข้อความการแจ้งเตือนทดสอบ',
      is_read: false,
      related_doc_id: 'doc-999',
    });

    expect(newNotif.id).toBeDefined();
    expect(newNotif.created_at).toBeDefined();

    const list = await notificationService.getNotifications('test-user');
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('เอกสารทดสอบ');
  });

  it('retrieves notifications sorted by date desc', async () => {
    const userId = 'sort-user';
    
    // Create notifications with slight delay to ensure different timestamps
    await notificationService.createNotification({
      user_id: userId,
      type: 'new_document',
      title: 'ข้อความแรก',
      message: 'แรกสุด',
      is_read: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await notificationService.createNotification({
      user_id: userId,
      type: 'new_circular',
      title: 'ข้อความสอง',
      message: 'สองสุด',
      is_read: false,
    });

    const list = await notificationService.getNotifications(userId);
    expect(list.length).toBe(2);
    // The most recently created should be first (n2)
    expect(list[0].title).toBe('ข้อความสอง');
    expect(list[1].title).toBe('ข้อความแรก');
  });

  it('calculates unread count correctly', async () => {
    const userId = 'count-user';
    
    await notificationService.createNotification({
      user_id: userId,
      type: 'new_document',
      title: 'Unread 1',
      message: '1',
      is_read: false,
    });

    const readNotif = await notificationService.createNotification({
      user_id: userId,
      type: 'new_document',
      title: 'Read 2',
      message: '2',
      is_read: false,
    });

    await notificationService.markAsRead(readNotif.id);

    const count = await notificationService.getUnreadCount(userId);
    expect(count).toBe(1);
  });

  it('marks single notification as read', async () => {
    const userId = 'read-user';
    const notif = await notificationService.createNotification({
      user_id: userId,
      type: 'new_document',
      title: 'Unread',
      message: 'x',
      is_read: false,
    });

    expect(notif.is_read).toBe(false);
    await notificationService.markAsRead(notif.id);

    const list = await notificationService.getNotifications(userId);
    expect(list[0].is_read).toBe(true);
  });

  it('marks all notifications as read for a user', async () => {
    const userId = 'read-all-user';
    await notificationService.createNotification({
      user_id: userId,
      type: 'new_document',
      title: 'Unread 1',
      message: '1',
      is_read: false,
    });
    await notificationService.createNotification({
      user_id: userId,
      type: 'new_document',
      title: 'Unread 2',
      message: '2',
      is_read: false,
    });

    let count = await notificationService.getUnreadCount(userId);
    expect(count).toBe(2);

    await notificationService.markAllAsRead(userId);

    count = await notificationService.getUnreadCount(userId);
    expect(count).toBe(0);
  });

  it('deletes a notification', async () => {
    const userId = 'delete-user';
    const notif = await notificationService.createNotification({
      user_id: userId,
      type: 'new_document',
      title: 'To Delete',
      message: 'x',
      is_read: false,
    });

    let list = await notificationService.getNotifications(userId);
    expect(list.length).toBe(1);

    await notificationService.deleteNotification(notif.id);

    list = await notificationService.getNotifications(userId);
    expect(list.length).toBe(0);
  });
});
