// src/hooks/useWatchlist.ts
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export function useWatchlist(
  mediaId: number,
  mediaName?: string,
  mediaType?: "movie" | "tv"
) {
  const [inWatchlist, setInWatchlist] = useState(false);

  // fetch initial state
  useEffect(() => {
    (async () => {
      try {
        const { data } =
          await axios.get<{ mediaId: number }[]>(`/api/watchlist`);
        setInWatchlist(data.some((item) => item.mediaId === mediaId));
      } catch {}
    })();
  }, [mediaId]);

  const toggle = useCallback(async () => {
    try {
      if (inWatchlist) {
        await axios.delete(`/api/watchlist/${mediaId}`);
        setInWatchlist(false);
      } else {
        await axios.post(`/api/watchlist/${mediaId}`, { mediaName, mediaType });
        setInWatchlist(true);
      }
      return { success: true, added: !inWatchlist };
    } catch {
      return { success: false };
    }
  }, [inWatchlist, mediaId, mediaName, mediaType]);

  return { inWatchlist, toggle };
}
