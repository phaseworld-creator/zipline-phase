import { useTitle } from '@/lib/client/hooks/useTitle';
import UploadTokensManager from '@/components/pages/dashboard/UploadTokensManager';

export function Component() {
  useTitle('Upload Tokens');
  return <UploadTokensManager />;
}

Component.displayName = 'Dashboard/UploadTokens';
