import { useTitle } from '@/lib/client/hooks/useTitle';
import StorageDashboard from '@/components/pages/dashboard/StorageDashboard';

export function Component() {
  useTitle('Storage');
  return <StorageDashboard />;
}

Component.displayName = 'Dashboard/Storage';
