/**
 * FileSizeWarning
 * Shows an alert when selected files approach or exceed the per-file or quota limits.
 */
import { bytes } from '@/lib/bytes';
import { Alert, List, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

type Props = {
  files: File[];
  maxFileSize: string;       // e.g. "100mb"
  remainingQuotaBytes?: number | null; // null = unlimited
};

type Warning = { filename: string; reason: string };

export default function FileSizeWarning({ files, maxFileSize, remainingQuotaBytes }: Props) {
  const maxBytes = bytes(maxFileSize);
  const warnings: Warning[] = [];

  for (const file of files) {
    if (file.size > maxBytes) {
      warnings.push({
        filename: file.name,
        reason: `exceeds max file size (${bytes(file.size)} > ${maxFileSize})`,
      });
    } else if (remainingQuotaBytes !== null && remainingQuotaBytes !== undefined) {
      if (file.size > remainingQuotaBytes) {
        warnings.push({
          filename: file.name,
          reason: `would exceed your storage quota (${bytes(file.size)} needed, ${bytes(remainingQuotaBytes)} remaining)`,
        });
      } else if (file.size > remainingQuotaBytes * 0.9) {
        warnings.push({
          filename: file.name,
          reason: `you are close to your storage quota (${bytes(remainingQuotaBytes)} remaining)`,
        });
      }
    }
  }

  if (!warnings.length) return null;

  return (
    <Alert
      color='yellow'
      icon={<IconAlertTriangle size='1rem' />}
      title='File size warning'
      mt='sm'
    >
      <List size='sm' spacing={4}>
        {warnings.map((w, i) => (
          <List.Item key={i}>
            <Text fw={600} span>
              {w.filename}
            </Text>{' '}
            — {w.reason}
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
