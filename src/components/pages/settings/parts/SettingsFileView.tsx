import type { User } from '@/lib/db/models/user';
import { Response } from '@/lib/api/response';
import { fetchApi } from '@/lib/fetchApi';
import { useUserStore } from '@/lib/client/store/user';
import {
  Anchor,
  Box,
  Button,
  ColorInput,
  Divider,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCheck,
  IconDeviceFloppy,
  IconFileX,
} from '@tabler/icons-react';
import { mutate } from 'swr';
import { useShallow } from 'zustand/shallow';

const alignIcons: Record<string, React.ReactNode> = {
  left: <IconAlignLeft size='1rem' />,
  center: <IconAlignCenter size='1rem' />,
  right: <IconAlignRight size='1rem' />,
};

/* ─── Discord embed preview ──────────────────────────────────── */
function DiscordEmbedPreview({
  siteName,
  title,
  description,
  color,
  username,
}: {
  siteName: string;
  title: string;
  description: string;
  color: string;
  username: string;
}) {
  const borderColor = color && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#6366f1';
  const now = new Date();
  const timeStr = `Today at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const resolveVar = (str: string) =>
    str
      .replace(/\{file\.name\}/g, 'photo.png')
      .replace(/\{file\.originalName\}/g, 'photo.png')
      .replace(/\{file\.size(?:::\w+)?\}/g, '2.4 MB')
      .replace(/\{file\.type\}/g, 'image/png')
      .replace(/\{file\.views\}/g, '12')
      .replace(/\{file\.createdAt(?:::\w+)?\}/g, new Date().toLocaleDateString())
      .replace(/\{user\.username\}/g, username || 'user')
      .replace(/\{[^}]+\}/g, '…');

  return (
    <Box>
      <Text size='xs' fw={600} c='dimmed' mb={8} tt='uppercase' style={{ letterSpacing: '0.05em' }}>
        Discord embed preview
      </Text>

      {/* Discord dark background */}
      <Box
        style={{
          background: '#313338',
          borderRadius: 8,
          padding: '12px 16px',
          fontFamily: '"gg sans", "Noto Sans", system-ui, sans-serif',
          maxWidth: 432,
        }}
      >
        {/* Bot message row — icon + name */}
        <Group gap='xs' mb={4} align='center'>
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
              flexShrink: 0,
            }}
          />
          <Group gap={6} align='baseline'>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: 500, lineHeight: 1 }}>
              {username || 'Zipline'}
            </Text>
            <Box
              style={{
                background: '#5865f2',
                color: '#fff',
                fontSize: 9,
                fontWeight: 600,
                padding: '1px 4px',
                borderRadius: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              App
            </Box>
            <Text style={{ color: '#949ba4', fontSize: 12 }}>Today at {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}</Text>
          </Group>
        </Group>

        {/* Message text */}
        <Text style={{ color: '#dbdee1', fontSize: 14, marginBottom: 4, paddingLeft: 44 }}>
          Check out this file!
        </Text>

        {/* Embed card */}
        <Box style={{ paddingLeft: 44 }}>
          <Box
            style={{
              background: '#2b2d31',
              borderRadius: 4,
              borderLeft: `4px solid ${borderColor}`,
              padding: '8px 12px 10px 12px',
              maxWidth: 360,
            }}
          >
            {/* site_name */}
            {siteName && (
              <Text
                style={{
                  color: '#dbdee1',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                {resolveVar(siteName)}
              </Text>
            )}

            {/* author / title — bold, accent color, acts as link */}
            {title && (
              <Text
                style={{
                  color: '#00aff4',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 2,
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                {resolveVar(title)}
              </Text>
            )}

            {/* description */}
            {description && (
              <Text
                style={{
                  color: '#dbdee1',
                  fontSize: 14,
                  marginTop: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {resolveVar(description)}
              </Text>
            )}

            {/* Timestamp footer */}
            <Text style={{ color: '#949ba4', fontSize: 11, marginTop: 8 }}>
              {timeStr}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Field guide */}
      <SimpleGrid cols={2} spacing={4} mt={10}>
        {[
          ['Site Name', 'top line of embed'],
          ['Title', 'clickable blue link'],
          ['Description', 'body text'],
          ['Color', 'left border color'],
        ].map(([field, role]) => (
          <Group key={field} gap={4}>
            <Text size='xs' fw={600} c='violet'>
              {field}:
            </Text>
            <Text size='xs' c='dimmed'>
              {role}
            </Text>
          </Group>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default function SettingsFileView() {
  const [user, setUser] = useUserStore(useShallow((state) => [state.user, state.setUser]));

  if (!user) {
    return (
      <Paper withBorder p='sm'>
        <Title order={2}>Viewing Files</Title>
        <Text c='dimmed' mt='xs'>
          Loading…
        </Text>
      </Paper>
    );
  }

  return <Form user={user} setUser={setUser} />;
}

function Form({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const form = useForm({
    initialValues: {
      enabled: user.view.enabled || false,
      disableTextFiles: user.view.disableTextFiles || false,
      content: user.view.content || '',
      embed: user.view.embed || false,
      embedMediaOnly: user.view.embedMediaOnly || false,
      embedTitle: user.view.embedTitle || '',
      embedDescription: user.view.embedDescription || '',
      embedSiteName: user.view.embedSiteName || '',
      embedColor: user.view.embedColor || '',
      align: user.view.align || 'left',
      showMimetype: user.view.showMimetype || false,
      showTags: user.view.showTags || false,
      showFolder: user.view.showFolder || false,
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    const view = {
      enabled: values.enabled,
      disableTextFiles: values.disableTextFiles,
      embed: values.embed,
      embedMediaOnly: values.embed ? false : values.embedMediaOnly,
      content: values.content.trim() || null,
      embedTitle: values.embedTitle.trim() || null,
      embedDescription: values.embedDescription.trim() || null,
      embedSiteName: values.embedSiteName.trim() || null,
      embedColor: values.embedColor.trim() || null,
      align: values.align,
      showMimetype: values.showMimetype,
      showTags: values.showTags,
      showFolder: values.showFolder,
    };

    const { data, error } = await fetchApi<Response['/api/user']>('/api/user', 'PATCH', {
      view,
    });

    if (!data && error) {
      notifications.show({
        title: 'Error while updating view settings',
        message: error.error,
        color: 'red',
        icon: <IconFileX size='1rem' />,
      });
    }

    if (!data?.user) return;

    mutate('/api/user');
    setUser(data.user);
    notifications.show({
      message: 'View settings updated',
      color: 'green',
      icon: <IconCheck size='1rem' />,
    });
  };

  return (
    <Paper withBorder p='sm'>
      <Title order={2}>Viewing Files</Title>
      <Text c='dimmed' mt='xs'>
        All text fields support using{' '}
        <Anchor target='_blank' href='https://zipline.diced.sh/docs/guides/variables/'>
          variables.
        </Anchor>
      </Text>
      <Stack gap='sm' mt='xs'>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm' mb='xs'>
            <Switch
              label='Disable text files'
              description='Disable viewing text files through view-routes. This has no effect on other file types and will work even if view-routes are disabled.'
              {...form.getInputProps('disableTextFiles', { type: 'checkbox' })}
            />

            <Switch
              label='Enable View Routes'
              description='Enable viewing files through customizable view-routes'
              {...form.getInputProps('enabled', { type: 'checkbox' })}
            />

            <Switch
              label='Show mimetype'
              description='Show the mimetype of the file in the view-route'
              disabled={!form.values.enabled}
              {...form.getInputProps('showMimetype', { type: 'checkbox' })}
            />

            <Switch
              label='Show tags'
              description="Show the file's tags in the view-route"
              disabled={!form.values.enabled}
              {...form.getInputProps('showTags', { type: 'checkbox' })}
            />

            <Switch
              label='Show folder'
              description='Show the name/link of the folder if possible in the view-route'
              disabled={!form.values.enabled}
              {...form.getInputProps('showFolder', { type: 'checkbox' })}
            />
          </SimpleGrid>

          <Textarea
            label='View Content'
            description='Change the content within view-routes. Most HTML is valid, while the use of JavaScript is unavailable.'
            disabled={!form.values.enabled}
            mb='xs'
            minRows={5}
            autosize
            {...form.getInputProps('content')}
          />

          <Select
            label='View Content Alignment'
            description='Change the alignment of the content within view-routes'
            data={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            renderOption={({ option }) => (
              <Group gap='xs'>
                {alignIcons[option.value]}
                {option.label}
              </Group>
            )}
            disabled={!form.values.enabled}
            {...form.getInputProps('align')}
          />

          <Divider my='sm' />

          <Switch
            label='Enable Embed'
            description='Enable the following embed properties. These properties take advantage of OpenGraph tags. View routes will need to be enabled for this to work.'
            disabled={!form.values.enabled}
            my='xs'
            {...form.getInputProps('embed', { type: 'checkbox' })}
            onChange={(event) => {
              form.getInputProps('embed', { type: 'checkbox' }).onChange(event);
              if (event.currentTarget.checked) {
                form.setFieldValue('embedMediaOnly', false);
              }
            }}
          />

          <Switch
            label='Media-only link preview'
            description='When embeds are off, still add OpenGraph image/video tags so Discord and similar apps unfurl the media only (no custom title, description, or site name). The URL you paste stays in the message as plain text.'
            disabled={!form.values.enabled || form.values.embed}
            my='xs'
            {...form.getInputProps('embedMediaOnly', { type: 'checkbox' })}
          />

          {/* Embed fields + live preview side by side */}
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing='lg' mt='xs'>
            <Stack gap='sm'>
              <TextInput
                label='Embed Site Name'
                description='Shown above the title (top of the embed)'
                placeholder='Zipline • {user.username}'
                disabled={!form.values.embed || !form.values.enabled}
                {...form.getInputProps('embedSiteName')}
              />
              <TextInput
                label='Embed Title'
                description='Bold link line — the main clickable heading'
                placeholder='{file.name}'
                disabled={!form.values.embed || !form.values.enabled}
                {...form.getInputProps('embedTitle')}
              />
              <TextInput
                label='Embed Description'
                description='Body text below the title'
                placeholder='Size: {file.size::bytes} • Views: {file.views}'
                disabled={!form.values.embed || !form.values.enabled}
                {...form.getInputProps('embedDescription')}
              />
              <ColorInput
                label='Embed Color'
                description='Left border color of the embed card'
                disabled={!form.values.embed || !form.values.enabled}
                {...form.getInputProps('embedColor')}
              />
            </Stack>

            {/* Live Discord embed preview */}
            <Box
              style={{
                opacity: form.values.embed && form.values.enabled ? 1 : 0.35,
                transition: 'opacity 0.2s',
              }}
            >
              <DiscordEmbedPreview
                siteName={form.values.embedSiteName}
                title={form.values.embedTitle}
                description={form.values.embedDescription}
                color={form.values.embedColor}
                username={user.username}
              />
            </Box>
          </SimpleGrid>

          <Group justify='left' mt='sm'>
            <Button type='submit' leftSection={<IconDeviceFloppy size='1rem' />}>
              Save
            </Button>
          </Group>
        </form>
      </Stack>
    </Paper>
  );
}

const alignIcons: Record<string, React.ReactNode> = {
  left: <IconAlignLeft size='1rem' />,
  center: <IconAlignCenter size='1rem' />,
  right: <IconAlignRight size='1rem' />,
};

export default function SettingsFileView() {
  const [user, setUser] = useUserStore(useShallow((state) => [state.user, state.setUser]));

  if (!user) {
    return (
      <Paper withBorder p='sm'>
        <Title order={2}>Viewing Files</Title>
        <Text c='dimmed' mt='xs'>
          Loading…
        </Text>
      </Paper>
    );
  }

  return <Form user={user} setUser={setUser} />;
}

function Form({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const form = useForm({
    initialValues: {
      enabled: user.view.enabled || false,
      disableTextFiles: user.view.disableTextFiles || false,
      content: user.view.content || '',
      embed: user.view.embed || false,
      embedMediaOnly: user.view.embedMediaOnly || false,
      embedTitle: user.view.embedTitle || '',
      embedDescription: user.view.embedDescription || '',
      embedSiteName: user.view.embedSiteName || '',
      embedColor: user.view.embedColor || '',
      align: user.view.align || 'left',
      showMimetype: user.view.showMimetype || false,
      showTags: user.view.showTags || false,
      showFolder: user.view.showFolder || false,
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    const view = {
      enabled: values.enabled,
      disableTextFiles: values.disableTextFiles,
      embed: values.embed,
      embedMediaOnly: values.embed ? false : values.embedMediaOnly,
      content: values.content.trim() || null,
      embedTitle: values.embedTitle.trim() || null,
      embedDescription: values.embedDescription.trim() || null,
      embedSiteName: values.embedSiteName.trim() || null,
      embedColor: values.embedColor.trim() || null,
      align: values.align,
      showMimetype: values.showMimetype,
      showTags: values.showTags,
      showFolder: values.showFolder,
    };

    const { data, error } = await fetchApi<Response['/api/user']>('/api/user', 'PATCH', {
      view,
    });

    if (!data && error) {
      notifications.show({
        title: 'Error while updating view settings',
        message: error.error,
        color: 'red',
        icon: <IconFileX size='1rem' />,
      });
    }

    if (!data?.user) return;

    mutate('/api/user');
    setUser(data.user);
    notifications.show({
      message: 'View settings updated',
      color: 'green',
      icon: <IconCheck size='1rem' />,
    });
  };

  return (
    <Paper withBorder p='sm'>
      <Title order={2}>Viewing Files</Title>
      <Text c='dimmed' mt='xs'>
        All text fields support using{' '}
        <Anchor target='_blank' href='https://zipline.diced.sh/docs/guides/variables/'>
          variables.
        </Anchor>
      </Text>
      <Stack gap='sm' mt='xs'>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm' mb='xs'>
            <Switch
              label='Disable text files'
              description='Disable viewing text files through view-routes. This has no effect on other file types and will work even if view-routes are disabled.'
              {...form.getInputProps('disableTextFiles', { type: 'checkbox' })}
            />

            <Switch
              label='Enable View Routes'
              description='Enable viewing files through customizable view-routes'
              {...form.getInputProps('enabled', { type: 'checkbox' })}
            />

            <Switch
              label='Show mimetype'
              description='Show the mimetype of the file in the view-route'
              disabled={!form.values.enabled}
              {...form.getInputProps('showMimetype', { type: 'checkbox' })}
            />

            <Switch
              label='Show tags'
              description="Show the file's tags in the view-route"
              disabled={!form.values.enabled}
              {...form.getInputProps('showTags', { type: 'checkbox' })}
            />

            <Switch
              label='Show folder'
              description='Show the name/link of the folder if possible in the view-route'
              disabled={!form.values.enabled}
              {...form.getInputProps('showFolder', { type: 'checkbox' })}
            />
          </SimpleGrid>

          <Textarea
            label='View Content'
            description='Change the content within view-routes. Most HTML is valid, while the use of JavaScript is unavailable.'
            disabled={!form.values.enabled}
            mb='xs'
            minRows={5}
            autosize
            {...form.getInputProps('content')}
          />

          <Select
            label='View Content Alignment'
            description='Change the alignment of the content within view-routes'
            data={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            renderOption={({ option }) => (
              <Group gap='xs'>
                {alignIcons[option.value]}
                {option.label}
              </Group>
            )}
            disabled={!form.values.enabled}
            {...form.getInputProps('align')}
          />

          <Divider my='sm' />

          <Switch
            label='Enable Embed'
            description='Enable the following embed properties. These properties take advantage of OpenGraph tags. View routes will need to be enabled for this to work.'
            disabled={!form.values.enabled}
            my='xs'
            {...form.getInputProps('embed', { type: 'checkbox' })}
            onChange={(event) => {
              form.getInputProps('embed', { type: 'checkbox' }).onChange(event);
              if (event.currentTarget.checked) {
                form.setFieldValue('embedMediaOnly', false);
              }
            }}
          />

          <Switch
            label='Media-only link preview'
            description='When embeds are off, still add OpenGraph image/video tags so Discord and similar apps unfurl the media only (no custom title, description, or site name). The URL you paste stays in the message as plain text.'
            disabled={!form.values.enabled || form.values.embed}
            my='xs'
            {...form.getInputProps('embedMediaOnly', { type: 'checkbox' })}
          />

          {/* Embed fields + live preview — handled above */}

          <Group justify='left' mt='sm'>
            <Button type='submit' leftSection={<IconDeviceFloppy size='1rem' />}>
              Save
            </Button>
          </Group>
        </form>
      </Stack>
    </Paper>
  );
}
