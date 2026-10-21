import { Box, Stack, Text } from '@mantine/core';
import * as sanitize from 'isomorphic-dompurify';
import { useEffect, useState } from 'react';

interface DocxViewerProps {
  fileUrl: string;
}

export default function DocxViewer({ fileUrl }: DocxViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocx() {
      try {
        setLoading(true);
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error('Failed to fetch document');

        const buffer = await res.arrayBuffer();
        const { extractRawText } = await import('mammoth');
        const result = await extractRawText({ arrayBuffer: buffer });

        const text = result.value ?? '';
        // Convert plain text paragraphs to simple HTML
        const paragraphs = text.split('\n').filter((p) => p.trim().length > 0);
        const htmlContent = paragraphs
          .map((p) => `<p>${sanitize.sanitize(p, { USE_PROFILES: { html: true } })}</p>`)
          .join('');

        setHtml(htmlContent);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    loadDocx();
  }, [fileUrl]);

  if (loading) {
    return (
      <Box style={{ height: '100%', width: '100%' }}>
        <Stack align='center' justify='center' style={{ height: '100%' }}>
          <Text size='sm' c='dimmed'>
            Loading document...
          </Text>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ height: '100%', width: '100%' }}>
        <Stack align='center' justify='center' style={{ height: '100%' }}>
          <Text size='sm' c='red'>
            Failed to load document: {error}
          </Text>
        </Stack>
      </Box>
    );
  }

  if (!html) {
    return (
      <Box style={{ height: '100%', width: '100%' }}>
        <Stack align='center' justify='center' style={{ height: '100%' }}>
          <Text size='sm' c='dimmed'>
            Empty document
          </Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <Stack gap='xs' style={{ width: '100%' }}>
        <div dangerouslySetInnerHTML={{ __html: html }} style={{ fontSize: '0.9rem', lineHeight: '1.6' }} />
      </Stack>
    </Box>
  );
}
