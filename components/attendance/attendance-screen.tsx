/**
 * Attendance workspace — clock in/out, today's status, stats, history from Firestore.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { useAuthUser } from '@/contexts/auth-context';
import { useAttendance } from '@/hooks/use-attendance';
import {
  countPresentThisWeek,
  formatDisplayDate,
  formatHours,
  formatTime,
  getHoursWorked,
  toDateKey,
} from '@/lib/attendance-utils';
import { AttendanceRecord } from '@/types/attendance';

function StatusBadge({ status }: { status: AttendanceRecord['status'] | 'not-started' }) {
  const config = {
    'not-started': { label: 'Not checked in', bg: HorizonColors.warningLight, color: HorizonColors.warning },
    'checked-in': { label: 'On duty', bg: HorizonColors.primaryLight, color: HorizonColors.primary },
    completed: { label: 'Completed', bg: HorizonColors.successLight, color: HorizonColors.success },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <MaterialIcons name={icon} size={20} color={HorizonColors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({ record }: { record: AttendanceRecord }) {
  const hours =
    record.checkIn && record.checkOut
      ? formatHours(getHoursWorked(record.checkIn, record.checkOut))
      : record.checkIn
        ? 'In progress'
        : '—';

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyDate}>
          {new Date(`${record.date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.historyTimes}>
          {record.checkIn ? formatTime(record.checkIn) : '—'}
          {' → '}
          {record.checkOut ? formatTime(record.checkOut) : '—'}
        </Text>
      </View>
      <View style={styles.historyRight}>
        <StatusBadge status={record.status} />
        <Text style={styles.historyHours}>{hours}</Text>
      </View>
    </View>
  );
}

export function AttendanceScreen() {
  const user = useAuthUser();
  const { records, todayRecord, loading, error, isConfigured, clockIn, clockOut, resetToday } =
    useAttendance();
  const [actionLoading, setActionLoading] = useState(false);

  const status = todayRecord?.status ?? 'not-started';
  const canCheckIn = !todayRecord?.checkIn;
  const canCheckOut = todayRecord?.checkIn && !todayRecord?.checkOut;

  const hoursToday =
    todayRecord?.checkIn && todayRecord?.checkOut
      ? formatHours(getHoursWorked(todayRecord.checkIn, todayRecord.checkOut))
      : todayRecord?.checkIn
        ? 'In progress'
        : '0h';

  const weekPresent = countPresentThisWeek(records);
  const history = records.filter((r) => r.date !== toDateKey()).slice(0, 14);

  async function handleClockIn() {
    setActionLoading(true);
    const result = await clockIn();
    setActionLoading(false);
    if (!result.ok) Alert.alert('Check in', result.message);
  }

  async function handleClockOut() {
    setActionLoading(true);
    const result = await clockOut();
    setActionLoading(false);
    if (!result.ok) Alert.alert('Check out', result.message);
  }

  function handleResetToday() {
    Alert.alert(
      'Reset today',
      'Clear today\'s check-in and check-out? You can clock in again after this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const result = await resetToday();
            setActionLoading(false);
            if (result.ok) {
              Alert.alert('Done', 'Today\'s attendance has been reset.');
            } else {
              Alert.alert('Reset failed', result.message);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={HorizonColors.primary} />
      </View>
    );
  }

  if (!isConfigured || error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Attendance system</Text>
        <View style={styles.errorCard}>
          <MaterialIcons name="cloud-off" size={32} color={HorizonColors.warning} />
          <Text style={styles.errorTitle}>Firebase not connected</Text>
          <Text style={styles.errorText}>
            {error ??
              'Add your Firebase config to a .env file (see .env.example), then restart Expo.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance system</Text>
      <Text style={styles.subtitle}>
        Track check-in, check-out, and work hours for {user.name}. Saved to Firebase.
      </Text>

      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <View>
            <Text style={styles.todayLabel}>Today</Text>
            <Text style={styles.todayDate}>{formatDisplayDate(toDateKey())}</Text>
          </View>
          <StatusBadge status={status} />
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <MaterialIcons name="login" size={20} color={HorizonColors.primary} />
            <Text style={styles.timeLabel}>Check in</Text>
            <Text style={styles.timeValue}>
              {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : '—'}
            </Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeBlock}>
            <MaterialIcons name="logout" size={20} color={HorizonColors.primary} />
            <Text style={styles.timeLabel}>Check out</Text>
            <Text style={styles.timeValue}>
              {todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleClockIn}
            disabled={!canCheckIn || actionLoading}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.checkInBtn,
              (!canCheckIn || actionLoading) && styles.actionBtnDisabled,
              pressed && canCheckIn && styles.actionBtnPressed,
            ]}>
            <MaterialIcons name="login" size={20} color={HorizonColors.white} />
            <Text style={styles.actionBtnText}>Clock in</Text>
          </Pressable>
          <Pressable
            onPress={handleClockOut}
            disabled={!canCheckOut || actionLoading}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.checkOutBtn,
              (!canCheckOut || actionLoading) && styles.actionBtnDisabled,
              pressed && canCheckOut && styles.actionBtnPressed,
            ]}>
            <MaterialIcons name="logout" size={20} color={HorizonColors.white} />
            <Text style={styles.actionBtnText}>Clock out</Text>
          </Pressable>
        </View>

        {todayRecord ? (
          <Pressable
            onPress={handleResetToday}
            disabled={actionLoading}
            style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}>
            <MaterialIcons name="refresh" size={18} color={HorizonColors.warning} />
            <Text style={styles.resetBtnText}>Reset today&apos;s attendance</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Days this week" value={String(weekPresent)} icon="calendar-today" />
        <StatCard label="Hours today" value={hoursToday} icon="schedule" />
      </View>

      <Text style={styles.sectionTitle}>Recent attendance</Text>
      <View style={styles.historyCard}>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>No past records yet. Clock in to start tracking.</Text>
        ) : (
          history.map((record, index) => (
            <View key={record.date}>
              <HistoryRow record={record} />
              {index < history.length - 1 ? <View style={styles.historyDivider} /> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: HorizonColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: HorizonColors.textMuted,
    marginBottom: 24,
    lineHeight: 22,
  },
  todayCard: {
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    backgroundColor: HorizonColors.background,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  todayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  todayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  timeDivider: {
    width: 1,
    backgroundColor: HorizonColors.border,
    marginHorizontal: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: HorizonColors.textMuted,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: HorizonColors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  checkInBtn: {
    backgroundColor: HorizonColors.primary,
  },
  checkOutBtn: {
    backgroundColor: HorizonColors.primaryDark,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnPressed: {
    opacity: 0.88,
  },
  actionBtnText: {
    color: HorizonColors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
  },
  resetBtnPressed: {
    opacity: 0.7,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: HorizonColors.warning,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 12,
    padding: 16,
    backgroundColor: HorizonColors.primaryLight,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: HorizonColors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: HorizonColors.textMuted,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: HorizonColors.text,
    marginBottom: 12,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 12,
    padding: 4,
    backgroundColor: HorizonColors.background,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: HorizonColors.text,
    marginBottom: 4,
  },
  historyTimes: {
    fontSize: 13,
    color: HorizonColors.textMuted,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyHours: {
    fontSize: 13,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  historyDivider: {
    height: 1,
    backgroundColor: HorizonColors.border,
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: HorizonColors.textMuted,
    textAlign: 'center',
    padding: 24,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: HorizonColors.warningLight,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  errorText: {
    fontSize: 14,
    color: HorizonColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
