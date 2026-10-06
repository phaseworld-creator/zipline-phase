import SafeCopyButton from '@/components/SafeCopyButton';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  ColorInput,
  Divider,
  Group,
  Modal,
  NumberInput,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconBrandDiscord,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconExternalLink,
  IconPlus,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';

/* ─── Types ────────────────────────────────────────────────────── */
type EmbedField = { name: string; value: string; inline: boolean };

type CardType = 'website' | 'summary_large_image';

type EmbedData = {
  authorName?: string;
  authorIconUrl?: string;
  title?: string;
  titleUrl?: string;
  description?: string;
  color?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIconUrl?: string;
  fields: EmbedField[];
  redirectUrl?: string;
  redirectDelay?: number;
  cardType?: CardType;
};

type SavedTemplate = {
  name: string;
  data: EmbedData;
  createdAt: string;
};

/* ─── Short-key encoding for the /embed route ──────────────────── */
type ShortEmbed = {
  a?: string; ai?: string;
  t?: string; tu?: string;
  d?: string;
  c?: string;
  th?: string;
  i?: string;
  ft?: string; fi?: string;
  f?: { n: string; v: string; il?: boolean }[];
  r?: string; rd?: number;
  ct?: CardType;
};

function toShort(data: EmbedData): ShortEmbed {
  const o: ShortEmbed = {};
  if (data.authorName?.trim())    o.a  = data.authorName.trim();
  if (data.authorIconUrl?.trim()) o.ai = data.authorIconUrl.trim();
  if (data.title?.trim())         o.t  = data.title.trim();
  if (data.titleUrl?.trim())      o.tu = data.titleUrl.trim();
  if (data.description?.trim())   o.d  = data.description.trim();
  if (data.color?.trim())         o.c  = data.color.trim();
  if (data.thumbnailUrl?.trim())  o.th = data.thumbnailUrl.trim();
  if (data.imageUrl?.trim())      o.i  = data.imageUrl.trim();
  if (data.footerText?.trim())    o.ft = data.footerText.trim();
  if (data.footerIconUrl?.trim()) o.fi = data.footerIconUrl.trim();
  const fields = data.fields.filter((f) => f.name.trim() && f.value.trim());
  if (fields.length) o.f = fields.map((f) => ({ n: f.name.trim(), v: f.value.trim(), ...(f.inline ? { il: true } : {}) }));
  if (data.redirectUrl?.trim())   o.r  = data.redirectUrl.trim();
  if (data.redirectDelay && data.redirectDelay > 0) o.rd = data.redirectDelay;
  if (data.cardType && data.cardType !== 'website') o.ct = data.cardType;
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

/* ─── Discohook.app integration ────────────────────────────────── */
function hexToInt(hex?: string): number | undefined {
  const h = hex?.replace('#', '');
  if (!h || !/^[0-9a-fA-F]{3,8}$/.test(h)) return undefined;
  return parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
}

function buildDiscohookUrl(data: EmbedData, embedUrl: string): string {
  const colorInt = hexToInt(data.color);

  const embed: Record<string, unknown> = {};

  if (data.authorName?.trim())
    embed.author = {
      name: data.authorName.trim(),
      ...(data.authorIconUrl?.trim() ? { icon_url: data.authorIconUrl.trim() } : {}),
    };

  if (data.title?.trim()) {
    embed.title = data.title.trim();
    // link the title to the embed URL so clicking it in Discord leads somewhere useful
    embed.url = data.titleUrl?.trim() || embedUrl;
  }

  if (data.description?.trim()) embed.description = data.description.trim();
  if (colorInt !== undefined)   embed.color = colorInt;

  if (data.thumbnailUrl?.trim()) embed.thumbnail = { url: data.thumbnailUrl.trim() };
  if (data.imageUrl?.trim())     embed.image = { url: data.imageUrl.trim() };

  const fields = data.fields.filter((f) => f.name.trim() && f.value.trim());
  if (fields.length)
    embed.fields = fields.map((f) => ({ name: f.name.trim(), value: f.value.trim(), inline: f.inline }));

  if (data.footerText?.trim())
    embed.footer = {
      text: data.footerText.trim(),
      ...(data.footerIconUrl?.trim() ? { icon_url: data.footerIconUrl.trim() } : {}),
    };

  const payload = { messages: [{ data: { content: embedUrl, embeds: [embed] } }] };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://discohook.app/?data=${b64}`;
}

/* ─── Discord-accurate live preview ────────────────────────────── */
function DiscordPreview({ data, embedUrl }: { data: EmbedData; embedUrl: string }) {
  const accentColor =
    data.color && /^#[0-9a-fA-F]{3,8}$/.test(data.color) ? data.color : '#6366f1';

  const hasContent =
    data.authorName || data.title || data.description ||
    data.thumbnailUrl || data.imageUrl || data.footerText ||
    data.fields.some((f) => f.name.trim() && f.value.trim());

  if (!hasContent) {
    return (
      <Box
        style={{
          background: '#2b2d3a',
          borderRadius: 8,
          padding: '20px',
          color: '#72757e',
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        Fill in the fields to see a preview
      </Box>
    );
  }

  const allFields = data.fields.filter((f) => f.name.trim() && f.value.trim());

  return (
    <Box style={{ position: 'relative' }}>
      {/* Floating copy button */}
      <Box style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <SafeCopyButton value={embedUrl} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied!' : 'Copy embed URL'}>
              <ActionIcon
                variant='filled'
                color={copied ? 'teal' : 'grape'}
                size='md'
                onClick={copy}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              >
                {copied ? <IconCheck size='1rem' /> : <IconCopy size='1rem' />}
              </ActionIcon>
            </Tooltip>
          )}
        </SafeCopyButton>
      </Box>

      <Box
        style={{
          background: '#313338',
          borderRadius: 8,
          padding: '12px 16px',
          fontFamily: '"gg sans","Noto Sans",system-ui,sans-serif',
          maxWidth: 520,
        }}
      >
        {/* fake message bubble */}
        <Group gap='xs' mb={6} align='flex-start'>
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#f43f5e)',
              flexShrink: 0,
            }}
          />
          <Box style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              You
            </Text>

            {/* embed card */}
            <Box
              style={{
                background: '#2b2d3a',
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: 4,
                padding: '12px 16px',
                maxWidth: 480,
                position: 'relative',
              }}
            >
              {/* author */}
              {data.authorName?.trim() && (
                <Group gap='xs' mb={6} wrap='nowrap'>
                  {data.authorIconUrl?.trim() && (
                    <Box
                      component='img'
                      src={data.authorIconUrl}
                      style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                  <Text style={{ fontSize: 12, fontWeight: 600, color: '#b9bbbe' }}>
                    {data.authorName}
                  </Text>
                </Group>
              )}

              {/* thumbnail — positioned top-right */}
              {data.thumbnailUrl?.trim() && (
                <Box
                  component='img'
                  src={data.thumbnailUrl}
                  style={{
                    float: 'right',
                    width: 80,
                    height: 80,
                    borderRadius: 4,
                    objectFit: 'cover',
                    marginLeft: 12,
                    marginBottom: 4,
                  }}
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              )}

              {/* title */}
              {data.title?.trim() && (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: data.titleUrl?.trim() ? '#7289da' : '#fff',
                    marginBottom: 4,
                    wordBreak: 'break-word',
                    cursor: data.titleUrl?.trim() ? 'pointer' : undefined,
                    textDecoration: data.titleUrl?.trim() ? 'underline' : undefined,
                  }}
                >
                  {data.title}
                </Text>
              )}

              {/* description — multi-line */}
              {data.description?.trim() && (
                <Text
                  style={{
                    fontSize: 14,
                    color: '#b9bbbe',
                    lineHeight: 1.375,
                    marginBottom: 8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {data.description}
                </Text>
              )}

              {/* fields */}
              {allFields.length > 0 && (
                <Box style={{ marginBottom: 8 }}>
                  {/* render inline fields in a row, non-inline full-width */}
                  {allFields.map((field, idx) => (
                    <Box
                      key={idx}
                      style={{
                        display: 'inline-block',
                        width: field.inline ? 'calc(33% - 4px)' : '100%',
                        verticalAlign: 'top',
                        marginRight: field.inline ? 4 : 0,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: 700, color: '#b9bbbe', marginBottom: 2 }}>
                        {field.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#b9bbbe', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {field.value}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}

              {/* large image */}
              {data.imageUrl?.trim() && (
                <Box
                  component='img'
                  src={data.imageUrl}
                  style={{
                    display: 'block',
                    clear: 'both',
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 4,
                    marginTop: 8,
                    marginBottom: 8,
                    objectFit: 'contain',
                  }}
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              )}

              {/* footer */}
              {data.footerText?.trim() && (
                <Group gap='xs' mt={8} wrap='nowrap' style={{ clear: 'both' }}>
                  {data.footerIconUrl?.trim() && (
                    <Box
                      component='img'
                      src={data.footerIconUrl}
                      style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                  <Text style={{ fontSize: 11, color: '#72757e' }}>{data.footerText}</Text>
                </Group>
              )}
            </Box>
          </Box>
        </Group>
      </Box>
    </Box>
  );
}

/* ─── Main component ───────────────────────────────────────────── */
const EMPTY_FIELD: EmbedField = { name: '', value: '', inline: false };
const TEMPLATES_KEY = 'zipline-embed-templates';

export default function SettingsEmbedBuilder() {
  const [templates, setTemplates] = useLocalStorage<SavedTemplate[]>({
    key: TEMPLATES_KEY,
    defaultValue: [],
  });
  const [saveModalOpen, { open: openSaveModal, close: closeSaveModal }] = useDisclosure(false);
  const [templateName, setTemplateName] = useState('');

  const form = useForm<EmbedData>({
    initialValues: {
      authorName: '',
      authorIconUrl: '',
      title: '',
      titleUrl: '',
      description: '',
      color: '#6366f1',
      thumbnailUrl: '',
      imageUrl: '',
      footerText: '',
      footerIconUrl: '',
      fields: [],
      redirectUrl: '',
      redirectDelay: 5,
      cardType: 'website',
    },
  });

  const embedUrl     = useMemo(() => buildEmbedUrl(form.values), [form.values]);
  const discohookUrl = useMemo(() => buildDiscohookUrl(form.values, embedUrl), [form.values, embedUrl]);

  const addField = () => form.insertListItem('fields', { ...EMPTY_FIELD });
  const removeField = (i: number) => form.removeListItem('fields', i);

  const saveTemplate = () => {
    if (!templateName.trim()) {
      notifications.show({ message: 'Template name is required', color: 'orange' });
      return;
    }
    const newTemplate: SavedTemplate = {
      name: templateName.trim(),
      data: form.values,
      createdAt: new Date().toISOString(),
    };
    setTemplates([...templates, newTemplate]);
    notifications.show({
      title: 'Template saved',
      message: `"${templateName.trim()}" has been saved`,
      color: 'teal',
      icon: <IconDeviceFloppy size='1rem' />,
    });
    setTemplateName('');
    closeSaveModal();
  };

  const loadTemplate = (template: SavedTemplate) => {
    form.setValues(template.data);
    notifications.show({
      title: 'Template loaded',
      message: `"${template.name}" has been loaded`,
      color: 'blue',
      icon: <IconDownload size='1rem' />,
    });
  };

  const deleteTemplate = (index: number) => {
    const name = templates[index].name;
    setTemplates(templates.filter((_, i) => i !== index));
    notifications.show({
      message: `Template "${name}" deleted`,
      color: 'red',
      icon: <IconTrash size='1rem' />,
    });
  };

  return (
    <Paper withBorder p='md'>
      <Group gap='xs' mb='xs' align='center'>
        <Title order={2}>Embed Builder</Title>
        <Badge color='indigo' variant='light' size='sm'>Phase</Badge>
      </Group>
      <Group gap={6} mb='md' align='center' wrap='nowrap'>
        <Text size='sm' c='dimmed'>
          Build a Discord-style embed link. Use the
        </Text>
        <Button
          size='compact-xs'
          variant='light'
          color='indigo'
          leftSection={<IconBrandDiscord size='0.8rem' />}
          component='a'
          href={discohookUrl}
          target='_blank'
          rel='noreferrer'
        >
          Open in discohook.app
        </Button>
        <Text size='sm' c='dimmed'>button to preview exactly how Discord renders it.</Text>
      </Group>
      <Divider mb='lg' />

      <Group align='flex-start' gap='xl' style={{ flexWrap: 'wrap' }}>

        {/* ── Left: form ── */}
        <Stack gap='sm' style={{ flex: '1 1 300px', minWidth: 280 }}>

          <Text size='xs' fw={700} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.05em' }}>Author</Text>
          <TextInput
            label='Author name'
            placeholder='Zipline'
            {...form.getInputProps('authorName')}
          />
          <TextInput
            label='Author icon URL'
            placeholder='https://example.com/icon.png'
            {...form.getInputProps('authorIconUrl')}
          />

          <Divider />
          <Text size='xs' fw={700} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.05em' }}>Body</Text>

          <TextInput
            label='Title'
            placeholder='Check this out!'
            {...form.getInputProps('title')}
          />
          <TextInput
            label='Title URL'
            description='Makes the title a clickable link'
            placeholder='https://example.com'
            {...form.getInputProps('titleUrl')}
          />
          {/* multi-line description */}
          <Textarea
            label='Description'
            description='Supports multiple lines — press Enter for a new line'
            placeholder={'Line one\nLine two\nLine three'}
            minRows={3}
            autosize
            maxRows={12}
            {...form.getInputProps('description')}
          />
          <ColorInput
            label='Accent color'
            description='Left border color'
            format='hex'
            swatches={['#6366f1','#f43f5e','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#ffffff']}
            {...form.getInputProps('color')}
          />

          <Divider />
          <Text size='xs' fw={700} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.05em' }}>Images</Text>
          <TextInput
            label='Thumbnail URL'
            description='Small image top-right of the embed'
            placeholder='https://example.com/thumb.png'
            {...form.getInputProps('thumbnailUrl')}
          />
          <TextInput
            label='Image URL'
            description='Large image below the description'
            placeholder='https://example.com/image.png'
            {...form.getInputProps('imageUrl')}
          />

          <Divider />
          <Group justify='space-between' align='center'>
            <Text size='xs' fw={700} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.05em' }}>Fields</Text>
            <Button size='compact-xs' variant='light' leftSection={<IconPlus size='0.75rem' />} onClick={addField}>
              Add field
            </Button>
          </Group>

          {form.values.fields.map((_, i) => (
            <Paper key={i} withBorder p='xs' radius='sm'>
              <Group justify='space-between' mb='xs'>
                <Text size='xs' c='dimmed'>Field {i + 1}</Text>
                <ActionIcon size='xs' color='red' variant='subtle' onClick={() => removeField(i)}>
                  <IconTrash size='0.75rem' />
                </ActionIcon>
              </Group>
              <Stack gap='xs'>
                <TextInput
                  placeholder='Field name'
                  size='xs'
                  {...form.getInputProps(`fields.${i}.name`)}
                />
                <Textarea
                  placeholder='Field value (multi-line supported)'
                  size='xs'
                  minRows={2}
                  autosize
                  maxRows={6}
                  {...form.getInputProps(`fields.${i}.value`)}
                />
                <Group gap='xs'>
                  <input
                    type='checkbox'
                    id={`inline-${i}`}
                    checked={form.values.fields[i].inline}
                    onChange={(e) => form.setFieldValue(`fields.${i}.inline`, e.target.checked)}
                  />
                  <Text component='label' htmlFor={`inline-${i}`} size='xs' c='dimmed' style={{ cursor: 'pointer' }}>
                    Inline (side-by-side with other inline fields)
                  </Text>
                </Group>
              </Stack>
            </Paper>
          ))}

          <Divider />
          <Text size='xs' fw={700} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.05em' }}>Advanced</Text>
          
          <SegmentedControl
            data={[
              { label: 'Website Card', value: 'website' },
              { label: 'Twitter Large Image', value: 'summary_large_image' },
            ]}
            {...form.getInputProps('cardType')}
          />
          <Text size='xs' c='dimmed' mt={-6}>
            Card type affects how Discord/Slack parse metadata. Twitter card shows larger images.
          </Text>

          <TextInput
            label='Auto-redirect URL (optional)'
            description='Page will redirect here after a delay'
            placeholder='https://example.com/pranked'
            {...form.getInputProps('redirectUrl')}
          />
          
          {form.values.redirectUrl && (
            <NumberInput
              label='Redirect delay (seconds)'
              description='How long to show the embed before redirecting'
              min={1}
              max={60}
              {...form.getInputProps('redirectDelay')}
            />
          )}

          <Divider />
          <Text size='xs' fw={700} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.05em' }}>Footer</Text>
          <TextInput
            label='Footer text'
            placeholder='Sent via Zipline'
            {...form.getInputProps('footerText')}
          />
          <TextInput
            label='Footer icon URL'
            placeholder='https://example.com/icon.png'
            {...form.getInputProps('footerIconUrl')}
          />

          <Divider />
          <Group justify='space-between' align='center'>
            <Text size='xs' fw={700} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.05em' }}>Templates</Text>
            <Button
              size='compact-xs'
              variant='light'
              color='teal'
              leftSection={<IconDeviceFloppy size='0.75rem' />}
              onClick={openSaveModal}
            >
              Save Template
            </Button>
          </Group>

          {templates.length > 0 ? (
            <Stack gap='xs'>
              {templates.map((template, idx) => (
                <Paper key={idx} withBorder p='xs' radius='sm'>
                  <Group justify='space-between' wrap='nowrap'>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size='sm' fw={600}>{template.name}</Text>
                      <Text size='xs' c='dimmed'>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                    <Group gap='xs'>
                      <Tooltip label='Load template'>
                        <ActionIcon
                          size='sm'
                          variant='light'
                          color='blue'
                          onClick={() => loadTemplate(template)}
                        >
                          <IconDownload size='0.8rem' />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label='Delete template'>
                        <ActionIcon
                          size='sm'
                          variant='light'
                          color='red'
                          onClick={() => deleteTemplate(idx)}
                        >
                          <IconTrash size='0.8rem' />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Text size='xs' c='dimmed' ta='center'>
              No saved templates yet
            </Text>
          )}

          <Group justify='center' mt='xs'>
            <ActionIcon variant='subtle' color='gray' size='sm' onClick={() => form.reset()} title='Reset all fields'>
              <IconRefresh size='0.9rem' />
            </ActionIcon>
          </Group>
        </Stack>

        {/* Save Template Modal */}
        <Modal opened={saveModalOpen} onClose={closeSaveModal} title='Save Template' size='sm'>
          <Stack gap='sm'>
            <TextInput
              label='Template Name'
              placeholder='My awesome embed'
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              data-autofocus
            />
            <Button
              fullWidth
              leftSection={<IconDeviceFloppy size='1rem' />}
              onClick={saveTemplate}
            >
              Save
            </Button>
          </Stack>
        </Modal>

        {/* ── Right: preview + actions ── */}
        <Stack gap='sm' style={{ flex: '1 1 320px', minWidth: 280 }}>
          <Text size='sm' fw={600} c='dimmed' tt='uppercase' style={{ letterSpacing: '0.05em' }}>
            Live preview
          </Text>
          <DiscordPreview data={form.values} embedUrl={embedUrl} />

          <Divider my='xs' />
          <Text size='sm' fw={600}>Your embed URL</Text>
          <Box
            style={{
              background: 'var(--mantine-color-dark-6)',
              borderRadius: 6,
              padding: '8px 12px',
              wordBreak: 'break-all',
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            {embedUrl}
          </Box>

          <Group gap='xs'>
            <SafeCopyButton value={embedUrl} timeout={2000}>
              {({ copied, copy }) => (
                <Button
                  size='xs'
                  variant={copied ? 'filled' : 'light'}
                  color={copied ? 'teal' : 'blue'}
                  leftSection={copied ? <IconCheck size='0.85rem' /> : <IconCopy size='0.85rem' />}
                  onClick={copy}
                >
                  {copied ? 'Copied!' : 'Copy URL'}
                </Button>
              )}
            </SafeCopyButton>

            <Tooltip label='Open embed URL in new tab'>
              <ActionIcon variant='light' color='gray' size='sm' component='a' href={embedUrl} target='_blank' rel='noreferrer'>
                <IconExternalLink size='0.9rem' />
              </ActionIcon>
            </Tooltip>

            <Tooltip label='Preview in discohook.app'>
              <ActionIcon
                variant='light'
                color='indigo'
                size='sm'
                component='a'
                href={discohookUrl}
                target='_blank'
                rel='noreferrer'
              >
                <IconBrandDiscord size='0.9rem' />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Text size='xs' c='dimmed'>
            The <IconBrandDiscord size='0.7rem' style={{ verticalAlign: 'middle' }} /> button opens{' '}
            <Anchor href='https://discohook.app/' target='_blank' size='xs'>discohook.app</Anchor>{' '}
            pre-filled with your full embed — same fields, same colors, same layout — so you can see
            exactly how Discord will render it before you share the link.
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}
