/**
 * Attendance record types stored in Firestore under users/{uid}/attendance/{date}.
 */
export type AttendanceDayStatus = 'not-started' | 'checked-in' | 'completed';

export type AttendanceRecord = {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceDayStatus;
};
