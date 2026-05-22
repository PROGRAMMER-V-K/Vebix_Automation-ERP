/**
 * Attendance hook — real-time Firestore subscription, clock in/out, reset today.
 */
import { useCallback, useEffect, useState } from 'react';

import {
  deleteTodayAttendanceRecord,
  migrateLocalAttendanceToFirestore,
  subscribeToAttendance,
  upsertAttendanceRecord,
} from '@/lib/attendance-firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { toDateKey } from '@/lib/attendance-utils';
import { useAuthUser } from '@/contexts/auth-context';
import { AttendanceRecord } from '@/types/attendance';

export function useAttendance() {
  const { id: userId } = useAuthUser();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayKey = toDateKey();
  const todayRecord = records.find((r) => r.date === todayKey) ?? null;

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError(
        'Firebase is not configured. Create a .env file with your EXPO_PUBLIC_FIREBASE_* keys.',
      );
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    async function start() {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        await migrateLocalAttendanceToFirestore(userId);
        unsubscribe = subscribeToAttendance(
          userId,
          (next) => {
            setRecords(next);
            setError(null);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          },
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attendance.');
        setLoading(false);
      }
    }

    start();

    return () => {
      unsubscribe?.();
    };
  }, [userId]);

  const clockIn = useCallback(async () => {
    if (!userId) return { ok: false as const, message: 'Not signed in.' };
    if (todayRecord?.checkIn) return { ok: false as const, message: 'Already checked in today.' };

    const entry: AttendanceRecord = {
      date: todayKey,
      checkIn: new Date().toISOString(),
      checkOut: null,
      status: 'checked-in',
    };

    try {
      await upsertAttendanceRecord(entry, userId);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to check in.',
      };
    }
  }, [todayKey, todayRecord, userId]);

  const clockOut = useCallback(async () => {
    if (!userId) return { ok: false as const, message: 'Not signed in.' };
    if (!todayRecord?.checkIn) {
      return { ok: false as const, message: 'Check in first before checking out.' };
    }
    if (todayRecord.checkOut) {
      return { ok: false as const, message: 'Already checked out today.' };
    }

    const entry: AttendanceRecord = {
      ...todayRecord,
      checkOut: new Date().toISOString(),
      status: 'completed',
    };

    try {
      await upsertAttendanceRecord(entry, userId);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to check out.',
      };
    }
  }, [todayRecord, userId]);

  const resetToday = useCallback(async () => {
    if (!userId) return { ok: false as const, message: 'Not signed in.' };
    if (!todayRecord) {
      return { ok: false as const, message: 'No attendance record for today.' };
    }

    try {
      await deleteTodayAttendanceRecord(todayKey, userId);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Failed to reset today.',
      };
    }
  }, [todayKey, todayRecord, userId]);

  return {
    records,
    todayRecord,
    loading,
    error,
    clockIn,
    clockOut,
    resetToday,
    isConfigured: isFirebaseConfigured(),
  };
}
