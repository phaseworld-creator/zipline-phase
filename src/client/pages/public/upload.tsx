import { useConfig } from '@/components/ConfigProvider';
import { bytes } from '@/lib/bytes';
import { useUploadOptionsStore } from '@/lib/client/store/uploadOptions';
import { useProgress } from '@/lib/client/upload/useProgress';
import {
  Button,
  Collapse,
  Grid,
  Group,
  Paper,
  Progress,
  Text,
  Title,
  rem,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications, showNotification } from '@mantine/notifications';
import { IconDeviceSdCard, IconUpload, IconX } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/shallow';

const initialVisible = 24;

export default function PublicUpload() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const config = useConfig();

  const [_options] = useUploadOptionsStore(
    useShallow((state) => [state.options]),
  );

  const [files, setFiles] = useState<File[]>([]);
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [progress, setProgress] = useProgress();
  const [dropLoading, _setLoading] = useState(false);

  const visibleFiles = files.slice(0, visibleCount);
  const hiddenFiles = Math.max(0, files.length - visibleFiles.length);

  const aggSize = useCallback(() => files.reduce((acc, file) => acc + file.size, 0), [files]);

  const upload = async () => {
    const maxBytes = config.chunks.enabled && bytes(config.chunks.max);
    const normalUploads: File[] = maxBytes ? files.filter((file) => file.size < maxBytes) : files;

    if (normalUploads.length > 0) {
      const size = normalUploads.reduce((acc, file) => acc + file.size, 0);
      if (size > bytes(config.files.maxFileSize)) {
        notifications.show({
          title: 'Upload may fail',
          color: 'yellow',
          message: (
            <>
              The upload may fail because the total size is <b>{bytes(size)}</b>, which is larger than the
              limit of <b>{bytes(bytes(config.files.maxFileSize))}</b>
            </>
          ),
        });
      }

      const body = new FormData();
      for (const file of normalUploads) body.append('file', file);

      const req = new XMLHttpRequest();
      req.upload.addEventListener('progress', (e) => {
        if (!e.lengthComputable) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress({ percent, speed: 0, remaining: 0 });
      });

      await new Promise<void>((resolve, reject) => {
        req.addEventListener('load', () => resolve());
        req.addEventListener('error', () => reject(new Error('Upload failed')));
        req.open('POST', '/api/public/upload');
        req.send(body);
      });

      setFiles([]);
      setProgress({ percent: 0, speed: 0, remaining: 0 });
      showNotification({ message: 'Upload complete', color: 'green' });
    }
  };

  if (!config) return null;

  return (
    <>
      <Title order={1}>Community Upload</Title>
      <Text c='dimmed' mb='md'>
        Upload files to the community portal. Files are anonymous and subject to server limits.
      </Text>

      <Dropzone
        onDrop={(f) => {
          setFiles((prev) => [...f, ...prev]);
          setVisibleCount(initialVisible);
        }}
        my='sm'
        loading={dropLoading}
        disabled={dropLoading}
        style={{ zIndex: 1 }}
      >
        <Group justify='center' gap='xl' style={{ minHeight: rem(220), pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              size='3.2rem'
              stroke={1.5}
              color={theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6]}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size='3.2rem' stroke={1.5} color={theme.colors.red[colorScheme === 'dark' ? 4 : 6]} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconDeviceSdCard size='3.2rem' stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size='xl' inline>
              Drag files here or click to select
            </Text>
            <Text size='sm' c='dimmed' mt={7}>
              <b>{bytes(bytes(config.files.maxFileSize))}</b> limit per file
            </Text>
          </div>
        </Group>
      </Dropzone>

      <Collapse expanded={progress.percent > 0 && progress.percent < 100}>
        {progress.percent > 0 && progress.percent < 100 && (
          <Progress.Root my='sm' size='xl'>
            <Progress.Section value={progress.percent} animated>
              <Progress.Label>{Math.floor(progress.percent)}%</Progress.Label>
            </Progress.Section>
          </Progress.Root>
        )}
      </Collapse>

      <Grid grow my='sm'>
        {visibleFiles.map((file, i) => (
          <Grid.Col span={3} key={i}>
            <Paper withBorder p='md' radius='md'>
              <Text size='md' ff='monospace'>
                {file.name}
              </Text>
              <Text size='sm' c='dimmed'>
                {bytes(file.size)}
              </Text>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      {hiddenFiles > 0 && (
        <Group justify='center' gap='xs' my='xs'>
          <Text size='sm' c='dimmed'>
            {hiddenFiles} more file{hiddenFiles !== 1 && 's'} hidden{' '}
          </Text>
          <Button
            size='compact-sm'
            variant='light'
            disabled={dropLoading}
            onClick={() => setVisibleCount((prev) => Math.min(files.length, prev + initialVisible))}
          >
            Show more
          </Button>
        </Group>
      )}

      <Group justify='right' gap='sm' my='md'>
        <Button
          variant='outline'
          color='red'
          leftSection={<IconX size='1rem' />}
          disabled={files.length === 0 || dropLoading}
          onClick={() => {
            setFiles([]);
            setVisibleCount(initialVisible);
          }}
        >
          Clear all
        </Button>
        <Button
          variant='outline'
          leftSection={<IconUpload size='1rem' />}
          disabled={files.length === 0 || dropLoading}
          onClick={upload}
        >
          Upload {files.length} file{files.length !== 1 && 's'} ({bytes(aggSize())})
        </Button>
      </Group>
    </>
  );
}
