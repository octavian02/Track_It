// src/hooks/useWatchlist.ts
import { useWatchlistContext } from "../contexts/WatchlistContext";

export function useWatchlist(
  mediaId: number,
  mediaName: string,
  mediaType: "movie" | "tv",
  releaseDate?: number
) {
  const { items, toggleItem } = useWatchlistContext();
  const inWatchlist = items.has(mediaId);
  const toggle = () => toggleItem(mediaId, mediaName, mediaType);
  return { inWatchlist, toggle };
}
