import { PathLike } from 'fs';
import { access } from 'fs/promises';
import { basename, isAbsolute, normalize, sep } from 'path';

export async function exists(path: PathLike): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFilename(name: string): string | null {
  if (!name) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    // If decoding fails, use the original name (it's not URL encoded)
    decoded = name;
  }

  // Strip null bytes and other control characters (0x00-0x1F, 0x7F) that can break filesystem operations
  decoded = decoded
    .split('')
    .filter((c) => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) !== 0x7f)
    .join('');

  const normalized = normalize(decoded);

  if (normalized.includes('/') || normalized.includes('\\')) return null;

  if (isAbsolute(normalized)) return null;

  if (normalized.includes('..' + sep) || normalized === '..') return null;

  const basenameName = basename(normalized);

  // Reject empty basenames (e.g. filenames that were only slashes or control chars)
  if (!basenameName) return null;

  return basenameName;
}

export function sanitizeExtension(ext: string): string | null {
  if (ext.includes('/') || ext.includes('\\') || ext.includes('..')) return null;

  return ext.startsWith('.') ? ext : `.${ext}`;
}