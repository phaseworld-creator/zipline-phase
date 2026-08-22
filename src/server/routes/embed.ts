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
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);

    // Expand short keys (new format) or pass through full keys (legacy)
    const isShort = 't' in parsed || 'd' in parsed || 's' in parsed ||
                    'i' in parsed || 'u' in parsed || 'a' in parsed || 'x' in parsed;
    if (isShort) {
      return {
        title:         parsed.t,
        description:   parsed.d,
        color:         parsed.c,
        siteName:      parsed.s,
        imageUrl:      parsed.i,
        url:           parsed.u,
        authorName:    parsed.a,
        authorIconUrl: parsed.x,
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

  // Build inner card HTML pieces
  const siteNameHtml   = d.siteName    ? `<div class="site-name">${esc(d.siteName)}</div>` : '';
  const authorIconHtml = d.authorIconUrl ? `<img class="author-icon" src="${esc(d.authorIconUrl)}" alt="" />` : '';
  const authorHtml     = d.authorName  ? `<div class="author">${authorIconHtml}<span class="author-name">${esc(d.authorName)}</span></div>` : '';
  const titleHtml      = d.title       ? `<div class="embed-title">${esc(d.title)}</div>` : '';
  const descHtml       = d.description ? `<div class="embed-desc">${esc(d.description)}</div>` : '';
  const imageHtml      = d.imageUrl    ? `<img class="embed-image" src="${esc(d.imageUrl)}" alt="" />` : '';
  const footerHtml     = d.url         ? `<div class="embed-footer">${esc(d.url)}</div>` : '';

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
    }
    .card{
      max-width:432px;width:100%;
      background:#2b2d3a;
      border-left:4px solid ${color};
      border-radius:4px;
      padding:8px 12px 8px 12px;
    }
    .site-name{font-size:12px;font-weight:600;color:#b9bbbe;margin-bottom:4px}
    .author{display:flex;align-items:center;gap:6px;margin-bottom:6px}
    .author-icon{width:20px;height:20px;border-radius:50%;flex-shrink:0}
    .author-name{font-size:13px;font-weight:600;color:#e0e0f0}
    .embed-title{font-size:15px;font-weight:700;color:#7289da;margin-bottom:4px;word-break:break-word}
    .embed-desc{font-size:14px;color:#b9bbbe;line-height:1.375;margin-bottom:4px;white-space:pre-wrap;word-break:break-word}
    .embed-image{display:block;max-width:100%;max-height:280px;border-radius:4px;margin-top:8px;object-fit:contain}
    .embed-footer{font-size:12px;color:#72757e;margin-top:8px;word-break:break-all}
  </style>
</head>
<body>
  <div class="card">
    ${siteNameHtml}
    ${authorHtml}
    ${titleHtml}
    ${descHtml}
    ${imageHtml}
    ${footerHtml}
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
