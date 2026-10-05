import SettingsEmbedBuilder from '@/components/pages/settings/parts/SettingsEmbedBuilder';
import { useTitle } from '@/lib/client/hooks/useTitle';

export function Component() {
  useTitle('Embed Builder');

  return <SettingsEmbedBuilder />;
}

Component.displayName = 'Dashboard/Admin/EmbedBuilder';
