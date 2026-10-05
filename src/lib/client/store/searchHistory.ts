import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_HISTORY = 20;

export type SearchHistoryStore = {
  history: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set) => ({
      history: [],

      add: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set((state) => {
          const filtered = state.history.filter((h) => h !== trimmed);
          return { history: [trimmed, ...filtered].slice(0, MAX_HISTORY) };
        });
      },

      remove: (query) =>
        set((state) => ({ history: state.history.filter((h) => h !== query) })),

      clear: () => set({ history: [] }),
    }),
    { name: 'zipline-search-history' },
  ),
);
