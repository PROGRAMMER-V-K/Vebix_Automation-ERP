/**
 * Dashboard shell — sidebar on wide screens (>=768px), mobile top nav on phones.
 */
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileNav } from '@/components/horizon/mobile-nav';
import { Sidebar } from '@/components/horizon/sidebar';
import { HorizonColors } from '@/constants/horizon';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;

  if (isWide) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Sidebar />
        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.mainContentWide}
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentWide}>{children}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.rootMobile, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <MobileNav />
      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.mainContentMobile}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentMobile}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: HorizonColors.background,
  },
  rootMobile: {
    flex: 1,
    backgroundColor: HorizonColors.background,
  },
  main: {
    flex: 1,
    backgroundColor: HorizonColors.background,
  },
  mainContentWide: {
    flexGrow: 1,
  },
  mainContentMobile: {
    flexGrow: 1,
  },
  contentWide: {
    flex: 1,
    paddingHorizontal: 48,
    paddingVertical: 40,
    maxWidth: 1280,
  },
  contentMobile: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
});
