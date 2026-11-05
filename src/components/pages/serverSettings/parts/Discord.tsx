import type { Response } from '@/lib/api/response';
import { fetchApi } from '@/lib/fetchApi';
import {
  Alert,
  Badge,
  Button,
  Code,
  Collapse,
  ColorInput,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBrandDiscord, IconDeviceFloppy, IconInfoCircle, IconSend } from '@tabler/icons-react';
import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsOnSubmit } from '../settingsOnSubmit';
import useServerSettings from '../useServerSettings';

const ComponentEmbedViewImport = lazy(() => import('@/components/ComponentEmbedView'));
function ComponentEmbedViewLazy({ config }: { config: unknown }) {
  return (
    <Suspense fallback={<Text size='xs' c='dimmed'>Loading preview...</Text>}>
      <ComponentEmbedViewImport config={config} />
    </Suspense>
  );
}

type DiscordEmbed = Record<string, any>;

/* ─── Webhook test button ───────────────────────────────────────── */

function TestWebhookButton({
  getWebhookUrl,
  getUsername,
  getAvatarUrl,
  useComponentsV2 = false,
}: {
  getWebhookUrl: () => string | null | undefined;
  getUsername?: () => string | null | undefined;
  getAvatarUrl?: () => string | null | undefined;
  useComponentsV2?: boolean;
}) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    const url = getWebhookUrl();
    if (!url?.trim()) {
      notifications.show({ message: 'Enter a webhook URL first', color: 'orange' });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await fetchApi<{ ok: boolean; status?: number; error?: string }>(
        '/api/server/settings/test-webhook',
        'POST',
        {
          webhookUrl: url.trim(),
          ...(getUsername?.()?.trim() && { username: getUsername!()!.trim() }),
          ...(getAvatarUrl?.()?.trim() && { avatarUrl: getAvatarUrl!()!.trim() }),
          useComponentsV2,
        },
      );

      if (error) {
        notifications.show({ title: 'Test failed', message: error.error, color: 'red' });
      } else if (data?.ok) {
        notifications.show({ title: 'Test sent!', message: 'Check your Discord channel.', color: 'teal' });
      } else {
        notifications.show({
          title: `Test failed (${data?.status ?? '?'})`,
          message: data?.error ?? 'Unknown error',
          color: 'red',
        });
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <Tooltip label={useComponentsV2 ? 'Send a CV2 test message' : 'Send a test embed'}>
      <Button
        size='compact-sm'
        variant='light'
        color='indigo'
        leftSection={<IconSend size='0.8rem' />}
        loading={testing}
        onClick={handleTest}
      >
        Test
      </Button>
    </Tooltip>
  );
}

/* ─── Component Embed (CV2) JSON editor ────────────────────────── */

const CV2_PLACEHOLDER = JSON.stringify(
  {
    enabled: true,
    accentColor: '#5865F2',
    components: [
      {
        type: 10,
        content: '## [{file.name}]({link.returned})\n{file.type} • {file.size::bytes}',
      },
    ],
  },
  null,
  2,
);

const CV2_PLACEHOLDER_NOOP = JSON.stringify(
  {
    enabled: true,
    accentColor: '#5865F2',
    components: [
      {
        type: 10,
        content: '## Notification\nSomething happened on your Zipline instance.',
      },
    ],
  },
  null,
  2,
);

function ComponentEmbedEditor({
  value,
  onChange,
  noLink = false,
}: {
  value: string;
  onChange: (v: string) => void;
  /** true for events with no file/url link (delete, signup) */
  noLink?: boolean;
}) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (raw: string) => {
    onChange(raw);
    if (!raw.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(raw);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  // Parse JSON for live preview — only when preview is open and JSON is valid
  const previewConfig = (() => {
    if (!showPreview || !value.trim() || jsonError) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  })();

  return (
    <Stack gap='xs'>
      <Group gap='xs' align='center' justify='space-between'>
        <Group gap='xs' align='center'>
          <Text size='sm' fw={600}>
            Component Embed (V2)
          </Text>
          <Badge
            size='xs'
            color='indigo'
            variant='light'
            leftSection={<IconBrandDiscord size='0.65rem' />}
          >
            CV2
          </Badge>
        </Group>
        {value.trim() && !jsonError && (
          <Button
            size='compact-xs'
            variant='subtle'
            color='indigo'
            onClick={() => setShowPreview((p) => !p)}
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </Button>
        )}
      </Group>

      <Alert icon={<IconInfoCircle size='1rem' />} color='indigo' variant='light' p='xs'>
        <Text size='xs'>
          Discord Components V2 replaces classic embeds with a composable block system. Set{' '}
          <Code fz='xs'>enabled: true</Code> to activate. Uses <Code fz='xs'>flags: 32768</Code>{' '}
          automatically — cannot be mixed with classic embeds.
          {noLink && (
            <>
              {' '}
              Template variables like <Code fz='xs'>{'{user.username}'}</Code> and{' '}
              <Code fz='xs'>{'{file.name}'}</Code> are available but{' '}
              <Code fz='xs'>{'{link.*}'}</Code> variables are <strong>not</strong> available for
              this event.
            </>
          )}
        </Text>
      </Alert>

      <Textarea
        placeholder={noLink ? CV2_PLACEHOLDER_NOOP : CV2_PLACEHOLDER}
        minRows={8}
        maxRows={20}
        autosize
        value={value}
        onChange={(e) => handleChange(e.currentTarget.value)}
        error={jsonError}
        styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
      />

      {!jsonError && value.trim() && (
        <Text size='xs' c='teal'>
          ✓ Valid JSON
        </Text>
      )}

      {/* Live preview */}
      {showPreview && previewConfig && (
        <Paper withBorder p='sm' style={{ background: '#313338', borderRadius: 8 }}>
          <Text size='xs' c='dimmed' mb='xs'>
            Preview (template variables not resolved)
          </Text>
          <ComponentEmbedViewLazy config={previewConfig} />
        </Paper>
      )}

      {value.trim() && (
        <Button
          size='compact-xs'
          variant='subtle'
          color='gray'
          onClick={() => {
            onChange('');
            setJsonError(null);
            setShowPreview(false);
          }}
        >
          Clear
        </Button>
      )}
    </Stack>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────── */

function parseComponentEmbed(raw: string | null | undefined): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return '';
  }
}

function serializeComponentEmbed(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/* ─── Main component ────────────────────────────────────────────── */

export default function Discord() {
  const { data, isLoading } = useServerSettings();

  return (
    <>
      <LoadingOverlay visible={isLoading} />
      {data ? <Form data={data} isLoading={isLoading} /> : null}
    </>
  );
}

function Form({ data, isLoading }: { data: Response['/api/server/settings']; isLoading: boolean }) {
  const navigate = useNavigate();

  /* ── Global / main ── */
  const formMain = useForm({
    initialValues: {
      discordWebhookUrl: data.settings.discordWebhookUrl,
      discordUsername: data.settings.discordUsername,
      discordAvatarUrl: data.settings.discordAvatarUrl,
    },
  });

  const onSubmitMain = async (values: typeof formMain.values) => {
    const sendValues: Record<string, any> = {};
    sendValues.discordWebhookUrl =
      values.discordWebhookUrl?.trim() === '' ? null : values.discordWebhookUrl?.trim();
    sendValues.discordUsername =
      values.discordUsername?.trim() === '' ? null : values.discordUsername?.trim();
    sendValues.discordAvatarUrl =
      values.discordAvatarUrl?.trim() === '' ? null : values.discordAvatarUrl?.trim();
    return settingsOnSubmit(navigate, formMain)(sendValues);
  };

  /* ── On Upload ── */
  const formOnUpload = useForm({
    initialValues: {
      discordOnUploadWebhookUrl: data.settings.discordOnUploadWebhookUrl,
      discordOnUploadUsername: data.settings.discordOnUploadUsername,
      discordOnUploadAvatarUrl: data.settings.discordOnUploadAvatarUrl,
      discordOnUploadContent: data.settings.discordOnUploadContent,

      discordOnUploadEmbed: Boolean(data.settings.discordOnUploadEmbed),
      discordOnUploadEmbedTitle: (data.settings.discordOnUploadEmbed as DiscordEmbed | null)?.title || '',
      discordOnUploadEmbedDescription:
        (data.settings.discordOnUploadEmbed as DiscordEmbed | null)?.description || '',
      discordOnUploadEmbedFooter:
        (data.settings.discordOnUploadEmbed as DiscordEmbed | null)?.footer || '',
      discordOnUploadEmbedColor:
        (data.settings.discordOnUploadEmbed as DiscordEmbed | null)?.color || '',
      discordOnUploadEmbedThumbnail: !!(
        data.settings.discordOnUploadEmbed as DiscordEmbed | null
      )?.thumbnail,
      discordOnUploadEmbedImageOrVideo: !!(
        data.settings.discordOnUploadEmbed as DiscordEmbed | null
      )?.imageOrVideo,
      discordOnUploadEmbedTimestamp: !!(
        data.settings.discordOnUploadEmbed as DiscordEmbed | null
      )?.timestamp,
      discordOnUploadEmbedUrl: !!(data.settings.discordOnUploadEmbed as DiscordEmbed | null)?.url,

      discordOnUploadComponentEmbedEnabled: !!(
        data.settings as any
      ).discordOnUploadComponentEmbed,
      discordOnUploadComponentEmbedJson: parseComponentEmbed(
        (data.settings as any).discordOnUploadComponentEmbed,
      ),
    },
    enhanceGetInputProps: (payload) => ({
      disabled: data.tampered.includes(payload.field) || false,
    }),
  });

  /* ── On Shorten ── */
  const formOnShorten = useForm({
    initialValues: {
      discordOnShortenWebhookUrl: data.settings.discordOnShortenWebhookUrl,
      discordOnShortenUsername: data.settings.discordOnShortenUsername,
      discordOnShortenAvatarUrl: data.settings.discordOnShortenAvatarUrl,
      discordOnShortenContent: data.settings.discordOnShortenContent,

      discordOnShortenEmbed: Boolean(data.settings.discordOnShortenEmbed),
      discordOnShortenEmbedTitle:
        (data.settings.discordOnShortenEmbed as DiscordEmbed | null)?.title || '',
      discordOnShortenEmbedDescription:
        (data.settings.discordOnShortenEmbed as DiscordEmbed | null)?.description || '',
      discordOnShortenEmbedFooter:
        (data.settings.discordOnShortenEmbed as DiscordEmbed | null)?.footer || '',
      discordOnShortenEmbedColor:
        (data.settings.discordOnShortenEmbed as DiscordEmbed | null)?.color || '',
      discordOnShortenEmbedTimestamp: !!(
        data.settings.discordOnShortenEmbed as DiscordEmbed | null
      )?.timestamp,
      discordOnShortenEmbedUrl: !!(data.settings.discordOnShortenEmbed as DiscordEmbed | null)?.url,

      discordOnShortenComponentEmbedEnabled: !!(
        data.settings as any
      ).discordOnShortenComponentEmbed,
      discordOnShortenComponentEmbedJson: parseComponentEmbed(
        (data.settings as any).discordOnShortenComponentEmbed,
      ),
    },
  });

  /* ── On Delete ── */
  const formOnDelete = useForm({
    initialValues: {
      discordOnDeleteWebhookUrl: (data.settings as any).discordOnDeleteWebhookUrl ?? '',
      discordOnDeleteUsername: (data.settings as any).discordOnDeleteUsername ?? '',
      discordOnDeleteAvatarUrl: (data.settings as any).discordOnDeleteAvatarUrl ?? '',
      discordOnDeleteContent: (data.settings as any).discordOnDeleteContent ?? '',

      discordOnDeleteComponentEmbedEnabled: !!(data.settings as any).discordOnDeleteComponentEmbed,
      discordOnDeleteComponentEmbedJson: parseComponentEmbed(
        (data.settings as any).discordOnDeleteComponentEmbed,
      ),
    },
  });

  /* ── On Signup ── */
  const formOnSignup = useForm({
    initialValues: {
      discordOnSignupWebhookUrl: (data.settings as any).discordOnSignupWebhookUrl ?? '',
      discordOnSignupUsername: (data.settings as any).discordOnSignupUsername ?? '',
      discordOnSignupAvatarUrl: (data.settings as any).discordOnSignupAvatarUrl ?? '',
      discordOnSignupContent: (data.settings as any).discordOnSignupContent ?? '',

      discordOnSignupComponentEmbedEnabled: !!(data.settings as any).discordOnSignupComponentEmbed,
      discordOnSignupComponentEmbedJson: parseComponentEmbed(
        (data.settings as any).discordOnSignupComponentEmbed,
      ),
    },
  });

  /* ── Submit: upload / shorten (classic embed + CV2) ── */
  const onSubmitNotif =
    (type: 'upload' | 'shorten') => async (values: Record<string, any>) => {
      const sendValues: Record<string, any> = {};
      const prefix = type === 'upload' ? 'discordOnUpload' : 'discordOnShorten';

      sendValues[`${prefix}WebhookUrl`] =
        values[`${prefix}WebhookUrl`]?.trim() === ''
          ? null
          : values[`${prefix}WebhookUrl`]?.trim();
      sendValues[`${prefix}Username`] =
        values[`${prefix}Username`]?.trim() === '' ? null : values[`${prefix}Username`]?.trim();
      sendValues[`${prefix}AvatarUrl`] =
        values[`${prefix}AvatarUrl`]?.trim() === '' ? null : values[`${prefix}AvatarUrl`]?.trim();
      sendValues[`${prefix}Content`] =
        values[`${prefix}Content`]?.trim() === '' ? null : values[`${prefix}Content`]?.trim();

      if (!values[`${prefix}Embed`]) {
        sendValues[`${prefix}Embed`] = null;
      } else {
        sendValues[`${prefix}Embed`] = {
          title:
            values[`${prefix}EmbedTitle`]?.trim() === ''
              ? null
              : values[`${prefix}EmbedTitle`]?.trim(),
          description:
            values[`${prefix}EmbedDescription`]?.trim() === ''
              ? null
              : values[`${prefix}EmbedDescription`]?.trim(),
          footer:
            values[`${prefix}EmbedFooter`]?.trim() === ''
              ? null
              : values[`${prefix}EmbedFooter`]?.trim(),
          color:
            values[`${prefix}EmbedColor`]?.trim() === ''
              ? null
              : values[`${prefix}EmbedColor`]?.trim(),
          thumbnail: values[`${prefix}EmbedThumbnail`],
          imageOrVideo: values[`${prefix}EmbedImageOrVideo`],
          timestamp: values[`${prefix}EmbedTimestamp`],
          url: values[`${prefix}EmbedUrl`],
        };
      }

      // CV2 component embed
      if (values[`${prefix}ComponentEmbedEnabled`]) {
        sendValues[`${prefix}ComponentEmbed`] = serializeComponentEmbed(
          values[`${prefix}ComponentEmbedJson`],
        );
      } else {
        sendValues[`${prefix}ComponentEmbed`] = null;
      }

      return settingsOnSubmit(
        navigate,
        type === 'upload' ? formOnUpload : formOnShorten,
      )(sendValues);
    };

  /* ── Submit: delete ── */
  const onSubmitDelete = async (values: typeof formOnDelete.values) => {
    const sendValues: Record<string, any> = {};
    sendValues.discordOnDeleteWebhookUrl =
      values.discordOnDeleteWebhookUrl?.trim() === ''
        ? null
        : values.discordOnDeleteWebhookUrl?.trim();
    sendValues.discordOnDeleteUsername =
      values.discordOnDeleteUsername?.trim() === '' ? null : values.discordOnDeleteUsername?.trim();
    sendValues.discordOnDeleteAvatarUrl =
      values.discordOnDeleteAvatarUrl?.trim() === ''
        ? null
        : values.discordOnDeleteAvatarUrl?.trim();
    sendValues.discordOnDeleteContent =
      values.discordOnDeleteContent?.trim() === '' ? null : values.discordOnDeleteContent?.trim();

    sendValues.discordOnDeleteComponentEmbed = values.discordOnDeleteComponentEmbedEnabled
      ? serializeComponentEmbed(values.discordOnDeleteComponentEmbedJson)
      : null;

    return settingsOnSubmit(navigate, formOnDelete)(sendValues);
  };

  /* ── Submit: signup ── */
  const onSubmitSignup = async (values: typeof formOnSignup.values) => {
    const sendValues: Record<string, any> = {};
    sendValues.discordOnSignupWebhookUrl =
      values.discordOnSignupWebhookUrl?.trim() === ''
        ? null
        : values.discordOnSignupWebhookUrl?.trim();
    sendValues.discordOnSignupUsername =
      values.discordOnSignupUsername?.trim() === '' ? null : values.discordOnSignupUsername?.trim();
    sendValues.discordOnSignupAvatarUrl =
      values.discordOnSignupAvatarUrl?.trim() === ''
        ? null
        : values.discordOnSignupAvatarUrl?.trim();
    sendValues.discordOnSignupContent =
      values.discordOnSignupContent?.trim() === '' ? null : values.discordOnSignupContent?.trim();

    sendValues.discordOnSignupComponentEmbed = values.discordOnSignupComponentEmbedEnabled
      ? serializeComponentEmbed(values.discordOnSignupComponentEmbedJson)
      : null;

    return settingsOnSubmit(navigate, formOnSignup)(sendValues);
  };

  return (
    <>
      {/* ── Global ── */}
      <form onSubmit={formMain.onSubmit(onSubmitMain)}>
        <TextInput
          label='Webhook URL'
          description='The Discord webhook URL to send notifications to'
          placeholder='https://discord.com/api/webhooks/...'
          {...formMain.getInputProps('discordWebhookUrl')}
        />

        <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
          <TextInput
            label='Username'
            description='The username to send notifications as'
            {...formMain.getInputProps('discordUsername')}
          />

          <TextInput
            label='Avatar URL'
            description='The avatar for the webhook'
            placeholder='https://example.com/avatar.png'
            {...formMain.getInputProps('discordAvatarUrl')}
          />
        </SimpleGrid>

        <Button type='submit' mt='md' loading={isLoading} leftSection={<IconDeviceFloppy size='1rem' />}>
          Save
        </Button>
      </form>

      {/* ── Upload & Shorten side by side ── */}
      <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
        {/* On Upload */}
        <Paper withBorder p='sm'>
          <Title order={3}>On Upload</Title>

          <form onSubmit={formOnUpload.onSubmit(onSubmitNotif('upload'))}>
            <TextInput
              mt='md'
              label='Webhook URL'
              description='If blank, the main webhook URL will be used'
              placeholder='https://discord.com/api/webhooks/...'
              {...formOnUpload.getInputProps('discordOnUploadWebhookUrl')}
            />

            <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
              <TextInput
                label='Username'
                description='If blank, the main username will be used'
                {...formOnUpload.getInputProps('discordOnUploadUsername')}
              />
              <TextInput
                label='Avatar URL'
                description='If blank, the main avatar will be used'
                placeholder='https://example.com/avatar.png'
                {...formOnUpload.getInputProps('discordOnUploadAvatarUrl')}
              />
            </SimpleGrid>

            <Textarea
              mt='md'
              label='Content'
              description='Plain text message content'
              minRows={1}
              maxRows={7}
              {...formOnUpload.getInputProps('discordOnUploadContent')}
            />

            {/* Classic embed */}
            <Switch
              mt='md'
              label='Classic Embed'
              description='Send as a classic Discord embed'
              {...formOnUpload.getInputProps('discordOnUploadEmbed', { type: 'checkbox' })}
            />

            <Collapse expanded={formOnUpload.values.discordOnUploadEmbed}>
              <Paper withBorder p='sm' mt='md'>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
                  <TextInput
                    label='Title'
                    {...formOnUpload.getInputProps('discordOnUploadEmbedTitle')}
                  />
                  <TextInput
                    label='Description'
                    {...formOnUpload.getInputProps('discordOnUploadEmbedDescription')}
                  />
                  <TextInput
                    label='Footer'
                    {...formOnUpload.getInputProps('discordOnUploadEmbedFooter')}
                  />
                  <ColorInput
                    label='Color'
                    {...formOnUpload.getInputProps('discordOnUploadEmbedColor')}
                  />
                  <Switch
                    label='Thumbnail'
                    description="Show the file as a thumbnail if it's an image"
                    {...formOnUpload.getInputProps('discordOnUploadEmbedThumbnail', {
                      type: 'checkbox',
                    })}
                  />
                  <Switch
                    label='Image/Video'
                    description='Show the image or video inline'
                    {...formOnUpload.getInputProps('discordOnUploadEmbedImageOrVideo', {
                      type: 'checkbox',
                    })}
                  />
                  <Switch
                    label='Timestamp'
                    {...formOnUpload.getInputProps('discordOnUploadEmbedTimestamp', {
                      type: 'checkbox',
                    })}
                  />
                  <Switch
                    label='URL'
                    description='Makes the title a link to the file'
                    {...formOnUpload.getInputProps('discordOnUploadEmbedUrl', { type: 'checkbox' })}
                  />
                </SimpleGrid>
              </Paper>
            </Collapse>

            {/* CV2 component embed */}
            <Switch
              mt='md'
              label='Component Embed (V2)'
              description='Use Discord Components V2 instead of a classic embed. Cannot be combined with classic embeds.'
              checked={formOnUpload.values.discordOnUploadComponentEmbedEnabled}
              onChange={(e) =>
                formOnUpload.setFieldValue(
                  'discordOnUploadComponentEmbedEnabled',
                  e.currentTarget.checked,
                )
              }
            />

            <Collapse expanded={formOnUpload.values.discordOnUploadComponentEmbedEnabled}>
              <Paper withBorder p='sm' mt='md'>
                <ComponentEmbedEditor
                  value={formOnUpload.values.discordOnUploadComponentEmbedJson}
                  onChange={(v) =>
                    formOnUpload.setFieldValue('discordOnUploadComponentEmbedJson', v)
                  }
                />
              </Paper>
            </Collapse>

            <Group mt='md' gap='xs'>
              <Button
                type='submit'
                loading={isLoading}
                leftSection={<IconDeviceFloppy size='1rem' />}
              >
                Save
              </Button>
              <TestWebhookButton
                getWebhookUrl={() => formOnUpload.values.discordOnUploadWebhookUrl || formMain.values.discordWebhookUrl}
                getUsername={() => formOnUpload.values.discordOnUploadUsername || formMain.values.discordUsername}
                getAvatarUrl={() => formOnUpload.values.discordOnUploadAvatarUrl || formMain.values.discordAvatarUrl}
                useComponentsV2={formOnUpload.values.discordOnUploadComponentEmbedEnabled}
              />
            </Group>
          </form>
        </Paper>

        {/* On Shorten */}
        <Paper withBorder p='sm'>
          <Title order={3}>On Shorten</Title>

          <form onSubmit={formOnShorten.onSubmit(onSubmitNotif('shorten'))}>
            <TextInput
              mt='md'
              label='Webhook URL'
              description='If blank, the main webhook URL will be used'
              placeholder='https://discord.com/api/webhooks/...'
              {...formOnShorten.getInputProps('discordOnShortenWebhookUrl')}
            />

            <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
              <TextInput
                label='Username'
                description='If blank, the main username will be used'
                {...formOnShorten.getInputProps('discordOnShortenUsername')}
              />
              <TextInput
                label='Avatar URL'
                description='If blank, the main avatar will be used'
                placeholder='https://example.com/avatar.png'
                {...formOnShorten.getInputProps('discordOnShortenAvatarUrl')}
              />
            </SimpleGrid>

            <Textarea
              mt='md'
              label='Content'
              description='Plain text message content'
              minRows={1}
              maxRows={7}
              {...formOnShorten.getInputProps('discordOnShortenContent')}
            />

            {/* Classic embed */}
            <Switch
              mt='md'
              label='Classic Embed'
              description='Send as a classic Discord embed'
              {...formOnShorten.getInputProps('discordOnShortenEmbed', { type: 'checkbox' })}
            />

            <Collapse expanded={formOnShorten.values.discordOnShortenEmbed}>
              <Paper withBorder p='sm' mt='md'>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
                  <TextInput
                    label='Title'
                    {...formOnShorten.getInputProps('discordOnShortenEmbedTitle')}
                  />
                  <TextInput
                    label='Description'
                    {...formOnShorten.getInputProps('discordOnShortenEmbedDescription')}
                  />
                  <TextInput
                    label='Footer'
                    {...formOnShorten.getInputProps('discordOnShortenEmbedFooter')}
                  />
                  <ColorInput
                    label='Color'
                    {...formOnShorten.getInputProps('discordOnShortenEmbedColor')}
                  />
                  <Switch
                    label='Timestamp'
                    {...formOnShorten.getInputProps('discordOnShortenEmbedTimestamp', {
                      type: 'checkbox',
                    })}
                  />
                  <Switch
                    label='URL'
                    description='Makes the title a link to the URL'
                    {...formOnShorten.getInputProps('discordOnShortenEmbedUrl', { type: 'checkbox' })}
                  />
                </SimpleGrid>
              </Paper>
            </Collapse>

            {/* CV2 component embed */}
            <Switch
              mt='md'
              label='Component Embed (V2)'
              description='Use Discord Components V2 instead of a classic embed. Cannot be combined with classic embeds.'
              checked={formOnShorten.values.discordOnShortenComponentEmbedEnabled}
              onChange={(e) =>
                formOnShorten.setFieldValue(
                  'discordOnShortenComponentEmbedEnabled',
                  e.currentTarget.checked,
                )
              }
            />

            <Collapse expanded={formOnShorten.values.discordOnShortenComponentEmbedEnabled}>
              <Paper withBorder p='sm' mt='md'>
                <ComponentEmbedEditor
                  value={formOnShorten.values.discordOnShortenComponentEmbedJson}
                  onChange={(v) =>
                    formOnShorten.setFieldValue('discordOnShortenComponentEmbedJson', v)
                  }
                />
              </Paper>
            </Collapse>

            <Group mt='md' gap='xs'>
              <Button
                type='submit'
                loading={isLoading}
                leftSection={<IconDeviceFloppy size='1rem' />}
              >
                Save
              </Button>
              <TestWebhookButton
                getWebhookUrl={() => formOnShorten.values.discordOnShortenWebhookUrl || formMain.values.discordWebhookUrl}
                getUsername={() => formOnShorten.values.discordOnShortenUsername || formMain.values.discordUsername}
                getAvatarUrl={() => formOnShorten.values.discordOnShortenAvatarUrl || formMain.values.discordAvatarUrl}
                useComponentsV2={formOnShorten.values.discordOnShortenComponentEmbedEnabled}
              />
            </Group>
          </form>
        </Paper>
      </SimpleGrid>

      {/* ── Delete & Signup side by side ── */}
      <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
        {/* On Delete */}
        <Paper withBorder p='sm'>
          <Title order={3}>On Delete</Title>

          <form onSubmit={formOnDelete.onSubmit(onSubmitDelete)}>
            <TextInput
              mt='md'
              label='Webhook URL'
              description='If blank, the main webhook URL will be used'
              placeholder='https://discord.com/api/webhooks/...'
              {...formOnDelete.getInputProps('discordOnDeleteWebhookUrl')}
            />

            <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
              <TextInput
                label='Username'
                description='If blank, the main username will be used'
                {...formOnDelete.getInputProps('discordOnDeleteUsername')}
              />
              <TextInput
                label='Avatar URL'
                description='If blank, the main avatar will be used'
                placeholder='https://example.com/avatar.png'
                {...formOnDelete.getInputProps('discordOnDeleteAvatarUrl')}
              />
            </SimpleGrid>

            <Textarea
              mt='md'
              label='Content'
              description='Plain text message. Supports {filename} and {user} placeholders.'
              minRows={1}
              maxRows={7}
              {...formOnDelete.getInputProps('discordOnDeleteContent')}
            />

            {/* CV2 component embed */}
            <Switch
              mt='md'
              label='Component Embed (V2)'
              description='Use Discord Components V2 for this notification'
              checked={formOnDelete.values.discordOnDeleteComponentEmbedEnabled}
              onChange={(e) =>
                formOnDelete.setFieldValue(
                  'discordOnDeleteComponentEmbedEnabled',
                  e.currentTarget.checked,
                )
              }
            />

            <Collapse expanded={formOnDelete.values.discordOnDeleteComponentEmbedEnabled}>
              <Paper withBorder p='sm' mt='md'>
                <ComponentEmbedEditor
                  noLink
                  value={formOnDelete.values.discordOnDeleteComponentEmbedJson}
                  onChange={(v) =>
                    formOnDelete.setFieldValue('discordOnDeleteComponentEmbedJson', v)
                  }
                />
              </Paper>
            </Collapse>

            <Group mt='md' gap='xs'>
              <Button
                type='submit'
                loading={isLoading}
                leftSection={<IconDeviceFloppy size='1rem' />}
              >
                Save
              </Button>
              <TestWebhookButton
                getWebhookUrl={() => formOnDelete.values.discordOnDeleteWebhookUrl || formMain.values.discordWebhookUrl}
                getUsername={() => formOnDelete.values.discordOnDeleteUsername || formMain.values.discordUsername}
                getAvatarUrl={() => formOnDelete.values.discordOnDeleteAvatarUrl || formMain.values.discordAvatarUrl}
                useComponentsV2={formOnDelete.values.discordOnDeleteComponentEmbedEnabled}
              />
            </Group>
          </form>
        </Paper>

        {/* On Signup */}
        <Paper withBorder p='sm'>
          <Title order={3}>On Signup</Title>

          <form onSubmit={formOnSignup.onSubmit(onSubmitSignup)}>
            <TextInput
              mt='md'
              label='Webhook URL'
              description='If blank, the main webhook URL will be used'
              placeholder='https://discord.com/api/webhooks/...'
              {...formOnSignup.getInputProps('discordOnSignupWebhookUrl')}
            />

            <SimpleGrid mt='md' cols={{ base: 1, md: 2 }} spacing='lg'>
              <TextInput
                label='Username'
                description='If blank, the main username will be used'
                {...formOnSignup.getInputProps('discordOnSignupUsername')}
              />
              <TextInput
                label='Avatar URL'
                description='If blank, the main avatar will be used'
                placeholder='https://example.com/avatar.png'
                {...formOnSignup.getInputProps('discordOnSignupAvatarUrl')}
              />
            </SimpleGrid>

            <Textarea
              mt='md'
              label='Content'
              description='Plain text message. Supports {user} placeholder.'
              minRows={1}
              maxRows={7}
              {...formOnSignup.getInputProps('discordOnSignupContent')}
            />

            {/* CV2 component embed */}
            <Switch
              mt='md'
              label='Component Embed (V2)'
              description='Use Discord Components V2 for this notification'
              checked={formOnSignup.values.discordOnSignupComponentEmbedEnabled}
              onChange={(e) =>
                formOnSignup.setFieldValue(
                  'discordOnSignupComponentEmbedEnabled',
                  e.currentTarget.checked,
                )
              }
            />

            <Collapse expanded={formOnSignup.values.discordOnSignupComponentEmbedEnabled}>
              <Paper withBorder p='sm' mt='md'>
                <ComponentEmbedEditor
                  noLink
                  value={formOnSignup.values.discordOnSignupComponentEmbedJson}
                  onChange={(v) =>
                    formOnSignup.setFieldValue('discordOnSignupComponentEmbedJson', v)
                  }
                />
              </Paper>
            </Collapse>

            <Group mt='md' gap='xs'>
              <Button
                type='submit'
                loading={isLoading}
                leftSection={<IconDeviceFloppy size='1rem' />}
              >
                Save
              </Button>
              <TestWebhookButton
                getWebhookUrl={() => formOnSignup.values.discordOnSignupWebhookUrl || formMain.values.discordWebhookUrl}
                getUsername={() => formOnSignup.values.discordOnSignupUsername || formMain.values.discordUsername}
                getAvatarUrl={() => formOnSignup.values.discordOnSignupAvatarUrl || formMain.values.discordAvatarUrl}
                useComponentsV2={formOnSignup.values.discordOnSignupComponentEmbedEnabled}
              />
            </Group>
          </form>
        </Paper>
      </SimpleGrid>
    </>
  );
}
