/** Wraps all dashboard routes with sidebar / mobile nav via DashboardLayout. */
import { Slot } from 'expo-router';

import { DashboardLayout } from '@/components/horizon/dashboard-layout';

export default function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Slot />
    </DashboardLayout>
  );
}
