/* ─────────────────────────────────────────────────────────────────
   In-memory troll link store.
   Persists for the lifetime of the server process.
   No database migration needed.
───────────────────────────────────────────────────────────────── */

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

const store = new Map<string, TrollLink>();

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
  },

  remove(alias: string): boolean {
    return store.delete(alias);
  },

  hasAlias(alias: string): boolean {
    return store.has(alias);
  },
};
