import type { Response } from '@/lib/api/response';
import { settingsOnSubmit } from '@/components/pages/serverSettings/settingsOnSubmit';
import useServerSettings from '@/components/pages/serverSettings/useServerSettings';
import {
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconLogin, IconPhoto } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

/* ─── Live preview ──────────────────────────────────────────── */
function LoginPreview({
  title,
  logoUrl,
  backgroundUrl,
  blur,
}: {
  title: string;
  logoUrl: string;
  backgroundUrl: string;
  blur: boolean;
}) {
  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        minHeight: 420,
        background: '#03070f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Mesh dots background */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          zIndex: 0,
        }}
      />

      {/* Custom background image */}
      {backgroundUrl && (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blur ? 'blur(10px)' : undefined,
            opacity: 0.25,
            zIndex: 1,
          }}
        />
      )}

      {/* Card */}
      <Box
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 340,
          padding: '32px 28px',
          background:
            'linear-gradient(135deg, rgba(129,140,248,0.06) 0%, rgba(3,7,18,0.85) 100%)',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: 16,
          backdropFilter: 'blur(12px)',
        }}
      >
        <Stack align='center' gap='xs' mb='lg'>
          {logoUrl ? (
            <Box
              component='img'
              src={logoUrl}
              alt='logo'
              style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Box
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: '#fff',
              }}
            >
              Z
            </Box>
          )}

          <Text
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '1.4rem',
              color: '#fff',
              letterSpacing: '-0.03em',
            }}
          >
            {title.trim() || 'Zipline'}
          </Text>
          <Text size='sm' c='dimmed'>
            Sign in to your account
          </Text>
        </Stack>

        {/* Fake form */}
        <Stack gap='sm'>
          <Box
            style={{
              height: 36,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <Box
            style={{
              height: 36,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <Box
            style={{
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
              opacity: 0.85,
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
}

/* ─── Form ──────────────────────────────────────────────────── */
function Form({ data }: { data: Response['/api/server/settings'] }) {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      websiteTitle: data.settings.websiteTitle ?? 'Zipline',
      websiteTitleLogo: data.settings.websiteTitleLogo ?? '',
      websiteLoginBackground: data.settings.websiteLoginBackground ?? '',
      websiteLoginBackgroundBlur: data.settings.websiteLoginBackgroundBlur ?? true,
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    const payload: Record<string, any> = {
      websiteTitle: values.websiteTitle.trim() || 'Zipline',
      websiteTitleLogo: values.websiteTitleLogo.trim() || null,
      websiteLoginBackground: values.websiteLoginBackground.trim() || null,
      websiteLoginBackgroundBlur: values.websiteLoginBackgroundBlur,
    };
    return settingsOnSubmit(navigate, form)(payload);
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Group align='flex-start' gap='xl' style={{ flexWrap: 'wrap' }}>
        {/* Controls */}
        <Stack gap='md' style={{ flex: '1 1 320px', minWidth: 280 }}>
          <TextInput
            label='Site Title'
            description='Shown inside the login card and browser tab'
            placeholder='Zipline'
            {...form.getInputProps('websiteTitle')}
          />

          <TextInput
            label='Logo URL'
            description='Image shown above the title. Leave blank for the default Z icon. [BROKEN]'
            placeholder='https://example.com/logo.png'
            leftSection={<IconPhoto size='1rem' />}
            {...form.getInputProps('websiteTitleLogo')}
          />

          <TextInput
            label='Background Image URL'
            description='Full-screen background behind the login card (shown at 25% opacity).'
            placeholder='https://example.com/bg.jpg'
            leftSection={<IconPhoto size='1rem' />}
            {...form.getInputProps('websiteLoginBackground')}
          />

          <Switch
            label='Blur background'
            description='Apply a 10px blur to the background image'
            {...form.getInputProps('websiteLoginBackgroundBlur', { type: 'checkbox' })}
          />

          <Group mt='xs'>
            <Button type='submit' leftSection={<IconDeviceFloppy size='1rem' />}>
              Save
            </Button>
          </Group>
        </Stack>

        {/* Live preview */}
        <Stack gap='xs' style={{ flex: '1 1 320px', minWidth: 280 }}>
          <Text size='sm' fw={600} c='dimmed' tt='uppercase' style={{ letterSpacing: '0.05em' }}>
            Live preview
          </Text>
          <LoginPreview
            title={form.values.websiteTitle}
            logoUrl={form.values.websiteTitleLogo}
            backgroundUrl={form.values.websiteLoginBackground}
            blur={form.values.websiteLoginBackgroundBlur}
          />
        </Stack>
      </Group>
    </form>
  );
}

/* ─── Page root ─────────────────────────────────────────────── */
export default function LoginCustomiser() {
  const { data, isLoading } = useServerSettings();

  return (
    <Paper withBorder p='md'>
      <Group mb='md' gap='xs'>
        <IconLogin size='1.4rem' />
        <Title order={2}>Login Page Customiser</Title>
      </Group>
      <Text c='dimmed' size='sm' mb='lg'>
        Customise the login page appearance. Changes apply immediately after saving.
      </Text>
      <Divider mb='lg' />

      <LoadingOverlay visible={isLoading} />
      {data && <Form data={data} />}
    </Paper>
  );
}
