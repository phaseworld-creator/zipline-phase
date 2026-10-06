import useServerSettings from '@/components/pages/serverSettings/useServerSettings';
import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export default function AnnouncementBanner() {
  const { data } = useServerSettings();
  const [dismissed, setDismissed] = useState(false);

  const announcement = data?.settings?.websiteAnnouncement;

  // Reset dismissed state when announcement changes
  useEffect(() => {
    if (announcement) {
      const stored = sessionStorage.getItem('announcement-dismissed');
      if (stored !== announcement) {
        // Use setTimeout to avoid synchronous setState in effect
        const timer = setTimeout(() => setDismissed(false), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [announcement]);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('announcement-dismissed', announcement);
  };

  return (
    <Alert
      variant='light'
      color='blue'
      title='Announcement'
      icon={<IconInfoCircle />}
      withCloseButton
      closeButtonLabel='Dismiss'
      onClose={handleDismiss}
      mb='md'
      styles={{
        root: {
          borderLeft: '4px solid var(--mantine-color-blue-6)',
        },
      }}
    >
      {announcement}
    </Alert>
  );
}
