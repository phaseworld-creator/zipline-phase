import DashboardTroll from '@/components/pages/troll';
import { useTitle } from '@/lib/client/hooks/useTitle';

export function Component() {
  useTitle('Troll');

  return <DashboardTroll />;
}

Component.displayName = 'Dashboard/Admin/Troll';
