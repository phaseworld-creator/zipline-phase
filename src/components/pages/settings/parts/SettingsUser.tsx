import SafeCopyButton from '@/components/SafeCopyButton';
import type { User } from '@/lib/db/models/user';
import { ApiError } from '@/lib/api/errors';
import { Response } from '@/lib/api/response';
import { fetchApi } from '@/lib/fetchApi';
import { useUserStore } from '@/lib/client/store/user';
import {
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Button,
  Code,
  Divider,
  FileButton,
  Group,
  Paper,
  PasswordInput,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconAsteriskSimple,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconKey,
  IconLock,
  IconPhoto,
  IconTrash,
  IconUser,
  IconUserCancel,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { mutate } from 'swr';
import useSWR from 'swr';
import { useShallow } from 'zustand/shallow';

export default function SettingsUser() {
  const [user, setUser] = useUserStore(useShallow((state) => [state.user, state.setUser]));

  const { data: tokenPayload } = useSWR<Response['/api/user/token']>('/api/user/token');

  if (!user) {
    return (
      <Paper withBorder p='sm'>
        <Title order={2}>User</Title>
        <Text c='dimmed' size='sm' mt='sm'>
          Loading…
        </Text>
      </Paper>
    );
  }

  return <Form user={user} setUser={setUser} token={tokenPayload?.token ?? ''} />;
}

function Form({ user, setUser, token }: { user: User; setUser: (u: User) => void; token: string }) {
  const [tokenShown, setTokenShown] = useState(false);
  const [resetKeyShown, setResetKeyShown] = useState(false);
  const resetRef = useRef<() => void>(null);

  // Fetch the current avatar separately (not in default userSelect)
  const { data: currentAvatar, mutate: mutateAvatar } = useSWR<string>('/api/user/avatar');

  // Fetch the reset key — only available to admins, 403 for regular users
  const { data: resetKeyData } = useSWR<{ resetKey: string }>(
    user.role === 'ADMIN' ? '/api/admin/reset-key' : null,
  );
  const resetKey = resetKeyData?.resetKey ?? null;
  const resetUrl = resetKey
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/admin/reset/${resetKey}`
    : '';

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Resize to max 256×256, then encode as JPEG at 80% — keeps payload < 100KB
      const MAX = 256;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      setAvatarPreview(dataUrl);
    };

    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  };

  const saveAvatar = async () => {
    if (!avatarPreview) return;
    setAvatarSaving(true);
    const { data, error } = await fetchApi<Response['/api/user']>('/api/user', 'PATCH', {
      avatar: avatarPreview,
    });
    setAvatarSaving(false);

    if (error) {
      notifications.show({ title: 'Failed to save avatar', message: error.error, color: 'red' });
      return;
    }

    if (data?.user) setUser(data.user);
    setAvatarPreview(null);
    resetRef.current?.();
    mutateAvatar();
    notifications.show({ message: 'Avatar updated', color: 'green', icon: <IconCheck size='1rem' /> });
  };

  const removeAvatar = async () => {
    const { data, error } = await fetchApi<Response['/api/user']>('/api/user', 'PATCH', { avatar: null });
    if (error) {
      notifications.show({ title: 'Failed to remove avatar', message: error.error, color: 'red' });
      return;
    }
    if (data?.user) setUser(data.user);
    setAvatarPreview(null);
    resetRef.current?.();
    mutateAvatar();
    notifications.show({ message: 'Avatar removed', color: 'orange', icon: <IconTrash size='1rem' /> });
  };

  const form = useForm({
    initialValues: {
      username: user.username,
      password: '',
      currentPassword: '',
    },
    validate: {
      username: (value) => (value.length < 1 ? 'Username is required' : null),
      currentPassword: (value, values) =>
        values.password && !value ? 'Enter your current password to change it' : null,
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    const send: {
      username?: string;
      password?: string;
      currentPassword?: string;
    } = {};

    if (values.username !== user.username) send['username'] = values.username.trim();
    if (values.password) {
      send['password'] = values.password.trim();
      send['currentPassword'] = values.currentPassword;
    }

    const { data, error } = await fetchApi<Response['/api/user']>('/api/user', 'PATCH', send);

    if (!data && error) {
      if (ApiError.check(error, 1039)) {
        form.setFieldError('username', error.error);
      } else if (ApiError.check(error, 1066) || ApiError.check(error, 1067)) {
        form.setFieldError('currentPassword', error.error);
      } else {
        notifications.show({
          title: 'Error while updating user',
          message: error.error,
          color: 'red',
          icon: <IconUserCancel size='1rem' />,
        });
      }

      return;
    }

    if (!data?.user) return;

    form.setFieldValue('password', '');
    form.setFieldValue('currentPassword', '');

    mutate('/api/user');
    mutate('/api/user/token');
    setUser(data.user);
    notifications.show({
      message: 'User updated',
      color: 'green',
      icon: <IconCheck size='1rem' />,
    });
  };

  return (
    <Paper withBorder p='sm'>
      <Title order={2}>User</Title>
      <Text c='dimmed' size='sm' mb='sm'>
        {user.id}
      </Text>

      {/* ── Avatar ── */}
      <Box mb='md'>
        <Text size='sm' fw={600} mb='xs'>Profile Picture</Text>
        <Group gap='md' align='flex-end'>
          <Avatar
            src={avatarPreview ?? currentAvatar ?? null}
            size={72}
            radius='xl'
            style={{ border: '2px solid var(--mantine-color-default-border)' }}
          >
            <IconUser size='2rem' />
          </Avatar>
          <Stack gap='xs'>
            <FileButton resetRef={resetRef} onChange={handleAvatarFile} accept='image/*'>
              {(props) => (
                <Button
                  {...props}
                  size='xs'
                  variant='light'
                  leftSection={<IconPhoto size='0.85rem' />}
                >
                  Choose image
                </Button>
              )}
            </FileButton>
            {avatarPreview && (
              <Button
                size='xs'
                variant='filled'
                color='green'
                leftSection={<IconDeviceFloppy size='0.85rem' />}
                loading={avatarSaving}
                onClick={saveAvatar}
              >
                Save avatar
              </Button>
            )}
            {(currentAvatar || avatarPreview) && !avatarSaving && (
              <Button
                size='xs'
                variant='subtle'
                color='red'
                leftSection={<IconTrash size='0.85rem' />}
                onClick={removeAvatar}
              >
                Remove
              </Button>
            )}
          </Stack>
        </Group>
      </Box>

      <form onSubmit={form.onSubmit(onSubmit)}>
        <TextInput
          rightSection={
            <SafeCopyButton value={token} timeout={1000}>
              {({ copied, copy }) => (
                <Tooltip label='Click to copy token'>
                  <ActionIcon onClick={copy} variant='subtle' color='gray'>
                    {copied ? <IconCheck color='green' size='1rem' /> : <IconCopy size='1rem' />}
                  </ActionIcon>
                </Tooltip>
              )}
            </SafeCopyButton>
          }
          // @ts-ignore this works trust
          component='span'
          label='Token'
          onClick={() => setTokenShown(true)}
          leftSection={<IconKey size='1rem' />}
        >
          <ScrollArea scrollbarSize={5}>{tokenShown ? token : '[click to reveal]'}</ScrollArea>
        </TextInput>

        {/* ── Reset Key — admin only ── */}
        {user.role === 'ADMIN' && (
          <>
            <Divider my='sm' label='Instance reset' labelPosition='left' />
            <Alert
              icon={<IconAlertTriangle size='1rem' />}
              color='orange'
              variant='light'
              mb='xs'
              styles={{ message: { fontSize: '0.8rem' } }}
            >
              The reset key permanently deletes all users and restores first-time setup mode.
              Keep it private — anyone with it and access to your URL can wipe the instance.
            </Alert>
            <Box
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 6,
                padding: '8px 12px',
              }}
            >
              <Group gap='xs' mb={4}>
                <IconLock size='0.85rem' style={{ color: 'var(--mantine-color-dimmed)' }} />
                <Text size='xs' fw={600} c='dimmed'>Reset Key</Text>
              </Group>
              <Group gap='xs' align='center'>
                <Code
                  style={{
                    flex: 1,
                    fontSize: '0.7rem',
                    wordBreak: 'break-all',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                  onClick={() => setResetKeyShown((v) => !v)}
                >
                  {resetKey
                    ? (resetKeyShown ? resetKey : '•'.repeat(32) + ' [click to reveal]')
                    : 'Loading…'}
                </Code>
                {resetKey && (
                  <SafeCopyButton value={resetKey} timeout={1500}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied!' : 'Copy reset key'}>
                        <ActionIcon size='sm' variant='subtle' color={copied ? 'teal' : 'gray'} onClick={copy}>
                          {copied ? <IconCheck size='0.85rem' /> : <IconCopy size='0.85rem' />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </SafeCopyButton>
                )}
              </Group>
            </Box>
            {resetKey && (
              <Box
                style={{
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                }}
              >
                <Group gap='xs' mb={4}>
                  <Text size='xs' fw={600} c='dimmed'>Reset URL</Text>
                  <Text size='xs' c='dimmed'>(visit this to wipe the instance)</Text>
                </Group>
                <Group gap='xs' align='center'>
                  <Code
                    style={{
                      flex: 1,
                      fontSize: '0.7rem',
                      wordBreak: 'break-all',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {resetKeyShown ? resetUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/admin/reset/[hidden]`}
                  </Code>
                  {resetKey && (
                    <SafeCopyButton value={resetUrl} timeout={1500}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied!' : 'Copy reset URL'}>
                          <ActionIcon size='sm' variant='subtle' color={copied ? 'teal' : 'gray'} onClick={copy}>
                            {copied ? <IconCheck size='0.85rem' /> : <IconCopy size='0.85rem' />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </SafeCopyButton>
                  )}
                </Group>
              </Box>
            )}
          </>
        )}

        <TextInput
          label='Username'
          {...form.getInputProps('username')}
          leftSection={<IconUser size='1rem' />}
        />
        <PasswordInput
          label='Password'
          description='Leave blank to keep the same password'
          autoComplete='new-password'
          {...form.getInputProps('password')}
          leftSection={<IconAsteriskSimple size='1rem' />}
        />
        {form.values.password && (
          <PasswordInput
            label='Current password'
            description='Required to change your password.'
            autoComplete='current-password'
            {...form.getInputProps('currentPassword')}
            leftSection={<IconAsteriskSimple size='1rem' />}
          />
        )}

        <Button type='submit' mt='md' leftSection={<IconDeviceFloppy size='1rem' />}>
          Save
        </Button>
      </form>
    </Paper>
  );
}
