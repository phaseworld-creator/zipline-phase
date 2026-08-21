import { fetchApi } from '@/lib/fetchApi';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  CopyButton,
  Divider,
  Group,
  Image,
  Loader,
  Modal,
  SegmentedControl,
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
  IconGhost2Filled,
  IconLink,
  IconPhoto,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

/* ─── Types ─────────────────────────────────────────────────── */
type TrollMediaType = 'image' | 'gif' | 'video' | 'youtube';

type TrollLink = {
  id: string;
  alias: string;
  mediaUrl: string;
  mediaType: TrollMediaType;
  label: string;
  createdAt: string;
};

/* ─── Preset library ─────────────────────────────────────────── */
type Preset = {
  id: string;
  label: string;
  type: TrollMediaType;
  mediaUrl: string;
  preview: string;
};

const PRESETS: Preset[] = [
  {
    id: 'rickroll',
    label: 'Rickroll',
    type: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    preview: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  {
    id: 'nyan',
    label: 'Nyan Cat',
    type: 'gif',
    mediaUrl: 'https://phase-cdn.pages.dev/zipline/Nyan-Cat.webp',
    preview: 'https://phase-cdn.pages.dev/zipline/Nyan-Cat.webp',
  },
  {
    id: 'trollface',
    label: 'Trollface',
    type: 'image',
    mediaUrl: 'https://phase-cdn.pages.dev/zipline/TrollFace.png',
    preview: 'hhttps://phase-cdn.pages.dev/zipline/TrollFace.png',
  },
  {
    id: 'doge',
    label: 'Doge',
    type: 'image',
    mediaUrl: 'https://phase-cdn.pages.dev/zipline/Doge.jpg',
    preview: 'https://phase-cdn.pages.dev/zipline/Doge.jpg',
  },
  {
    id: 'bonk',
    label: 'Bonk',
    type: 'gif',
    mediaUrl: 'https://phase-cdn.pages.dev/zipline/Bonk.gif',
    preview: 'https://phase-cdn.pages.dev/zipline/Bonk.gif',
  },
  {
    id: 'pikachu',
    label: 'Surprised Pikachu',
    type: 'image',
    mediaUrl: 'https://phase-cdn.pages.dev/zipline/Surprised-Pikachu.png',
    preview: 'https://phase-cdn.pages.dev/zipline/Surprised-Pikachu.png',
  },
  {
    id: 'spinning',
    label: 'Spinning Horse',
    type: 'gif',
    mediaUrl: 'https://phase-cdn.pages.dev/zipline/Spinning-Horse.gif',
    preview: 'https://phase-cdn.pages.dev/zipline/Spinning-Horse.gif',
  },
  {
    id: 'shrek',
    label: 'Shrek',
    type: 'image',
    mediaUrl: 'https://phase-cdn.pages.dev/zipline/Shrek-Disappointed.png',
    preview: 'https://phase-cdn.pages.dev/zipline/Shrek-Disappointed.png',
  },
];

const TYPE_COLOR: Record<TrollMediaType, string> = {
  image: 'blue',
  gif: 'grape',
  video: 'orange',
  youtube: 'red',
};

const TYPE_ICON: Record<TrollMediaType, React.ReactNode> = {
  image: <IconPhoto size='0.85rem' />,
  gif: <IconPhoto size='0.85rem' />,
  video: <IconPlayerPlay size='0.85rem' />,
  youtube: <IconPlayerPlay size='0.85rem' />,
};

const API_PATH = '/api/troll';
const SWR_KEY = API_PATH;

function buildTrollUrl(alias: string) {
  if (typeof window === 'undefined') return `/data/${alias}`;
  return `${window.location.protocol}//${window.location.host}/data/${alias}`;
}

/* ─── Component ──────────────────────────────────────────────── */
export default function DashboardTroll() {
  const { data: links, isLoading } = useSWR<TrollLink[]>(SWR_KEY);

  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      alias: '',
      label: '',
      customUrl: '',
      customType: 'image' as TrollMediaType,
    },
    validate: {
      alias: (v) =>
        !v.trim()
          ? 'Alias is required'
          : !/^[\w-]+$/.test(v.trim())
            ? 'Only letters, numbers, - and _ allowed'
            : null,
      customUrl: (v) => {
        if (mode !== 'custom') return null;
        if (!v.trim()) return 'Media URL is required';
        try {
          new URL(v);
          return null;
        } catch {
          return 'Enter a valid URL';
        }
      },
    },
  });

  const onClose = () => {
    closeCreate();
    form.reset();
    setSelectedPreset(null);
    setMode('preset');
  };

  const onCreate = async (values: typeof form.values) => {
    if (mode === 'preset' && !selectedPreset) {
      notifications.show({ message: 'Pick a preset first', color: 'orange' });
      return;
    }

    const mediaUrl = mode === 'preset' ? selectedPreset!.mediaUrl : values.customUrl.trim();
    const mediaType = mode === 'preset' ? selectedPreset!.type : values.customType;
    const label = values.label.trim() || (mode === 'preset' ? selectedPreset!.label : values.alias.trim());

    setSubmitting(true);
    const { error } = await fetchApi(API_PATH, 'POST', {
      alias: values.alias.trim(),
      mediaUrl,
      mediaType,
      label,
    });
    setSubmitting(false);

    if (error) {
      notifications.show({ message: error.error || 'Failed to create troll link', color: 'red' });
      return;
    }

    notifications.show({
      title: 'Troll link created 😈',
      message: `/${values.alias.trim()} is ready to deploy`,
      color: 'grape',
      icon: <IconGhost2Filled size='1rem' />,
    });

    globalMutate(SWR_KEY);
    onClose();
  };

  const onDelete = async (alias: string) => {
    const res = await fetch(`${API_PATH}/${encodeURIComponent(alias)}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      notifications.show({ message: text || 'Failed to delete', color: 'red' });
      return;
    }
    notifications.show({ message: 'Troll link deleted', color: 'red', icon: <IconTrash size='1rem' /> });
    globalMutate(SWR_KEY);
  };

  return (
    <>
      {/* ── Create modal ── */}
      <Modal opened={createOpen} onClose={onClose} title='Create troll link' size='lg'>
        <form onSubmit={form.onSubmit(onCreate)}>
          <Stack gap='sm'>
            <TextInput
              label='Alias'
              description='The path visitors hit — e.g. "watch73h" → your-domain/troll/watch73h'
              placeholder='watch73h'
              leftSection={<IconLink size='1rem' />}
              {...form.getInputProps('alias')}
            />

            <TextInput
              label='Label (optional)'
              description='Friendly name shown in the admin list'
              placeholder='My prank'
              {...form.getInputProps('label')}
            />

            <Divider label='Media source' labelPosition='center' />

            <SegmentedControl
              fullWidth
              value={mode}
              onChange={(v) => setMode(v as 'preset' | 'custom')}
              data={[
                { label: 'Use a preset', value: 'preset' },
                { label: 'Custom URL', value: 'custom' },
              ]}
            />

            {mode === 'preset' ? (
              <>
                <Text size='xs' c='dimmed'>
                  Click a preset to select it
                </Text>
                <SimpleGrid cols={4} spacing='xs'>
                  {PRESETS.map((p) => (
                    <Card
                      key={p.id}
                      withBorder
                      padding='xs'
                      radius='md'
                      style={{
                        cursor: 'pointer',
                        outline: selectedPreset?.id === p.id ? '2px solid var(--mantine-color-grape-5)' : undefined,
                      }}
                      onClick={() => setSelectedPreset(p)}
                    >
                      <Card.Section>
                        <Image src={p.preview} h={60} fit='cover' />
                      </Card.Section>
                      <Text size='xs' fw={600} ta='center' mt={4} lineClamp={1}>
                        {p.label}
                      </Text>
                      <Badge color={TYPE_COLOR[p.type]} variant='dot' size='xs' mx='auto' mt={2}>
                        {p.type}
                      </Badge>
                    </Card>
                  ))}
                </SimpleGrid>
                {selectedPreset && (
                  <Text size='xs' c='grape' fw={600}>
                    ✓ Selected: {selectedPreset.label}
                  </Text>
                )}
              </>
            ) : (
              <>
                <TextInput
                  label='Media URL'
                  description='Direct link to the image, gif, video, or a YouTube watch URL'
                  placeholder='https://example.com/funny.gif'
                  {...form.getInputProps('customUrl')}
                />
                <Select
                  label='Media type'
                  description='How to render the URL on the troll page'
                  data={[
                    { value: 'image', label: 'Image (png, jpg, webp…)' },
                    { value: 'gif', label: 'GIF (animated image)' },
                    { value: 'video', label: 'Video (mp4, webm…)' },
                    { value: 'youtube', label: 'YouTube (watch?v= URL)' },
                  ]}
                  {...form.getInputProps('customType')}
                />
                {form.values.customUrl && (
                  <Image
                    src={form.values.customUrl}
                    h={120}
                    fit='contain'
                    radius='md'
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                    fallbackSrc='data:image/svg+xml,<svg/>'
                  />
                )}
              </>
            )}

            <Button
              type='submit'
              variant='gradient'
              gradient={{ from: 'grape', to: 'pink' }}
              leftSection={<IconPlus size='1rem' />}
              loading={submitting}
              fullWidth
              mt='xs'
            >
              Create troll link
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* ── Page header ── */}
      <Group gap='sm' mb='xs'>
        <IconGhost2Filled size='1.5rem' style={{ color: 'var(--mantine-color-grape-4)' }} />
        <Title order={1}>Troll</Title>
        <Badge color='grape' variant='light'>
          Admin only
        </Badge>
      </Group>
      <Text c='dimmed' mb='lg'>
        Create disguised prank links. Share <code>/data/alias</code> with someone — they see your chosen
        media full-screen. Presets or custom URLs, your choice.
      </Text>

      {/* ── Active links ── */}
      <Group justify='space-between' mb='sm'>
        <Title order={3}>Active troll links</Title>
        <Group gap='xs'>
          <ActionIcon variant='subtle' onClick={() => globalMutate(SWR_KEY)} title='Refresh'>
            <IconRefresh size='1rem' />
          </ActionIcon>
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
      </Group>

      {isLoading ? (
        <Group justify='center' py='xl'>
          <Loader color='grape' />
        </Group>
      ) : !links || links.length === 0 ? (
        <Card withBorder radius='md' p='xl' ta='center'>
          <IconGhost2Filled size='2.5rem' style={{ color: 'var(--mantine-color-grape-4)', marginBottom: 8 }} />
          <Text c='dimmed'>No troll links yet. Create one above 😈</Text>
        </Card>
      ) : (
        <Stack gap='sm'>
          {links.map((link) => {
            const trollUrl = buildTrollUrl(link.alias);
            const isImageLike = link.mediaType === 'image' || link.mediaType === 'gif';
            const previewSrc = isImageLike ? link.mediaUrl : undefined;

            return (
              <Card key={link.id} withBorder radius='md' p='sm'>
                <Group justify='space-between' wrap='nowrap' gap='md'>
                  {/* Thumbnail */}
                  {previewSrc ? (
                    <Image
                      src={previewSrc}
                      w={52}
                      h={52}
                      fit='cover'
                      radius='md'
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 8,
                        background: 'rgba(129,140,248,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {TYPE_ICON[link.mediaType]}
                    </div>
                  )}

                  {/* Info */}
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap='xs' wrap='nowrap'>
                      <Text fw={700} size='sm' lineClamp={1}>
                        {link.label}
                      </Text>
                      <Badge color={TYPE_COLOR[link.mediaType]} variant='light' size='xs'>
                        {link.mediaType}
                      </Badge>
                    </Group>
                    <Text size='xs' c='dimmed' lineClamp={1} ff='monospace'>
                      /troll/{link.alias}
                    </Text>
                    <Text size='xs' c='dimmed' lineClamp={1} style={{ opacity: 0.6 }}>
                      {link.mediaUrl}
                    </Text>
                  </Stack>

                  {/* Actions */}
                  <Group gap='xs' wrap='nowrap'>
                    <CopyButton value={trollUrl} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied!' : 'Copy troll URL'}>
                          <ActionIcon variant='light' color={copied ? 'teal' : 'grape'} onClick={copy}>
                            {copied ? <IconCheck size='1rem' /> : <IconCopy size='1rem' />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                    <Tooltip label='Open in new tab'>
                      <ActionIcon
                        variant='light'
                        color='blue'
                        component='a'
                        href={trollUrl}
                        target='_blank'
                        rel='noreferrer'
                      >
                        <IconLink size='1rem' />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label='Delete'>
                      <ActionIcon variant='light' color='red' onClick={() => onDelete(link.alias)}>
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
