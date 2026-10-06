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
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconLogin, IconPhoto, IconError404 } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

/* ─── Particle animation ────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];
    const particleCount = 50;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      });
    }

    let animationId: number;

    function animate() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}

/* ─── Live preview ──────────────────────────────────────────── */
function LoginPreview({
  title,
  logoUrl,
  backgroundUrl,
  blur,
  particles,
  customCss,
}: {
  title: string;
  logoUrl: string;
  backgroundUrl: string;
  blur: boolean;
  particles: boolean;
  customCss: string;
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

      {/* Particle animation */}
      {particles && <ParticleCanvas />}

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

      {/* Custom CSS injection (for preview) */}
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      )}
    </Box>
  );
}

/* ─── Form ──────────────────────────────────────────────────── */
function Form({ data }: { data: Response['/api/server/settings'] }) {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      websiteTitle: (data.settings as any).websiteTitle ?? 'Zipline',
      websiteTitleLogo: (data.settings as any).websiteTitleLogo ?? '',
      websiteLoginBackground: (data.settings as any).websiteLoginBackground ?? '',
      websiteLoginBackgroundBlur: (data.settings as any).websiteLoginBackgroundBlur ?? true,
      websiteLoginParticles: (data.settings as any).websiteLoginParticles ?? false,
      websiteLoginCustomCss: (data.settings as any).websiteLoginCustomCss ?? '',
      website404Image: (data.settings as any).website404Image ?? '',
      website404Message: (data.settings as any).website404Message ?? '',
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    const payload: Record<string, any> = {
      websiteTitle: values.websiteTitle.trim() || 'Zipline',
      websiteTitleLogo: values.websiteTitleLogo.trim() || null,
      websiteLoginBackground: values.websiteLoginBackground.trim() || null,
      websiteLoginBackgroundBlur: values.websiteLoginBackgroundBlur,
      websiteLoginParticles: values.websiteLoginParticles,
      websiteLoginCustomCss: values.websiteLoginCustomCss.trim() || null,
      website404Image: values.website404Image.trim() || null,
      website404Message: values.website404Message.trim() || null,
    };
    return settingsOnSubmit(navigate, form)(payload);
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Tabs defaultValue='login'>
        <Tabs.List mb='md'>
          <Tabs.Tab value='login' leftSection={<IconLogin size='1rem' />}>
            Login Page
          </Tabs.Tab>
          <Tabs.Tab value='404' leftSection={<IconError404 size='1rem' />}>
            404 Page
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='login'>
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
                description='Image shown above the title. Leave blank for the default Z icon.'
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

              <Switch
                label='Particle animation'
                description='Enable floating particle animation in the background'
                {...form.getInputProps('websiteLoginParticles', { type: 'checkbox' })}
              />

              <Divider label='Advanced' />

              <Textarea
                label='Custom CSS'
                description='Freeform CSS injected into the login page <style> tag. For advanced customization.'
                placeholder='.login-card { border-radius: 24px; }'
                minRows={4}
                maxRows={12}
                autosize
                {...form.getInputProps('websiteLoginCustomCss')}
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
                particles={form.values.websiteLoginParticles}
                customCss={form.values.websiteLoginCustomCss}
              />
            </Stack>
          </Group>
        </Tabs.Panel>

        <Tabs.Panel value='404'>
          <Stack gap='md' style={{ maxWidth: 600 }}>
            <Text size='sm' c='dimmed'>
              Customize the 404 error page that users see when they visit a non-existent URL.
            </Text>

            <TextInput
              label='404 Image URL'
              description='Optional image to display on the 404 page'
              placeholder='https://example.com/404.png'
              leftSection={<IconPhoto size='1rem' />}
              {...form.getInputProps('website404Image')}
            />

            <Textarea
              label='404 Message'
              description='Custom message shown on the 404 page. Leave blank for the default message.'
              placeholder="Oops! This page doesn't exist."
              minRows={3}
              maxRows={6}
              autosize
              {...form.getInputProps('website404Message')}
            />

            {/* 404 Preview */}
            <Box
              style={{
                background: '#030712',
                borderRadius: 12,
                padding: '40px 20px',
                textAlign: 'center',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {form.values.website404Image && (
                <Box
                  component='img'
                  src={form.values.website404Image}
                  alt='404'
                  style={{
                    maxWidth: 200,
                    maxHeight: 200,
                    marginBottom: 16,
                    borderRadius: 8,
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <Title order={1} style={{ fontSize: '4rem', marginBottom: 8, color: '#6366f1' }}>
                404
              </Title>
              <Text size='lg' c='dimmed'>
                {form.values.website404Message.trim() || 'Page not found'}
              </Text>
            </Box>

            <Group mt='xs'>
              <Button type='submit' leftSection={<IconDeviceFloppy size='1rem' />}>
                Save
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
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
        <Title order={2}>Page Customiser</Title>
      </Group>
      <Text c='dimmed' size='sm' mb='lg'>
        Customise the login and error page appearance. Changes apply immediately after saving.
      </Text>
      <Divider mb='lg' />

      <LoadingOverlay visible={isLoading} />
      {data && <Form data={data} />}
    </Paper>
  );
}
