import DashboardApiDocs from '@/components/pages/apiDocs';
import { useTitle } from '@/lib/client/hooks/useTitle';

export function Component() {
  useTitle('API Reference');

  return <DashboardApiDocs />;
}

Component.displayName = 'Dashboard/Admin/ApiDocs';
