import ExternalAuthButton from '@/components/pages/login/ExternalAuthButton';
import LocalLogin from '@/components/pages/login/LocalLogin';
import PasskeyAuthButton from '@/components/pages/login/PasskeyAuthButton';
import SecureWarningModal from '@/components/pages/login/SecureWarningModal';
import TotpModal from '@/components/pages/login/TotpModal';
import { getWebClient } from '@/lib/api/detect';
import { ApiError } from '@/lib/api/errors';
import { fetchApi } from '@/lib/fetchApi';
import useLogin from '@/lib/client/hooks/useLogin';
import useObjectState from '@/lib/client/hooks/useObjectState';
import { useTitle } from '@/lib/client/hooks/useTitle';
import {
  Anchor,
  Box,
  Divider,
  Group,
  LoadingOverlay,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import {
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconBrandGoogleFilled,
  IconCheck,
  IconCircleKeyFilled,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import GenericError from '../../error/GenericError';
import { eitherTrue } from '@/lib/primitive';

/* ─────────────────────────────────────────────
   Particle mesh (reused from landing page)
───────────────────────────────────────────── */
function useMeshCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Node = { x: number; y: number; vx: number; vy: number };
    const nodes: Node[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.strokeStyle = `rgba(129, 140, 248, ${(1 - dist / 180) * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(129, 140, 248, 0.4)';
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

export default function Login() {
  useTitle('Login');

  const query = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const { user, mutate } = useLogin({
    swrConfig: { shouldRetryOnError: false },
  });

  const isHttps = window.location.protocol === 'https:';
  const webClient = JSON.stringify(getWebClient());

  const { data: config, error: configError, isLoading: configLoading } = useSWR('/api/server/public');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useMeshCanvas(canvasRef);

  const showLocalLogin =
    query.get('local') === 'true' ||
    !(
      config?.oauth?.bypassLocalLogin &&
      Object.values(config?.oauthEnabled ?? {}).filter((x) => x === true).length > 0
    );

  const willRedirect =
    config?.oauth?.bypassLocalLogin &&
    Object.values(config?.oauthEnabled ?? {}).filter((x) => x === true).length === 1 &&
    query.get('local') !== 'true';

  useEffect(() => {
    if (willRedirect && config) {
      const provider = Object.keys(config.oauthEnabled).find(
        (x) => config.oauthEnabled[x as keyof typeof config.oauthEnabled] === true,
      );
      if (provider) window.location.href = `/api/auth/oauth/${provider.toLowerCase()}`;
    }
  }, [willRedirect, config]);

  const [totp, setTotp] = useObjectState({
    open: false,
    disabled: false,
    error: '',
    pin: '',
  });

  const [secureModal, setSecureModal] = useState(false);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => (v.length >= 1 ? null : 'Username is required'),
      password: (v) => (v.length >= 1 ? null : 'Password is required'),
    },
  });

  useEffect(() => {
    if (user) navigate('/dashboard');
    if (config?.firstSetup) navigate('/auth/setup');
  }, [user, config, navigate]);

  const handleLoginSubmit = async (values: any, code?: string) => {
    setTotp({ disabled: true, error: '' });
    const { data, error } = await fetchApi(
      '/api/auth/login',
      'POST',
      { ...values, code },
      { 'x-zipline-client': webClient },
    );
    if (error) {
      if (ApiError.check(error, 1044)) {
        form.setFieldError('username', 'Invalid username');
        form.setFieldError('password', 'Invalid password');
      } else {
        setTotp('error', error.error || 'Login failed');
      }
      setTotp('disabled', false);
    } else if (data?.totp) {
      setTotp({ open: true, disabled: false });
    } else {
      showNotification({
        message: 'Logging in...',
        icon: <IconCheck size='1rem' />,
        autoClose: 700,
      });
      mutate(data);
    }
  };

  const handleTotpChange = async (val: string) => {
    setTotp('pin', val);
    if (val.length === 6) await handleLoginSubmit(form.values, val);
  };

  if (configLoading || !config) return <LoadingOverlay visible />;
  if (configError) return <GenericError title='Error' message='Config load failed' details={configError} />;

  return (
    <>
      {/* Background FX */}
      <canvas ref={canvasRef} id='mesh-canvas' aria-hidden='true' />
      <div className='grain-overlay' aria-hidden='true' />

      {/* Custom background image if configured */}
      {config.website.loginBackground && (
        <div
          aria-hidden='true'
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${config.website.loginBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: config.website.loginBackgroundBlur ? 'blur(10px)' : undefined,
            opacity: 0.25,
          }}
        />
      )}

      {willRedirect && !showLocalLogin && <LoadingOverlay visible />}

      <TotpModal
        state={totp}
        onPinChange={(val) => handleTotpChange(val)}
        onVerify={() => handleLoginSubmit(form.values, totp.pin)}
        onCancel={() => {
          setTotp('open', false);
          form.reset();
        }}
      />

      <SecureWarningModal
        opened={secureModal}
        onClose={() => setSecureModal(false)}
        returnHttps={config.returnHttps}
      />

      {/* HTTPS warnings */}
      {isHttps && !config.returnHttps && (
        <Box pos='fixed' top={10} left='50%' style={{ transform: 'translateX(-50%)', zIndex: 10 }}>
          <Text size='sm' c='red' ta='center'>
            You are accessing this instance through a <b>secure</b> context but the server is not configured
            to use HTTPS. Click <Anchor onClick={() => setSecureModal(true)}>here</Anchor> to learn more.
          </Text>
        </Box>
      )}
      {!isHttps && config.returnHttps && (
        <Box pos='fixed' top={10} left='50%' style={{ transform: 'translateX(-50%)', zIndex: 10 }}>
          <Text size='sm' c='red' ta='center'>
            You are accessing this instance through an <b>insecure</b> context but the server is configured
            to use HTTPS. Click <Anchor onClick={() => setSecureModal(true)}>here</Anchor> to learn more.
          </Text>
        </Box>
      )}

      {/* Centered login card */}
      <div
        className='ph-content'
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        {/* Back to home */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            to='/'
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-main)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          >
            ← Back to home
          </Link>
        </div>

        {/* Card */}
        <div
          className='glass-card'
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '40px',
            background:
              'linear-gradient(135deg, rgba(129, 140, 248, 0.06) 0%, rgba(3, 7, 18, 0.8) 100%)',
          }}
        >
          {/* Logo + title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
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
                margin: '0 auto 16px',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.35)',
              }}
            >
              Z
            </div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '1.6rem',
                color: 'var(--text-main)',
                letterSpacing: '-0.03em',
                margin: '0 0 6px',
              }}
            >
              {config.website.title ?? 'Zipline'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Sign in to your account
            </p>
          </div>

          {/* Login form sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {showLocalLogin && (
              <LocalLogin
                form={form}
                onSubmit={handleLoginSubmit}
                loading={totp.disabled}
                hasBackground
              />
            )}

            {eitherTrue(
              config.mfa.passkeys && browserSupportsWebAuthn(),
              config.oauthEnabled.discord,
              config.oauthEnabled.github,
              config.oauthEnabled.google,
              config.oauthEnabled.oidc,
              config.features.userRegistration,
            ) && (
              <>
                <Divider
                  label='or continue with'
                  labelPosition='center'
                  styles={{
                    label: { color: 'var(--text-faint)', fontSize: '0.75rem' },
                  }}
                />

                {config.mfa.passkeys && browserSupportsWebAuthn() && (
                  <PasskeyAuthButton onAuthSuccess={mutate} />
                )}

                <Group grow>
                  {config.oauthEnabled.discord && (
                    <ExternalAuthButton
                      provider='Discord'
                      leftSection={<IconBrandDiscordFilled stroke={4} size='1.1rem' />}
                    />
                  )}
                  {config.oauthEnabled.github && (
                    <ExternalAuthButton
                      provider='GitHub'
                      leftSection={<IconBrandGithubFilled size='1.1rem' />}
                    />
                  )}
                  {config.oauthEnabled.google && (
                    <ExternalAuthButton
                      provider='Google'
                      leftSection={<IconBrandGoogleFilled stroke={4} size='1.1rem' />}
                    />
                  )}
                  {config.oauthEnabled.oidc && (
                    <ExternalAuthButton provider='OIDC' leftSection={<IconCircleKeyFilled size='1.1rem' />} />
                  )}
                </Group>

                {config.features.userRegistration && (
                  <Text ta='center' size='sm' mt='xs' c='dimmed'>
                    Don&apos;t have an account?{' '}
                    <Anchor component={Link} to='/auth/register' c='violet' fw={600}>
                      Register
                    </Anchor>
                  </Text>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            marginTop: '24px',
            color: 'var(--text-faint)',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}
        >
          Zipline — Open source file hosting
        </p>
      </div>
    </>
  );
}
