/**
 * Firestore CRUD for attendance records.
 * Collection path: users/{userId}/attendance/{YYYY-MM-DD}
 * Includes one-time migration from legacy AsyncStorage data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '@firebase/firestore';

import { CURRENT_USER_ID } from '@/constants/user';
import { getStorageKey, sortRecords } from '@/lib/attendance-utils';
import { getFirestoreDb, isFirebaseConfigured } from '@/lib/firebase';
import { AttendanceRecord } from '@/types/attendance';

const MIGRATION_KEY = '@vebix/attendance-migrated-to-firebase';

function attendanceCollection(userId: string) {
  return collection(getFirestoreDb(), 'users', userId, 'attendance');
}

function attendanceDoc(userId: string, date: string) {
  return doc(getFirestoreDb(), 'users', userId, 'attendance', date);
}

function mapDocToRecord(date: string, data: Record<string, unknown>): AttendanceRecord {
  return {
    date,
    checkIn: (data.checkIn as string | null) ?? null,
    checkOut: (data.checkOut as string | null) ?? null,
    status: data.status as AttendanceRecord['status'],
  };
}

export async function fetchAttendanceRecords(
  userId: string = CURRENT_USER_ID,
): Promise<AttendanceRecord[]> {
  const snapshot = await getDocs(attendanceCollection(userId));
  const records = snapshot.docs.map((d) => mapDocToRecord(d.id, d.data()));
  return sortRecords(records);
}

export function subscribeToAttendance(
  userId: string,
  onData: (records: AttendanceRecord[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    attendanceCollection(userId),
    (snapshot) => {
      const records = snapshot.docs.map((d) => mapDocToRecord(d.id, d.data()));
      onData(sortRecords(records));
    },
    (error) => onError(error),
  );
}

export async function deleteTodayAttendanceRecord(
  date: string,
  userId: string = CURRENT_USER_ID,
): Promise<void> {
  await deleteDoc(attendanceDoc(userId, date));
}

export async function upsertAttendanceRecord(
  record: AttendanceRecord,
  userId: string = CURRENT_USER_ID,
): Promise<void> {
  await setDoc(attendanceDoc(userId, record.date), {
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    status: record.status,
    updatedAt: serverTimestamp(),
  });
}

export async function migrateLocalAttendanceToFirestore(
  userId: string = CURRENT_USER_ID,
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_KEY);
  if (alreadyMigrated) return;

  const raw = await AsyncStorage.getItem(getStorageKey());
  if (!raw) {
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  const localRecords = JSON.parse(raw) as AttendanceRecord[];
  if (localRecords.length === 0) {
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  const batch = writeBatch(getFirestoreDb());
  for (const record of localRecords) {
    batch.set(attendanceDoc(userId, record.date), {
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  await AsyncStorage.removeItem(getStorageKey());
  await AsyncStorage.setItem(MIGRATION_KEY, 'true');
}
