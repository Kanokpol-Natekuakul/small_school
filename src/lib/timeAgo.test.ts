import { describe, it, expect } from 'vitest';
import { timeAgo } from './timeAgo';

describe('timeAgo helper utility', () => {
  it('returns "เมื่อสักครู่" for times less than 1 minute ago', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('เมื่อสักครู่');
  });

  it('returns "X นาทีที่แล้ว" for times less than 1 hour ago', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(timeAgo(tenMinutesAgo)).toBe('10 นาทีที่แล้ว');
  });

  it('returns "X ชั่วโมงที่แล้ว" for times less than 24 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe('3 ชั่วโมงที่แล้ว');
  });

  it('returns "เมื่อวาน" for yesterday', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(yesterday)).toBe('เมื่อวาน');
  });

  it('returns "X วันที่แล้ว" for 2-7 days ago', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(fourDaysAgo)).toBe('4 วันที่แล้ว');
  });

  it('returns formatted date for times older than 7 days', () => {
    const specificDate = new Date('2026-05-15T10:00:00Z');
    const formatted = timeAgo(specificDate.toISOString());
    // 2026 is BE 2569
    expect(formatted).toBe('15/5/2569');
  });
});
