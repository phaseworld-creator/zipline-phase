import { createHash } from 'crypto';
import { verify as verifyArgon2 } from 'argon2';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export type TrollMediaType = 'image' | 'gif' | 'video' | 'youtube' | 'audio';
export type TrollDisplayMode = 'fullscreen' | 'redirect';

export type TrollLink = {
  id: string;
  alias: string;
  mediaUrl: string;
  mediaType: TrollMediaType;
  label: string;
  createdAt: string;
  views: number;
  expiresAt?: string | null;
  tags?: string[];
  displayMode?: TrollDisplayMode;
  password?: string | null;
  viewTimestamps?: number[];
  viewedIpHashes?: string[];
};

const DATA_DIR = resolve('./data');
const STORE_FILE = resolve(DATA_DIR, 'troll-links.json');

function loadFromDisk(): Map<string, TrollLink> {
  try {
    if (!existsSync(STORE_FILE)) return new Map();
    const raw = readFileSync(STORE_FILE, 'utf-8');
    const arr: TrollLink[] = JSON.parse(raw);
    const map = new Map<string, TrollLink>();
    for (const link of arr) {
      // back-compat: existing links without new fields default to safe values
      map.set(link.alias, {
        ...link,
        views: link.views ?? 0,
        tags: link.tags ?? [],
        displayMode: link.displayMode ?? 'fullscreen',
        viewTimestamps: link.viewTimestamps ?? [],
        viewedIpHashes: link.viewedIpHashes ?? [],
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveToDisk(map: Map<string, TrollLink>): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STORE_FILE, JSON.stringify(Array.from(map.values()), null, 2), 'utf-8');
  } catch (err) {
    console.error('[trollStore] failed to persist:', err);
  }
}

const store = loadFromDisk();

export const trollStore = {
  all(): TrollLink[] {
    return Array.from(store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  get(alias: string): TrollLink | undefined {
    return store.get(alias);
  },

  add(link: TrollLink): void {
    store.set(link.alias, {
      ...link,
      views: link.views ?? 0,
      tags: link.tags ?? [],
      displayMode: link.displayMode ?? 'fullscreen',
      viewTimestamps: link.viewTimestamps ?? [],
      viewedIpHashes: link.viewedIpHashes ?? [],
    });
    saveToDisk(store);
  },

  update(alias: string, updates: Partial<TrollLink>): boolean {
    const link = store.get(alias);
    if (!link) return false;
    store.set(alias, { ...link, ...updates });
    saveToDisk(store);
    return true;
  },

  remove(alias: string): boolean {
    const deleted = store.delete(alias);
    if (deleted) saveToDisk(store);
    return deleted;
  },

  hasAlias(alias: string): boolean {
    return store.has(alias);
  },

  incrementViews(alias: string): void {
    const link = store.get(alias);
    if (!link) return;
    link.views = (link.views ?? 0) + 1;
    link.viewTimestamps = [...(link.viewTimestamps ?? []), Date.now()];
    store.set(alias, link);
    saveToDisk(store);
  },

  incrementViewsWithIp(alias: string, ipAddress: string): boolean {
    const link = store.get(alias);
    if (!link) return false;

    // Hash the IP address for privacy
    const ipHash = createHash('sha256').update(`${alias}:${ipAddress}`).digest('hex');
    const viewedIps = link.viewedIpHashes ?? [];

    // Check if this IP already viewed
    if (viewedIps.includes(ipHash)) {
      return false; // Already counted
    }

    // Add view
    link.views = (link.views ?? 0) + 1;
    link.viewTimestamps = [...(link.viewTimestamps ?? []), Date.now()];
    link.viewedIpHashes = [...viewedIps, ipHash];
    store.set(alias, link);
    saveToDisk(store);
    return true;
  },

  isExpired(alias: string): boolean {
    const link = store.get(alias);
    if (!link || !link.expiresAt) return false;
    return new Date(link.expiresAt) < new Date();
  },

  verifyPassword(alias: string, password: string): Promise<boolean> {
    const link = store.get(alias);
    if (!link || !link.password) return Promise.resolve(true); // No password set
    return verifyArgon2(link.password, password);
  },
};
