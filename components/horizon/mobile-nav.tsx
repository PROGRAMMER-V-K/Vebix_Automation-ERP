/**
 * Mobile header — horizontal nav chips, logout button, and user sign-out strip.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_BRAND, HorizonColors } from '@/constants/horizon';
import { NAV_ITEMS } from '@/constants/navigation';
import { useAuthUser } from '@/contexts/auth-context';
import { useSignOut } from '@/hooks/use-sign-out';

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthUser();
  const { signOut } = useSignOut();

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Image
            source={{ uri: user.photoUrl ?? `https://i.pravatar.cc/80?u=${user.id}` }}
            style={styles.headerAvatar}
          />
          <View style={styles.logoTextBlock}>
            <Text style={styles.logoText} numberOfLines={1}>
              {APP_BRAND.name}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.name}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.logoutIconBtn, pressed && styles.logoutBtnPressed]}
          hitSlop={8}>
          <MaterialIcons name="logout" size={18} color={HorizonColors.primary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/' || pathname === '/index'
              : pathname.startsWith(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as '/')}
              style={[styles.chip, isActive && styles.chipActive]}>
              <MaterialIcons
                name={item.icon}
                size={18}
                color={isActive ? HorizonColors.primary : HorizonColors.text}
              />
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: HorizonColors.sidebar,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
  },
  logoTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  logoText: {
    fontSize: 15,
    fontWeight: '700',
    color: HorizonColors.text,
  },
  userEmail: {
    fontSize: 11,
    color: HorizonColors.textMuted,
    marginTop: 1,
  },
  logoutIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFBFD',
    borderWidth: 1.5,
    borderColor: HorizonColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoutBtnPressed: {
    opacity: 0.75,
    backgroundColor: '#F1F5F9',
  },
  nav: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: HorizonColors.background,
    borderWidth: 1,
    borderColor: HorizonColors.border,
  },
  chipActive: {
    backgroundColor: HorizonColors.primaryLight,
    borderColor: HorizonColors.primaryLight,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: HorizonColors.text,
  },
  chipLabelActive: {
    color: HorizonColors.primary,
    fontWeight: '600',
  },
});
