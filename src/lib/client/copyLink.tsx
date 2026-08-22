import type { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';

/** Copy text to clipboard with HTTP fallback (execCommand). */
function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    // HTTPS / localhost — use modern API
    navigator.clipboard.writeText(text).catch(() => execCommandFallback(text));
  } else {
    // HTTP — use legacy execCommand fallback
    execCommandFallback(text);
  }
}

function execCommandFallback(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch { /* nothing we can do */ }
  document.body.removeChild(ta);
}

export function copyLink(url: string, _clipboard: ReturnType<typeof useClipboard>, target: string = url) {
  copyToClipboard(url);

  notifications.show({
    title: 'Copied link',
    message: (
      <a href={target} target='_blank' rel='noopener noreferrer' style={{ color: 'inherit' }}>
        {url}
      </a>
    ),
    color: 'green',
    icon: <IconCopy size='1rem' />,
  });
}
