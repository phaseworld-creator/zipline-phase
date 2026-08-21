import DashboardThemeMaker from '@/components/pages/themeMaker';
import { useTitle } from '@/lib/client/hooks/useTitle';

export function Component() {
  useTitle('Theme Maker');

  return <DashboardThemeMaker />;
}

Component.displayName = 'Dashboard/Admin/ThemeMaker';
