import typedPlugin from '@/server/typedPlugin';

export type EmbedData = {
  title?: string;
  description?: string;
  color?: string;
  siteName?: string;
  imageUrl?: string;
  redirectUrl?: string;
  redirectDelay?: number;
  cardType?: 'website' | 'summary_large_image';
};

function decodeEmbedData(raw: string): EmbedData | null {
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);

    // Expand short keys (new format) or pass through full keys (legacy)
    const isShort = 't' in parsed || 'd' in parsed || 's' in parsed || 'i' in parsed;
    if (isShort) {
      return {
        title:        parsed.t,
        description:  parsed.d,
        color:        parsed.c,
        siteName:     parsed.s,
        imageUrl:     parsed.i,
        redirectUrl:  parsed.r,
        redirectDelay: parsed.rd,
        cardType:     parsed.ct,
      };
    }
    return parsed as EmbedData;
  } catch {
    return null;
  }
}

function esc(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildEmbedHtml(d: EmbedData, pageUrl: string): string {
  const color = d.color && /^#[0-9a-fA-F]{3,8}$/.test(d.color) ? d.color : '#6366f1';
  const cardType = d.cardType || 'website';

  const ogMeta = [
    d.title       ? `<meta property="og:title"       content="${esc(d.title)}" />`       : '',
    d.description ? `<meta property="og:description" content="${esc(d.description)}" />` : '',
    d.siteName    ? `<meta property="og:site_name"   content="${esc(d.siteName)}" />`    : '',
    d.imageUrl    ? `<meta property="og:image"       content="${esc(d.imageUrl)}" />`    : '',
    cardType === 'summary_large_image' && d.imageUrl
                  ? `<meta name="twitter:card"       content="summary_large_image" />`
                  : `<meta name="twitter:card"       content="summary" />`,
    d.imageUrl    ? `<meta name="twitter:image"      content="${esc(d.imageUrl)}" />`    : '',
                    `<meta property="og:url"         content="${esc(pageUrl)}" />`,
                    `<meta name="theme-color"        content="${esc(color)}" />`,
                    `<meta property="og:type"        content="${esc(cardType === 'summary_large_image' ? 'website' : cardType)}" />`,
  ].filter(Boolean).join('\n    ');

  // Auto-redirect script
  const redirectScript = d.redirectUrl && d.redirectDelay
    ? `
    <script>
      let countdown = ${d.redirectDelay};
      const countdownEl = document.getElementById('countdown');
      const interval = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(interval);
          window.location.href = ${JSON.stringify(d.redirectUrl)};
        }
      }, 1000);
    </script>`
    : '';

  // Build inner card HTML pieces
  const siteNameHtml = d.siteName ? `<div class="site-name">${esc(d.siteName)}</div>` : '';
  const titleHtml    = d.title    ? `<div class="embed-title">${esc(d.title)}</div>`    : '';
  const descHtml     = d.description ? `<div class="embed-desc">${esc(d.description)}</div>` : '';
  const imageHtml    = d.imageUrl ? `<img class="embed-image" src="${esc(d.imageUrl)}" alt="" />` : '';
  
  const redirectBanner = d.redirectUrl
    ? `<div class="redirect-banner">Redirecting in <span id="countdown">${d.redirectDelay || 5}</span> seconds...</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(d.title) || 'Embed'}</title>
  ${ogMeta}
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{
      width:100%;min-height:100vh;
      background:#1e1e2e;
      display:flex;align-items:center;justify-content:center;
      font-family:"gg sans","Noto Sans",system-ui,sans-serif;
      padding:16px;
      flex-direction:column;
    }
    .redirect-banner{
      background:#f59e0b;
      color:#000;
      padding:12px 24px;
      border-radius:8px;
      font-weight:600;
      margin-bottom:16px;
      animation:pulse 1s infinite;
    }
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
    .card{
      max-width:432px;width:100%;
      background:#2b2d3a;
      border-left:4px solid ${color};
      border-radius:4px;
      padding:8px 12px 8px 12px;
    }
    .site-name{font-size:12px;font-weight:600;color:#b9bbbe;margin-bottom:4px}
    .embed-title{font-size:15px;font-weight:700;color:#7289da;margin-bottom:4px;word-break:break-word}
    .embed-desc{font-size:14px;color:#b9bbbe;line-height:1.375;margin-bottom:4px;white-space:pre-wrap;word-break:break-word}
    .embed-image{display:block;max-width:100%;max-height:280px;border-radius:4px;margin-top:8px;object-fit:contain}
  </style>
</head>
<body>
  ${redirectBanner}
  <div class="card">
    ${siteNameHtml}
    ${titleHtml}
    ${descHtml}
    ${imageHtml}
  </div>
  ${redirectScript}
</body>
</html>`;
}

export const PATH = '/embed';
export default typedPlugin(
  async (server) => {
    server.get<{ Querystring: { data?: string } }>(PATH, async (req, res) => {
      const raw = req.query.data;
      if (!raw) {
        return res.status(400).type('text/plain').send('Missing ?data= parameter');
      }

      const data = decodeEmbedData(raw);
      if (!data) {
        return res.status(400).type('text/plain').send('Invalid embed data');
      }

      const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const pageUrl = `${proto}://${req.headers.host}/embed?data=${raw}`;

      return res.type('text/html').send(buildEmbedHtml(data, pageUrl));
    });
  },
  { name: PATH },
);
