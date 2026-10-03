/**
 * Utility functions for session and timetable time calculations
 */

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const parts = timeStr.split(':');
  let h = parseInt(parts[0] || '0', 10);
  let m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) h = 10;
  if (isNaN(m)) m = 0;

  let totalMinutes = h * 60 + m + minutesToAdd;
  if (totalMinutes < 0) totalMinutes = 0;
  if (totalMinutes >= 24 * 60) totalMinutes = 23 * 60 + 59;

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH < 10 ? '0' : ''}${newH}:${newM < 10 ? '0' : ''}${newM}`;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  return addMinutesToTime(startTime, durationMinutes);
}
