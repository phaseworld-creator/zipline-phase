import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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
    const COUNT = 30;
    const nodes: Node[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
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
            const alpha = (1 - dist / 180) * 0.35;
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
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
        ctx.fillStyle = 'rgba(129, 140, 248, 0.5)';
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

function useCardTilt(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>('.card-spotlight');

    const onMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -8;
      const rotY = ((x - cx) / cx) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    const onLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = '';
      card.style.setProperty('--mouse-x', '-9999px');
      card.style.setProperty('--mouse-y', '-9999px');
    };

    cards.forEach((card) => {
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    };
  }, [containerRef]);
}

export function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useMeshCanvas(canvasRef);
  useCardTilt(cardsRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id='mesh-canvas' aria-hidden='true' />
      <div className='grain-overlay' aria-hidden='true' />

      <div className='ph-content' style={{ minHeight: '100vh', overflowX: 'hidden' }}>
        {/* ── Navigation ── */}
        <nav style={{ padding: '24px 24px 0' }}>
          <div className='ph-container'>
            <div
              className='pill'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 24px',
                marginBottom: '60px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#fff',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  Z
                </div>
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Zipline
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                <a
                  href='https://zipline.diced.sh/docs'
                  target='_blank'
                  rel='noreferrer'
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--text-main)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}
                >
                  Docs
                </a>
                <a
                  href='https://github.com/diced/zipline'
                  target='_blank'
                  rel='noreferrer'
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--text-main)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}
                >
                  GitHub
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className='status-dot' />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Live</span>
                </div>
                <Link to='/auth/login' className='btn-primary' style={{ padding: '9px 20px', fontSize: '0.85rem' }}>
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <header>
          <div className='ph-container'>
            <div
              style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', padding: '20px 0 64px' }}
            >
              <div style={{ marginBottom: '24px' }}>
                <span className='pill-badge'>
                  <i data-lucide='zap' style={{ width: 12, height: 12 }} />
                  Open-source · Self-hosted · Free forever
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  margin: '0 0 24px',
                }}
              >
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  The fastest way to{' '}
                </span>
                <em
                  style={{
                    fontStyle: 'normal',
                    background: 'linear-gradient(135deg, #818cf8 0%, #f43f5e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  share files
                </em>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {' '}
                  on your own terms.
                </span>
              </h1>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                  lineHeight: 1.7,
                  maxWidth: 600,
                  margin: '0 auto 40px',
                  fontWeight: 400,
                }}
              >
                Zipline is a self-hosted file sharing & URL shortener platform. Upload, shorten, and manage
                your content with a powerful dashboard built for speed.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginBottom: '52px',
                }}
              >
                <Link to='/auth/login' className='btn-primary'>
                  <i data-lucide='log-in' style={{ width: 16, height: 16 }} />
                  Go to Dashboard
                </Link>
                <a
                  href='https://github.com/diced/zipline'
                  target='_blank'
                  rel='noreferrer'
                  className='btn-ghost'
                >
                  <i data-lucide='github' style={{ width: 16, height: 16 }} />
                  View on GitHub
                </a>
              </div>

              <div className='pill' style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px' }}>
                {[
                  { value: '10k+', label: 'Users' },
                  { value: '100%', label: 'Open Source' },
                  { value: 'S3 & Local', label: 'Storage' },
                  { value: 'v5', label: 'Latest' },
                ].map((stat, i, arr) => (
                  <div key={stat.label} style={{ display: 'contents' }}>
                    <div style={{ textAlign: 'center', padding: '0 28px' }}>
                      <div
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          color: 'var(--text-main)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {stat.value}
                      </div>
                      <div
                        style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}
                      >
                        {stat.label}
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className='ph-divider' />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ── Feature Cards ── */}
        <main>
          <div className='ph-container' style={{ paddingBottom: '80px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span className='pill-badge' style={{ marginBottom: '16px', display: 'inline-flex' }}>
                <i data-lucide='sparkles' style={{ width: 12, height: 12 }} />
                Features
              </span>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                  letterSpacing: '-0.03em',
                  color: 'var(--text-main)',
                  margin: '12px 0 8px',
                }}
              >
                Everything you need, nothing you don't.
              </h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                Zipline packs a full-featured file hosting stack into a single self-hostable container.
              </p>
            </div>

            <div
              ref={cardsRef}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}
              className='grid-2'
            >
              {/* Card 1 — Uploads */}
              <article
                className='glass-card card-spotlight'
                style={{
                  padding: '40px',
                  background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.05) 0%, var(--surface-1) 100%)',
                }}
              >
                <div className='feature-icon' style={{ marginBottom: '20px' }}>
                  <i data-lucide='upload-cloud' style={{ width: 20, height: 20 }} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: 'var(--text-main)',
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Drag & Drop Uploads
                </h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.9rem' }}>
                  Upload any file type instantly with drag & drop, chunked uploads for large files, and custom
                  expiry times per upload.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Chunked large file support', 'Custom expiration per file', 'Password-protected files'].map(
                    (f) => (
                      <li
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.875rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span
                          className='feature-icon'
                          style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }}
                        >
                          <i data-lucide='check' style={{ width: 12, height: 12 }} />
                        </span>
                        {f}
                      </li>
                    ),
                  )}
                </ul>
              </article>

              {/* Card 2 — URL Shortener */}
              <article
                className='glass-card card-spotlight'
                style={{
                  padding: '40px',
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, var(--surface-1) 100%)',
                }}
              >
                <div className='feature-icon feature-icon-rose' style={{ marginBottom: '20px' }}>
                  <i data-lucide='link' style={{ width: 20, height: 20 }} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: 'var(--text-main)',
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  URL Shortener
                </h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.9rem' }}>
                  Turn any long URL into a short, shareable link. Track clicks, set vanity slugs, and manage all
                  your links from one place.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Vanity / custom slugs', 'Click tracking', 'Enable or disable links'].map((f) => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span
                        className='feature-icon feature-icon-rose'
                        style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }}
                      >
                        <i data-lucide='check' style={{ width: 12, height: 12 }} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </article>

              {/* Card 3 — Multi-user */}
              <article
                className='glass-card card-spotlight'
                style={{
                  padding: '40px',
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, var(--surface-1) 100%)',
                }}
              >
                <div className='feature-icon feature-icon-rose' style={{ marginBottom: '20px' }}>
                  <i data-lucide='users' style={{ width: 20, height: 20 }} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: 'var(--text-main)',
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Multi-user & Roles
                </h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.9rem' }}>
                  Invite friends or teammates with per-user quotas, role-based access control, and invite codes to
                  keep your instance secure.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Per-user storage quotas', 'Admin roles', 'Invite-only registration'].map((f) => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span
                        className='feature-icon feature-icon-rose'
                        style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }}
                      >
                        <i data-lucide='check' style={{ width: 12, height: 12 }} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </article>

              {/* Card 4 — Storage */}
              <article
                className='glass-card card-spotlight'
                style={{
                  padding: '40px',
                  background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.05) 0%, var(--surface-1) 100%)',
                }}
              >
                <div className='feature-icon' style={{ marginBottom: '20px' }}>
                  <i data-lucide='hard-drive' style={{ width: 20, height: 20 }} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: 'var(--text-main)',
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Flexible Storage
                </h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.9rem' }}>
                  Store files locally or on any S3-compatible backend — AWS S3, Cloudflare R2, Backblaze B2,
                  MinIO, and more. Switch any time.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['S3-compatible providers', 'Local disk storage', 'On-the-fly thumbnail generation'].map((f) => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span
                        className='feature-icon'
                        style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }}
                      >
                        <i data-lucide='check' style={{ width: 12, height: 12 }} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </article>

              {/* Card 5 — Security (full-width) */}
              <article
                className='glass-card card-spotlight'
                style={{
                  padding: '40px',
                  gridColumn: 'span 2',
                  background:
                    'linear-gradient(135deg, rgba(129, 140, 248, 0.07) 0%, rgba(244, 63, 94, 0.04) 100%)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '40px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div className='feature-icon' style={{ marginBottom: '20px' }}>
                    <i data-lucide='shield-check' style={{ width: 20, height: 20 }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: '1.3rem',
                      color: 'var(--text-main)',
                      marginBottom: '12px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Secure by default
                  </h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    OAuth2 login via Discord, GitHub, and Google. Passkey / WebAuthn support, TOTP two-factor
                    authentication, and per-token access control keep your instance locked down.
                  </p>
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  {['Discord OAuth2', 'GitHub OAuth2', 'Google OAuth2', 'Passkeys / WebAuthn', 'TOTP 2FA', 'Per-token scopes'].map(
                    (f) => (
                      <li
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          background: 'var(--surface-2)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-inner)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #818cf8, #f43f5e)',
                            flexShrink: 0,
                          }}
                        />
                        {f}
                      </li>
                    ),
                  )}
                </ul>
              </article>
            </div>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 24px' }}>
          <div className='ph-container'>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    color: '#fff',
                  }}
                >
                  Z
                </div>
                <span
                  style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-muted)' }}
                >
                  Zipline — Open source file hosting
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <a
                  href='https://zipline.diced.sh/docs'
                  target='_blank'
                  rel='noreferrer'
                  style={{ color: 'var(--text-faint)', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  Docs
                </a>
                <a
                  href='https://github.com/diced/zipline'
                  target='_blank'
                  rel='noreferrer'
                  style={{ color: 'var(--text-faint)', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  GitHub
                </a>
                <Link
                  to='/auth/login'
                  style={{ color: 'var(--text-faint)', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  Login
                </Link>
                <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>MIT License</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

Component.displayName = 'LandingPage';
