import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from './NotificationBell';
import { notificationService } from '../lib/notifications';
import type { Profile, Notification } from '../types';

// Mock the notifications service
vi.mock('../lib/notifications', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }
}));

// Mock timeAgo helper
vi.mock('../lib/timeAgo', () => ({
  timeAgo: () => '10 นาทีที่แล้ว'
}));

describe('NotificationBell Component', () => {
  const mockUser: Profile = {
    id: 'user-1',
    full_name: 'ครูสมควร ใจดี',
    email: 'teacher@school.ac.th',
    role: 'teacher',
    department_id: 'dept-1',
  };

  const sampleNotifications: Notification[] = [
    {
      id: 'notif-1',
      user_id: 'user-1',
      type: 'new_document',
      title: 'มีหนังสือใหม่',
      message: 'มีหนังสือลงรับใหม่ เลขที่ 123/456',
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      user_id: 'user-1',
      type: 'document_approved',
      title: 'อนุมัติเรียบร้อย',
      message: 'เอกสารได้รับการอนุมัติแล้ว',
      is_read: true,
      created_at: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification bell icon button', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue([]);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0);

    render(<NotificationBell currentUser={mockUser} />);
    
    expect(screen.getByTestId('notification-bell-btn')).toBeInTheDocument();
  });

  it('shows badge when unread notifications exist', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue(sampleNotifications);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);

    render(<NotificationBell currentUser={mockUser} />);

    await waitFor(() => {
      const badge = screen.getByTestId('unread-count-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('1');
    });
  });

  it('does NOT show badge when unread count is 0', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue([]);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0);

    render(<NotificationBell currentUser={mockUser} />);

    await waitFor(() => {
      expect(screen.queryByTestId('unread-count-badge')).not.toBeInTheDocument();
    });
  });

  it('opens dropdown and displays items on click', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue(sampleNotifications);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);

    render(<NotificationBell currentUser={mockUser} />);

    const bellBtn = screen.getByTestId('notification-bell-btn');
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByTestId('notifications-dropdown')).toBeInTheDocument();
      const items = screen.getAllByTestId('notification-item');
      expect(items.length).toBe(2);
      expect(screen.getByText('มีหนังสือใหม่')).toBeInTheDocument();
      expect(screen.getByText('อนุมัติเรียบร้อย')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no notifications', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue([]);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0);

    render(<NotificationBell currentUser={mockUser} />);

    const bellBtn = screen.getByTestId('notification-bell-btn');
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByTestId('empty-notifications')).toBeInTheDocument();
      expect(screen.getByText('ไม่มีการแจ้งเตือนในขณะนี้')).toBeInTheDocument();
    });
  });

  it('calls markAsRead when an unread notification item is clicked', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue(sampleNotifications);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);
    vi.mocked(notificationService.markAsRead).mockResolvedValue(undefined);

    render(<NotificationBell currentUser={mockUser} />);

    const bellBtn = screen.getByTestId('notification-bell-btn');
    fireEvent.click(bellBtn);

    await waitFor(async () => {
      const items = screen.getAllByTestId('notification-item');
      // Click first notification (unread)
      fireEvent.click(items[0]);
      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('calls markAllAsRead when read all button is clicked', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue(sampleNotifications);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue(undefined);

    render(<NotificationBell currentUser={mockUser} />);

    const bellBtn = screen.getByTestId('notification-bell-btn');
    fireEvent.click(bellBtn);

    await waitFor(async () => {
      const markAllBtn = screen.getByRole('button', { name: 'อ่านทั้งหมด' });
      fireEvent.click(markAllBtn);
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });
});
