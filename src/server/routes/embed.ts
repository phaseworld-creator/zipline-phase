import typedPlugin from '@/server/typedPlugin';

export type EmbedData = {
  title?: string;
  description?: string;
  color?: string;      // hex e.g. "#6366f1"
  siteName?: string;
  imageUrl?: string;
  url?: string;        // canonical URL shown in footer
  authorName?: string;
  authorIconUrl?: string;
};

function decodeEmbedData(raw: string): EmbedData | null {
  try {
    // Convert base64url back to standard base64, then re-add stripped padding
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json) as EmbedData;
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
  const canonicalUrl = d.url || pageUrl;

  const ogMeta = [
    d.title       ? `<meta property="og:title"       content="${esc(d.title)}" />`       : '',
    d.description ? `<meta property="og:description" content="${esc(d.description)}" />` : '',
    d.siteName    ? `<meta property="og:site_name"   content="${esc(d.siteName)}" />`    : '',
    d.imageUrl    ? `<meta property="og:image"       content="${esc(d.imageUrl)}" />`    : '',
    d.imageUrl    ? `<meta name="twitter:card"        content="summary_large_image" />`   : '',
    d.imageUrl    ? `<meta name="twitter:image"       content="${esc(d.imageUrl)}" />`   : '',
                    `<meta property="og:url"          content="${esc(canonicalUrl)}" />`,
                    `<meta name="theme-color"         content="${esc(color)}" />`,
                    `<meta property="og:type"         content="website" />`,
  ].filter(Boolean).join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(d.title) || 'Embed'}</title>
  ${ogMeta}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; min-height: 100vh;
      background: #1e1e2e;
      display: flex; align-items: center; justify-content: center;
      font-family: "gg sans", "Noto Sans", system-ui, sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 480px; width: 100%;
      background: #2b2d3a;
      border-left: 4px solid ${color};
      border-radius: 4px;
      padding: 12px 16px;
    }
    .site-name { font-size: 12px; color: #b0b3c1; margin-bottom: 4px; }
    .author { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .author img { width: 24px; height: 24px; border-radius: 50%; }
    .author-name { font-size: 14px; font-weight: 600; color: #e0e0f0; }
    .title { font-size: 15px; font-weight: 600; color: #7289da; margin-bottom: 6px; }
    .description { font-size: 14px; color: #b0b3c1; line-height: 1.5; margin-bottom: 8px; }
    .image img { width: 100%; border-radius: 4px; margin-top: 8px; }
    .footer { font-size: 12px; color: #72757e; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    ${d.siteName    ? `<div class="site-name">${esc(d.siteName)}</div>` : ''}
    ${d.authorName  ? `<div class="author">${d.authorIconUrl ? `<img src="${esc(d.authorIconUrl)}" alt="" />` : ''}<span class="author-name">${esc(d.authorName)}</span></div>` : ''}
    ${d.title       ? `<div class="title">${esc(d.title)}</div>`             : ''}
    ${d.description ? `<div class="description">${esc(d.description)}</div>` : ''}
    ${d.imageUrl    ? `<div class="image"><img src="${esc(d.imageUrl)}" alt="" /></div>` : ''}
    ${d.url         ? `<div class="footer">${esc(d.url)}</div>` : ''}
  </div>
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
