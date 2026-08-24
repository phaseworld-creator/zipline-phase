import DashboardFileType from '@/components/file/DashboardFileType';
import { bytes } from '@/lib/bytes';
import {
  Box,
  Button,
  Center,
  Group,
  HoverCard,
  Overlay,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { IconFileUpload, IconTrashFilled } from '@tabler/icons-react';

export default function DropzoneFile({
  file,
  onDelete,
  loading,
  onEdit,
}: {
  loading: boolean;
  file: File;
  onDelete: () => void;
  onEdit?: () => void;
}) {
  if (loading)
    return (
      <Paper withBorder p='md' radius='md' pos='relative'>
        <Overlay radius='md' backgroundOpacity={0.2} />
        <Center h='100%'>
          <Group justify='center' gap='xl'>
            <IconFileUpload size={48} />
            <Text size='md'>{file.name}</Text>
          </Group>
        </Center>
      </Paper>
    );

  return (
    <HoverCard shadow='md' position='top'>
      <HoverCard.Target>
        <Paper withBorder p='md' radius='md' pos='relative' h='100%'>
          <Center h='100%'>
            <Group justify='center' gap='xl'>
              <IconFileUpload size={48} />
              <Text size='md' ff='monospace'>
                {file.name}
              </Text>
            </Group>
          </Center>
        </Paper>
      </HoverCard.Target>
      <HoverCard.Dropdown p='md' maw={480}>
        <Stack gap='sm'>
          <ScrollArea h={240} offsetScrollbars type='auto'>
            <Box w='100%' miw={280} style={{ maxWidth: 'min(92vw, 26rem)' }}>
              <DashboardFileType file={file} show />
            </Box>
          </ScrollArea>

          <Stack gap='xs'>
            <Text size='sm' c='dimmed'>
              <b>{file.name}</b>
              {file.type ? ` (${file.type})` : ''}
            </Text>
            <Text size='sm' c='dimmed'>
              {bytes(file.size)}
            </Text>
            <Group gap='xs'>
              {onEdit && file.type.startsWith('image/') && (
                <Button
                  size='compact-sm'
                  variant='outline'
                  color='blue'
                  style={{ flex: 1 }}
                  onClick={onEdit}
                >
                  Edit
                </Button>
              )}
              <Button
                size='compact-sm'
                variant='outline'
                color='red'
                style={{ flex: 1 }}
                onClick={onDelete}
                leftSection={<IconTrashFilled size='1rem' />}
              >
                Remove
              </Button>
            </Group>
          </Stack>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
