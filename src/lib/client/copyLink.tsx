import type { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';

export function copyLink(url: string, clipboard: ReturnType<typeof useClipboard>, target: string = url) {
  clipboard.copy(url);

  notifications.show({
    title: 'Copied link',
    message: (
      <a href={target} target='_blank' rel='noopener noreferrer' style={{ color: 'inherit' }}>
        {url}
      </a>
    ),
    color: 'green',
    icon: <IconCopy size='1rem' />,
  });
}
