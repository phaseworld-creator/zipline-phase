/**
 * Copy text to clipboard with HTTP fallback (execCommand).
 * Works on both secure (HTTPS) and insecure (HTTP) contexts.
 */
export function copyToClipboard(text: string): void {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => execCommandFallback(text));
  } else {
    execCommandFallback(text);
  }
}

function execCommandFallback(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    /* nothing we can do */
  }
  document.body.removeChild(ta);
}
