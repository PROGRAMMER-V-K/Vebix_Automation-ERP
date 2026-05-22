/** Route: / — ERP home with department cards. */
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DepartmentCard } from '@/components/horizon/department-card';
import { APP_BRAND, HorizonColors } from '@/constants/horizon';
import { HOME_DEPARTMENTS } from '@/constants/navigation';
import { useAuthUser } from '@/contexts/auth-context';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to {APP_BRAND.name} ERP, {user.name}</Text>
      <Text style={styles.subtitle}>
        Click a link below to access a department&apos;s workspace.
      </Text>

      <View style={styles.cards}>
        {HOME_DEPARTMENTS.map((dept) => (
          <DepartmentCard
            key={dept.route}
            title={dept.title}
            icon={dept.icon}
            onPress={() => router.push(dept.route as '/')}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: HorizonColors.text,
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: HorizonColors.textMuted,
    marginBottom: 32,
    lineHeight: 22,
  },
  cards: {
    gap: 0,
  },
});
