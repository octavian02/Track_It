// src/contexts/WatchlistContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import axios from "axios";

type WatchlistItem = { mediaId: number };
type WatchlistContextType = {
  items: Set<number>;
  toggleItem: (
    mediaId: number,
    mediaName: string,
    mediaType: "movie" | "tv"
  ) => Promise<{ success: boolean; added: boolean }>;
};

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export const WatchlistProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    axios
      .get<WatchlistItem[]>("/api/watchlist")
      .then(({ data }) => {
        if (!cancelled) setItems(new Set(data.map((i) => i.mediaId)));
      })
      .catch(() => {
        if (!cancelled) setItems(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleItem = useCallback(
    async (mediaId: number, mediaName: string, mediaType: "movie" | "tv") => {
      try {
        if (items.has(mediaId)) {
          await axios.delete(`/api/watchlist/${mediaId}`);
          setItems((prev) => {
            const next = new Set(prev);
            next.delete(mediaId);
            return next;
          });
          return { success: true, added: false };
        } else {
          await axios.post(`/api/watchlist/${mediaId}`, {
            mediaName,
            mediaType,
          });
          setItems((prev) => {
            const next = new Set(prev);
            next.add(mediaId);
            return next;
          });
          return { success: true, added: true };
        }
      } catch {
        return { success: false, added: !items.has(mediaId) };
      }
    },
    [items]
  );

  return (
    <WatchlistContext.Provider value={{ items, toggleItem }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export function useWatchlistContext() {
  const ctx = useContext(WatchlistContext);
  if (!ctx)
    throw new Error("useWatchlistContext must be inside WatchlistProvider");
  return ctx;
}
