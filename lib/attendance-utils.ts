/**
 * Pure functions for attendance: date keys, formatting, hours worked, weekly counts.
 */
import { AttendanceRecord } from '@/types/attendance';

const STORAGE_KEY = '@vebix/attendance';

export function getStorageKey() {
  return STORAGE_KEY;
}

export function toDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getHoursWorked(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function countPresentThisWeek(records: AttendanceRecord[]): number {
  const weekStart = getWeekStart();
  const weekStartKey = toDateKey(weekStart);

  return records.filter(
    (r) => r.date >= weekStartKey && (r.status === 'checked-in' || r.status === 'completed'),
  ).length;
}

export function sortRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}
