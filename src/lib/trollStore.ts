/* ─────────────────────────────────────────────────────────────────
   Troll link store — persisted to <dataDir>/troll-links.json
   so links survive server restarts.
───────────────────────────────────────────────────────────────── */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export type TrollMediaType = 'image' | 'gif' | 'video' | 'youtube';

export type TrollLink = {
  id: string;
  alias: string;
  /** Media URL that actually loads (image src, gif src, YouTube embed URL, video src) */
  mediaUrl: string;
  mediaType: TrollMediaType;
  /** Optional label shown in admin UI */
  label: string;
  createdAt: string;
};

// Store file lives alongside other Zipline data files
const DATA_DIR = resolve('./data');
const STORE_FILE = resolve(DATA_DIR, 'troll-links.json');

function loadFromDisk(): Map<string, TrollLink> {
  try {
    if (!existsSync(STORE_FILE)) return new Map();
    const raw = readFileSync(STORE_FILE, 'utf-8');
    const arr: TrollLink[] = JSON.parse(raw);
    const map = new Map<string, TrollLink>();
    for (const link of arr) map.set(link.alias, link);
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

// Load on startup
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
    store.set(link.alias, link);
    saveToDisk(store);
  },

  remove(alias: string): boolean {
    const deleted = store.delete(alias);
    if (deleted) saveToDisk(store);
    return deleted;
  },

  hasAlias(alias: string): boolean {
    return store.has(alias);
  },
};
