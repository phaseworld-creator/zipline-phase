import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export type TrollMediaType = 'image' | 'gif' | 'video' | 'youtube' | 'audio';

export type TrollLink = {
  id: string;
  alias: string;
  mediaUrl: string;
  mediaType: TrollMediaType;
  label: string;
  createdAt: string;
  views: number;
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
      // back-compat: existing links without views field default to 0
      map.set(link.alias, { ...link, views: link.views ?? 0 });
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
    store.set(link.alias, { ...link, views: link.views ?? 0 });
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

  incrementViews(alias: string): void {
    const link = store.get(alias);
    if (!link) return;
    link.views = (link.views ?? 0) + 1;
    store.set(alias, link);
    saveToDisk(store);
  },
};
