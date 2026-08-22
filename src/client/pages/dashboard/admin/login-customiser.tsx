import LoginCustomiser from '@/components/pages/loginCustomiser';
import { useTitle } from '@/lib/client/hooks/useTitle';

export function Component() {
  useTitle('Login Customiser');
  return <LoginCustomiser />;
}

Component.displayName = 'Dashboard/Admin/LoginCustomiser';
