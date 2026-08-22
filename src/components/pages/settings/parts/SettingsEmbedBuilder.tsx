import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  CopyButton,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconCopy, IconExternalLink, IconRefresh } from '@tabler/icons-react';
import { useMemo } from 'react';

type EmbedData = {
  title?: string;
  description?: string;
  color?: string;
  siteName?: string;
  imageUrl?: string;
};

// Short-key mapping: t=title, d=description, c=color, s=siteName, i=imageUrl
type ShortEmbed = { t?: string; d?: string; c?: string; s?: string; i?: string };

function toShort(data: EmbedData): ShortEmbed {
  const o: ShortEmbed = {};
  if (data.title?.trim())       o.t = data.title.trim();
  if (data.description?.trim()) o.d = data.description.trim();
  if (data.color?.trim())       o.c = data.color.trim();
  if (data.siteName?.trim())    o.s = data.siteName.trim();
  if (data.imageUrl?.trim())    o.i = data.imageUrl.trim();
  return o;
}

function encodeEmbedData(data: EmbedData): string {
  const json = JSON.stringify(toShort(data));
  const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16)),
  );
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function buildEmbedUrl(data: EmbedData): string {
  const encoded = encodeEmbedData(data);
  if (typeof window === 'undefined') return `/embed?data=${encoded}`;
  return `${window.location.protocol}//${window.location.host}/embed?data=${encoded}`;
}

/* ─── Live preview ─────────────────────────────────────────────── */
function DiscordPreview({ data }: { data: EmbedData }) {
  const color = data.color && /^#[0-9a-fA-F]{3,8}$/.test(data.color) ? data.color : '#6366f1';
  const isEmpty = !data.title && !data.description && !data.siteName && !data.imageUrl;

  if (isEmpty) {
    return (
      <Box style={{ background: '#2b2d3a', borderRadius: 8, padding: '20px', color: '#72757e', fontSize: 14, textAlign: 'center' }}>
        Fill in the fields to see a preview
      </Box>
    );
  }

  return (
    <Box style={{ background: '#313338', borderRadius: 8, padding: '12px 16px', fontFamily: '"gg sans","Noto Sans",system-ui,sans-serif', maxWidth: 440 }}>
      <Group gap='xs' mb={6} align='flex-start'>
        <Box style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#f43f5e)', flexShrink: 0 }} />
        <Box style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>You</Text>
          <Box style={{ background: '#2b2d3a', borderLeft: `4px solid ${color}`, borderRadius: 4, padding: '8px 12px', maxWidth: 400 }}>
            {data.siteName && (
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#b9bbbe', marginBottom: 4 }}>{data.siteName}</Text>
            )}
            {data.title && (
              <Text style={{ fontSize: 15, fontWeight: 700, color: '#7289da', marginBottom: 4, wordBreak: 'break-word' }}>{data.title}</Text>
            )}
            {data.description && (
              <Text style={{ fontSize: 14, color: '#b9bbbe', lineHeight: 1.375, marginBottom: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{data.description}</Text>
            )}
            {data.imageUrl && (
              <Box
                component='img'
                src={data.imageUrl}
                style={{ display: 'block', maxWidth: '100%', maxHeight: 200, borderRadius: 4, marginTop: 8, objectFit: 'contain' }}
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
            )}
          </Box>
        </Box>
      </Group>
    </Box>
  );
}

/* ─── Component ────────────────────────────────────────────────── */
export default function SettingsEmbedBuilder() {
  const form = useForm<EmbedData>({
    initialValues: { title: '', description: '', color: '#6366f1', siteName: '', imageUrl: '' },
  });

  const embedUrl = useMemo(() => buildEmbedUrl(form.values), [form.values]);

  return (
    <Paper withBorder p='sm'>
      <Title order={2} mb='xs'>Embed Builder</Title>
      <Text c='dimmed' size='sm' mb='md'>
        Build a custom embed link — paste it in Discord or any OG-aware app and it shows your card.
      </Text>
      <Divider mb='md' />

      <Group align='flex-start' gap='xl' style={{ flexWrap: 'wrap' }}>
        <Stack gap='sm' style={{ flex: '1 1 260px', minWidth: 220 }}>
          <TextInput label='Site name' description='Small text above the title' placeholder='My Zipline' {...form.getInputProps('siteName')} />
          <TextInput label='Title' placeholder='Check this out!' {...form.getInputProps('title')} />
          <TextInput label='Description' placeholder='A short message under the title' {...form.getInputProps('description')} />
          <ColorInput
            label='Accent color'
            description='Left border color'
            format='hex'
            swatches={['#6366f1','#f43f5e','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899']}
            {...form.getInputProps('color')}
          />
          <TextInput label='Image URL' placeholder='https://example.com/image.png' {...form.getInputProps('imageUrl')} />
          <ActionIcon variant='subtle' color='gray' size='sm' onClick={() => form.reset()} title='Reset' mt='xs'>
            <IconRefresh size='0.9rem' />
          </ActionIcon>
        </Stack>

        <Stack gap='sm' style={{ flex: '1 1 300px', minWidth: 260 }}>
          <Text size='sm' fw={600} c='dimmed' tt='uppercase' style={{ letterSpacing: '0.05em' }}>Live preview</Text>
          <DiscordPreview data={form.values} />
          <Divider my='xs' />
          <Text size='sm' fw={600}>Your embed URL</Text>
          <Box style={{ background: 'var(--mantine-color-dark-6)', borderRadius: 6, padding: '8px 12px', wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace' }}>
            {embedUrl}
          </Box>
          <Group gap='xs'>
            <CopyButton value={embedUrl} timeout={2000}>
              {({ copied, copy }) => (
                <Button size='xs' variant={copied ? 'filled' : 'light'} color={copied ? 'teal' : 'blue'} leftSection={copied ? <IconCheck size='0.85rem' /> : <IconCopy size='0.85rem' />} onClick={copy}>
                  {copied ? 'Copied!' : 'Copy URL'}
                </Button>
              )}
            </CopyButton>
            <Tooltip label='Open in new tab'>
              <ActionIcon variant='light' color='gray' size='sm' component='a' href={embedUrl} target='_blank' rel='noreferrer'>
                <IconExternalLink size='0.9rem' />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
