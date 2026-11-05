import { fetchApi } from '@/lib/fetchApi';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCopy,
  IconKey,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

type UploadToken = {
  id: string;
  name: string;
  token: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  folderId: string | null;
  createdAt: string;
};

export default function UploadTokensManager() {
  const clipboard = useClipboard();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newExpires, setNewExpires] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: tokens, isLoading } = useSWR<UploadToken[]>(
    '/api/user/upload-tokens',
    (url: string) => fetchApi(url).then((r) => r.data ?? []),
  );

  const createToken = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const body: Record<string, unknown> = { name: newName.trim() };
    if (newMaxUses.trim()) body.maxUses = parseInt(newMaxUses, 10);
    if (newExpires.trim()) body.expiresAt = new Date(newExpires).toISOString();

    const { data, error } = await fetchApi<UploadToken>('/api/user/upload-tokens', 'POST', body);
    setCreating(false);

    if (error) {
      notifications.show({ title: 'Failed to create token', message: error.error, color: 'red' });
    } else {
      notifications.show({ title: 'Token created', message: data!.name, color: 'teal' });
      setCreateOpen(false);
      setNewName('');
      setNewMaxUses('');
      setNewExpires('');
      mutate('/api/user/upload-tokens');
    }
  };

  const deleteToken = async (id: string) => {
    const { error } = await fetchApi(`/api/user/upload-tokens/${id}`, 'DELETE');
    if (error) {
      notifications.show({ title: 'Failed to delete', message: error.error, color: 'red' });
    } else {
      notifications.show({ title: 'Token revoked', color: 'green' });
      mutate('/api/user/upload-tokens');
    }
  };

  const copyToken = (token: string) => {
    clipboard.copy(token);
    notifications.show({ message: 'Token copied to clipboard', color: 'blue' });
  };

  return (
    <Container my='lg' size='md'>
      <Group mb='lg' justify='space-between'>
        <Group gap='xs'>
          <IconKey size='1.4rem' />
          <Title order={2}>Upload Tokens</Title>
        </Group>
        <Button
          leftSection={<IconPlus size='1rem' />}
          size='sm'
          onClick={() => setCreateOpen(true)}
        >
          Create token
        </Button>
      </Group>

      <Text size='sm' c='dimmed' mb='md'>
        Shareable tokens let external tools upload files to your account without your password.
        Use the header <Text ff='monospace' component='span' c='blue'>x-zipline-upload-token</Text> in upload requests.
      </Text>

      {isLoading ? (
        <Text c='dimmed'>Loading…</Text>
      ) : tokens && tokens.length > 0 ? (
        <Stack gap='sm'>
          {tokens.map((t) => {
            const expired = t.expiresAt && new Date(t.expiresAt) < new Date();
            const exhausted = t.maxUses !== null && t.uses >= t.maxUses;
            const active = !expired && !exhausted;

            return (
              <Card key={t.id} withBorder p='sm'>
                <Group justify='space-between' wrap='nowrap'>
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap='xs'>
                      <Text fw={600} size='sm'>{t.name}</Text>
                      <Badge
                        size='xs'
                        color={active ? 'teal' : 'red'}
                        variant='light'
                      >
                        {active ? 'Active' : expired ? 'Expired' : 'Exhausted'}
                      </Badge>
                    </Group>
                    <Group gap='xs' wrap='nowrap'>
                      <Text size='xs' c='dimmed' ff='monospace' style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.token.slice(0, 20)}…
                      </Text>
                      <ActionIcon size='xs' variant='subtle' onClick={() => copyToken(t.token)}>
                        <IconCopy size='0.75rem' />
                      </ActionIcon>
                    </Group>
                    <Group gap='sm' mt={2}>
                      <Text size='xs' c='dimmed'>
                        Uses: {t.uses}{t.maxUses !== null ? ` / ${t.maxUses}` : ' (unlimited)'}
                      </Text>
                      {t.expiresAt && (
                        <Text size='xs' c='dimmed'>
                          Expires: {new Date(t.expiresAt).toLocaleDateString()}
                        </Text>
                      )}
                      {t.folderId && (
                        <Badge size='xs' variant='light'>Folder-locked</Badge>
                      )}
                    </Group>
                  </Stack>
                  <Tooltip label='Revoke token'>
                    <ActionIcon color='red' variant='subtle' onClick={() => deleteToken(t.id)}>
                      <IconTrash size='1rem' />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Card withBorder p='xl'>
          <Text c='dimmed' ta='center'>
            No upload tokens yet. Create one to let external tools upload to your account.
          </Text>
        </Card>
      )}

      <Modal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        title='Create upload token'
        size='sm'
        centered
      >
        <Stack gap='sm'>
          <TextInput
            label='Name'
            placeholder='CI pipeline, bot uploader…'
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            data-autofocus
          />
          <TextInput
            label='Max uses (blank = unlimited)'
            placeholder='100'
            value={newMaxUses}
            onChange={(e) => setNewMaxUses(e.currentTarget.value)}
            type='number'
          />
          <TextInput
            label='Expires at (blank = never)'
            placeholder='2026-12-31'
            value={newExpires}
            onChange={(e) => setNewExpires(e.currentTarget.value)}
            type='date'
          />
          <Button loading={creating} onClick={createToken} disabled={!newName.trim()}>
            Create
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
