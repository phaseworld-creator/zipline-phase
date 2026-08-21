import { useTitle } from '@/lib/client/hooks/useTitle';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  CopyButton,
  Divider,
  Group,
  Image,
  Modal,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconGhost2Filled,
  IconLink,
  IconPhoto,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';

/* ─── Preset media library ─────────────────────────────────── */
type PresetMedia = {
  id: string;
  label: string;
  type: 'image' | 'gif' | 'video';
  url: string;
  preview: string;
};

const PRESET_MEDIA: PresetMedia[] = [
  {
    id: 'rickroll',
    label: 'Rickroll',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    preview: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  {
    id: 'nyan',
    label: 'Nyan Cat',
    type: 'gif',
    url: 'https://media.tenor.com/iFGFPNqmXFMAAAAC/nyan-cat.gif',
    preview: 'https://media.tenor.com/iFGFPNqmXFMAAAAC/nyan-cat.gif',
  },
  {
    id: 'trollface',
    label: 'Trollface',
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png',
    preview: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png',
  },
  {
    id: 'doge',
    label: 'Doge',
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Original_Doge_meme.jpg',
    preview: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Original_Doge_meme.jpg',
  },
  {
    id: 'bonk',
    label: 'Bonk',
    type: 'gif',
    url: 'https://media.tenor.com/HbHfHFMCLqIAAAAC/bonk.gif',
    preview: 'https://media.tenor.com/HbHfHFMCLqIAAAAC/bonk.gif',
  },
  {
    id: 'surprised-pikachu',
    label: 'Surprised Pikachu',
    type: 'image',
    url: 'https://i.kym-cdn.com/entries/icons/original/000/027/475/Screen_Shot_2018-10-25_at_11.02.15_AM.png',
    preview: 'https://i.kym-cdn.com/entries/icons/original/000/027/475/Screen_Shot_2018-10-25_at_11.02.15_AM.png',
  },
];

/* ─── Troll link type ──────────────────────────────────────── */
type TrollLink = {
  id: string;
  alias: string;
  targetUrl: string;
  mediaId: string;
  createdAt: string;
};

const TYPE_COLOR: Record<PresetMedia['type'], string> = {
  image: 'blue',
  gif: 'grape',
  video: 'red',
};

const TYPE_ICON: Record<PresetMedia['type'], React.ReactNode> = {
  image: <IconPhoto size='0.9rem' />,
  gif: <IconPhoto size='0.9rem' />,
  video: <IconPlayerPlay size='0.9rem' />,
};

function buildTrollUrl(baseUrl: string, alias: string) {
  const clean = baseUrl.replace(/\/$/, '');
  return `${clean}/troll/${alias}`;
}

export default function DashboardTroll() {
  useTitle('Troll');

  const [links, setLinks] = useState<TrollLink[]>([]);
  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [previewMedia, setPreviewMedia] = useState<PresetMedia | null>(null);
  const [previewOpen, { open: openPreview, close: closePreview }] = useDisclosure(false);

  const form = useForm({
    initialValues: { alias: '', targetUrl: '', mediaId: '' },
    validate: {
      alias: (v) => (v.trim().length < 1 ? 'Alias is required' : null),
      targetUrl: (v) => {
        if (!v.trim()) return 'Target URL is required';
        try {
          new URL(v);
          return null;
        } catch {
          return 'Enter a valid URL (e.g. https://...)';
        }
      },
      mediaId: (v) => (v ? null : 'Select a preset'),
    },
  });

  const onCreate = (values: typeof form.values) => {
    if (links.some((l) => l.alias === values.alias.trim())) {
      form.setFieldError('alias', 'Alias already used');
      return;
    }

    const newLink: TrollLink = {
      id: crypto.randomUUID(),
      alias: values.alias.trim(),
      targetUrl: values.targetUrl.trim(),
      mediaId: values.mediaId,
      createdAt: new Date().toISOString(),
    };

    setLinks((prev) => [newLink, ...prev]);
    notifications.show({
      title: 'Troll link created',
      message: `/${newLink.alias} is ready to deploy 😈`,
      color: 'grape',
      icon: <IconGhost2Filled size='1rem' />,
    });
    form.reset();
    closeCreate();
  };

  const onDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    notifications.show({ message: 'Troll link deleted', color: 'red', icon: <IconTrash size='1rem' /> });
  };

  const openMediaPreview = (media: PresetMedia) => {
    setPreviewMedia(media);
    openPreview();
  };

  const instanceBase =
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';

  return (
    <>
      {/* ── Create modal ── */}
      <Modal opened={createOpen} onClose={closeCreate} title='Create troll link' size='lg'>
        <form onSubmit={form.onSubmit(onCreate)}>
          <Stack gap='sm'>
            <TextInput
              label='Alias'
              description='The short path people will visit, e.g. "prank1"'
              placeholder='prank1'
              leftSection={<IconLink size='1rem' />}
              {...form.getInputProps('alias')}
            />

            <TextInput
              label='Target URL'
              description='The real URL shown in the browser bar / embedded (e.g. cdn.phaseworld.top/watch?id=73h)'
              placeholder='https://cdn.phaseworld.top/watch?id=73h'
              leftSection={<IconExternalLink size='1rem' />}
              {...form.getInputProps('targetUrl')}
            />

            <Select
              label='Preset media'
              description='What actually loads when someone visits the troll link'
              placeholder='Pick a preset…'
              data={PRESET_MEDIA.map((m) => ({ value: m.id, label: `${m.label} (${m.type})` }))}
              {...form.getInputProps('mediaId')}
            />

            {form.values.mediaId && (() => {
              const m = PRESET_MEDIA.find((p) => p.id === form.values.mediaId);
              if (!m) return null;
              return (
                <Box>
                  <Text size='xs' c='dimmed' mb={4}>
                    Preview
                  </Text>
                  <Image
                    src={m.preview}
                    h={160}
                    fit='contain'
                    radius='md'
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  />
                </Box>
              );
            })()}

            <Button
              type='submit'
              variant='gradient'
              gradient={{ from: 'grape', to: 'pink' }}
              leftSection={<IconPlus size='1rem' />}
              fullWidth
            >
              Create troll link
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* ── Media preview modal ── */}
      <Modal
        opened={previewOpen}
        onClose={closePreview}
        title={previewMedia?.label ?? 'Preview'}
        size='lg'
        centered
      >
        {previewMedia && (
          <Stack gap='sm'>
            <Badge color={TYPE_COLOR[previewMedia.type]} variant='light' size='sm'>
              {previewMedia.type}
            </Badge>
            {previewMedia.type === 'video' ? (
              <Box
                component='iframe'
                src={`https://www.youtube.com/embed/${previewMedia.url.split('v=')[1]}`}
                style={{ width: '100%', height: 300, border: 'none', borderRadius: 12 }}
                allowFullScreen
              />
            ) : (
              <Image src={previewMedia.url} fit='contain' h={300} radius='md' />
            )}
            <Text size='xs' c='dimmed' style={{ wordBreak: 'break-all' }}>
              {previewMedia.url}
            </Text>
          </Stack>
        )}
      </Modal>

      {/* ── Page header ── */}
      <Group gap='sm' mb='xs'>
        <IconGhost2Filled size='1.5rem' style={{ color: 'var(--mantine-color-grape-4)' }} />
        <Title order={1}>Troll</Title>
        <Badge color='grape' variant='light'>
          Admin only
        </Badge>
      </Group>
      <Text c='dimmed' mb='md'>
        Create disguised links that show a fake URL but load a preset prank media instead.
      </Text>

      {/* ── Preset library ── */}
      <Title order={3} mb='xs'>
        Preset library
      </Title>
      <ScrollArea>
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing='sm' mb='xl'>
          {PRESET_MEDIA.map((m) => (
            <Card
              key={m.id}
              withBorder
              padding='xs'
              radius='md'
              style={{ cursor: 'pointer' }}
              onClick={() => openMediaPreview(m)}
            >
              <Card.Section>
                <Image src={m.preview} h={90} fit='cover' />
              </Card.Section>
              <Group gap={4} mt={6} wrap='nowrap'>
                <Badge color={TYPE_COLOR[m.type]} variant='dot' size='xs' leftSection={TYPE_ICON[m.type]}>
                  {m.type}
                </Badge>
                <Text size='xs' fw={600} lineClamp={1}>
                  {m.label}
                </Text>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </ScrollArea>

      <Divider mb='md' />

      {/* ── Active troll links ── */}
      <Group justify='space-between' mb='sm'>
        <Title order={3}>Active troll links</Title>
        <Button
          variant='gradient'
          gradient={{ from: 'grape', to: 'pink' }}
          leftSection={<IconPlus size='1rem' />}
          size='sm'
          onClick={openCreate}
        >
          New troll link
        </Button>
      </Group>

      {links.length === 0 ? (
        <Card withBorder radius='md' p='xl' ta='center'>
          <IconGhost2Filled size='2.5rem' style={{ color: 'var(--mantine-color-grape-4)', marginBottom: 8 }} />
          <Text c='dimmed'>No troll links yet. Create one above 😈</Text>
        </Card>
      ) : (
        <Stack gap='sm'>
          {links.map((link) => {
            const media = PRESET_MEDIA.find((m) => m.id === link.mediaId);
            const trollUrl = buildTrollUrl(instanceBase, link.alias);

            return (
              <Card key={link.id} withBorder radius='md' p='sm'>
                <Group justify='space-between' wrap='nowrap'>
                  {/* Thumbnail */}
                  {media && (
                    <Image
                      src={media.preview}
                      w={56}
                      h={56}
                      fit='cover'
                      radius='md'
                      style={{ flexShrink: 0 }}
                    />
                  )}

                  {/* Info */}
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap='xs' wrap='nowrap'>
                      <Text fw={700} size='sm' lineClamp={1}>
                        /{link.alias}
                      </Text>
                      {media && (
                        <Badge color={TYPE_COLOR[media.type]} variant='light' size='xs'>
                          {media.label}
                        </Badge>
                      )}
                    </Group>
                    <Text size='xs' c='dimmed' lineClamp={1}>
                      Disguised as: {link.targetUrl}
                    </Text>
                    <Text size='xs' c='dimmed' lineClamp={1}>
                      Troll URL: {trollUrl}
                    </Text>
                  </Stack>

                  {/* Actions */}
                  <Group gap='xs' wrap='nowrap'>
                    <CopyButton value={trollUrl} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied!' : 'Copy troll URL'}>
                          <ActionIcon
                            variant='light'
                            color={copied ? 'teal' : 'grape'}
                            onClick={copy}
                          >
                            {copied ? <IconCheck size='1rem' /> : <IconCopy size='1rem' />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                    <CopyButton value={link.targetUrl} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied!' : 'Copy fake URL'}>
                          <ActionIcon variant='light' color={copied ? 'teal' : 'blue'} onClick={copy}>
                            {copied ? <IconCheck size='1rem' /> : <IconLink size='1rem' />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                    <Tooltip label='Delete'>
                      <ActionIcon variant='light' color='red' onClick={() => onDelete(link.id)}>
                        <IconTrash size='1rem' />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}
    </>
  );
}
