import { Badge, Box, Group, Text, Title } from '@mantine/core';
import { IconApi } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';

export default function DashboardApiDocs() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  /* Build the Scalar UI as a self-contained HTML blob loaded into an iframe.
     This avoids adding any npm dependency and works entirely off CDN. */
  const scalarHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Zipline API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; background: #030712; }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/openapi.json"
    data-configuration='${JSON.stringify({
      theme: 'purple',
      darkMode: true,
      layout: 'modern',
      defaultOpenAllTags: false,
      hideModels: false,
      authentication: {
        preferredSecurityScheme: 'cookieAuth',
      },
    })}'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

  const blobUrl = useRef<string | null>(null);

  useEffect(() => {
    const blob = new Blob([scalarHtml], { type: 'text/html' });
    blobUrl.current = URL.createObjectURL(blob);

    if (frameRef.current) {
      frameRef.current.src = blobUrl.current;
    }

    return () => {
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    };
  }, []);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 0 }}>
      {/* Header */}
      <Group gap='sm' mb='sm'>
        <IconApi size='1.5rem' style={{ color: 'var(--mantine-color-violet-4)' }} />
        <Title order={1}>API Reference</Title>
        <Badge color='violet' variant='light'>
          OpenAPI 3.0
        </Badge>
        <Text c='dimmed' size='sm' ml='auto'>
          All endpoints available on this instance
        </Text>
      </Group>

      {/* Scalar iframe */}
      <Box
        style={{
          flex: 1,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <iframe
          ref={frameRef}
          title='API Reference'
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
        />
      </Box>
    </Box>
  );
}
