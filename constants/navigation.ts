/**
 * Shared sidebar and home screen navigation items.
 * Single source of truth for routes and Material icon names.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Inventory', href: '/inventory', icon: 'inventory-2' },
  { label: 'Sales', href: '/sales', icon: 'point-of-sale' },
  { label: 'Finance', href: '/finance', icon: 'account-balance-wallet' },
  { label: 'HR', href: '/hr', icon: 'groups' },
  { label: 'Attendance', href: '/attendance', icon: 'event-available' },
];

export const HOME_DEPARTMENTS = [
  { title: 'Inventory management', route: '/inventory', icon: 'inventory-2' as const },
  { title: 'Sales management', route: '/sales', icon: 'point-of-sale' as const },
  { title: 'Finance management', route: '/finance', icon: 'account-balance-wallet' as const },
  { title: 'HR management', route: '/hr', icon: 'groups' as const },
  { title: 'Attendance system', route: '/attendance', icon: 'event-available' as const },
];
