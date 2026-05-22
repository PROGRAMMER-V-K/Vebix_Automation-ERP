/**
 * Desktop sidebar — brand, department navigation, expense CTA, user profile, logout.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_BRAND, HorizonColors, HorizonSpacing } from '@/constants/horizon';
import { NAV_ITEMS, type NavItem } from '@/constants/navigation';
import { useAuthUser } from '@/contexts/auth-context';
import { useSignOut } from '@/hooks/use-sign-out';

function BrandLogo() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoIcon}>
        <MaterialIcons name="business" size={22} color={HorizonColors.white} />
      </View>
      <Text style={styles.logoText} numberOfLines={2}>
        {APP_BRAND.name}
      </Text>
    </View>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive =
    item.href === '/'
      ? pathname === '/' || pathname === '/index'
      : pathname.startsWith(item.href);

  return (
    <Pressable
      onPress={() => router.push(item.href as '/')}
      style={[styles.navItem, isActive && styles.navItemActive]}>
      <MaterialIcons
        name={item.icon}
        size={22}
        color={isActive ? HorizonColors.primary : HorizonColors.text}
      />
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
    </Pressable>
  );
}

export function Sidebar() {
  const user = useAuthUser();
  const { signOut } = useSignOut();

  return (
    <View style={styles.sidebar}>
      <View style={styles.header}>
        <BrandLogo />
        <Pressable style={styles.collapseBtn} hitSlop={8}>
          <MaterialIcons name="menu-open" size={22} color={HorizonColors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.expenseBtn}>
          <MaterialIcons name="add" size={20} color={HorizonColors.white} />
          <Text style={styles.expenseBtnText}>Add an expense</Text>
        </Pressable>

        <Pressable style={styles.userRow} onPress={signOut}>
          <Image
            source={{
              uri: user.photoUrl ?? `https://i.pravatar.cc/80?u=${user.id}`,
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          <MaterialIcons name="logout" size={20} color={HorizonColors.textMuted} />
        </Pressable>

        <Pressable style={styles.logoutBtnDesktop} onPress={signOut}>
          <MaterialIcons name="logout" size={18} color={HorizonColors.white} />
          <Text style={styles.logoutBtnDesktopText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: HorizonSpacing.sidebarWidth,
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor: HorizonColors.sidebar,
    borderRightWidth: 1,
    borderRightColor: HorizonColors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: HorizonColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: HorizonColors.text,
    lineHeight: 18,
  },
  collapseBtn: {
    padding: 4,
  },
  nav: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: HorizonColors.primaryLight,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: HorizonColors.text,
  },
  navLabelActive: {
    color: HorizonColors.primary,
    fontWeight: '600',
  },
  footer: {
    gap: 16,
    marginTop: 24,
  },
  expenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: HorizonColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  expenseBtnText: {
    color: HorizonColors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  userEmail: {
    fontSize: 12,
    color: HorizonColors.textMuted,
  },
  logoutBtnDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: HorizonColors.primary,
  },
  logoutBtnDesktopText: {
    color: HorizonColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
