/**
 * Convert an ISO date string into a Thai relative time string.
 */
export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'เมื่อสักครู่';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} นาทีที่แล้ว`;
  }

  if (diffHours < 24) {
    return `${diffHours} ชั่วโมงที่แล้ว`;
  }

  if (diffDays === 1) {
    return 'เมื่อวาน';
  }

  if (diffDays <= 7) {
    return `${diffDays} วันที่แล้ว`;
  }

  // For older dates, return formatted date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543; // Buddhist Era
  return `${day}/${month}/${year}`;
}
