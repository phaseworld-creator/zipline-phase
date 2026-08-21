import { trollStore } from '@/lib/trollStore';
import typedPlugin from '@/server/typedPlugin';

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
      return res.type('text/html').send(buildTrollHtml(link));
    });
  },
  { name: PATH },
);
