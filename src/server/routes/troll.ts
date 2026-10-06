import { trollStore } from '@/lib/trollStore';
import typedPlugin from '@/server/typedPlugin';

function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function buildExpiredHtml(_label: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expired</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 4rem; margin-bottom: 1rem; }
    p { font-size: 1.25rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⏰ Too Late!</h1>
    <p>This link expired. Better luck next time.</p>
  </div>
</body>
</html>`;
}

function buildPasswordPromptHtml(alias: string, label: string, error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${label}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 90%;
    }
    h2 { margin-bottom: 1rem; color: #333; }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    input:focus { outline: none; border-color: #667eea; }
    button {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { opacity: 0.9; }
    .error { color: #e53e3e; margin-bottom: 1rem; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🔒 Password Required</h2>
    ${error ? `<p class="error">${error}</p>` : ''}
    <form method="POST">
      <input type="password" name="password" placeholder="Enter password" autofocus required />
      <button type="submit">Unlock</button>
    </form>
  </div>
</body>
</html>`;
}

function buildTrollHtml(link: ReturnType<typeof trollStore.get>): string {
  if (!link) return '<p>Not found</p>';

  let mediaHtml: string;

  if (link.mediaType === 'youtube') {
    const ytId = link.mediaUrl.includes('watch?v=')
      ? link.mediaUrl.split('watch?v=')[1]?.split('&')[0]
      : link.mediaUrl.split('/').pop();
    mediaHtml = `
      <iframe
        src="https://www.youtube.com/embed/${ytId}?autoplay=1"
        allow="autoplay; encrypted-media"
        allowfullscreen
        style="width:100%;height:100%;border:none;display:block;"
      ></iframe>`;
  } else if (link.mediaType === 'video') {
    mediaHtml = `
      <video
        src="${link.mediaUrl}"
        autoplay
        loop
        controls
        style="width:100%;height:100%;object-fit:contain;"
      ></video>`;
  } else if (link.mediaType === 'audio') {
    mediaHtml = `
      <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;flex-direction:column;">
        <audio
          src="${link.mediaUrl}"
          autoplay
          loop
          controls
          style="width:80%;max-width:500px;"
        ></audio>
      </div>`;
  } else {
    /* image or gif */
    mediaHtml = `
      <img
        src="${link.mediaUrl}"
        alt=""
        style="width:100%;height:100%;object-fit:contain;"
      />`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${link.label}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: #000;
      overflow: hidden;
      font-family: sans-serif;
    }
    #media-wrap {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div id="media-wrap">${mediaHtml}</div>
</body>
</html>`;
}

export const PATH = '/data/:alias';
export default typedPlugin(
  async (server) => {
    server.get<{ Params: { alias: string } }>(PATH, async (req, res) => {
      const link = trollStore.get(req.params.alias);
      if (!link) return res.callNotFound();

      // Type guard to ensure link is properly typed
      const typedLink: NonNullable<ReturnType<typeof trollStore.get>> = link;

      // Check if expired
      if (trollStore.isExpired(req.params.alias)) {
        return res.type('text/html').send(buildExpiredHtml(typedLink.label));
      }

      // Check password protection
      if (typedLink.password) {
        return res.type('text/html').send(buildPasswordPromptHtml(req.params.alias, typedLink.label));
      }

      // Increment views with IP deduplication
      const clientIp = getClientIp(req);
      trollStore.incrementViewsWithIp(req.params.alias, clientIp as string);

      // Handle redirect mode
      if (typedLink.displayMode === 'redirect') {
        return res.redirect(302, typedLink.mediaUrl);
      }

      // Default fullscreen mode
      return res.type('text/html').send(buildTrollHtml(typedLink));
    });

    server.post<{ Params: { alias: string } }>(PATH, async (req, res) => {
      const link = trollStore.get(req.params.alias);
      if (!link) return res.callNotFound();

      // Type guard to ensure link is properly typed
      const typedLink: NonNullable<ReturnType<typeof trollStore.get>> = link;

      // Verify password
      const password = (req.body as any)?.password || '';
      const isValid = await trollStore.verifyPassword(req.params.alias, password);
      
      if (!isValid) {
        return res.type('text/html').send(buildPasswordPromptHtml(req.params.alias, typedLink.label, '❌ Incorrect password'));
      }

      // Password correct, show content
      const clientIp = getClientIp(req);
      trollStore.incrementViewsWithIp(req.params.alias, clientIp as string);

      if (typedLink.displayMode === 'redirect') {
        return res.redirect(302, typedLink.mediaUrl);
      }

      return res.type('text/html').send(buildTrollHtml(typedLink));
    });
  },
  { name: PATH },
);
