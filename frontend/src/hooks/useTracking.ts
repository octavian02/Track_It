import { useState, useEffect } from "react";
import axios from "axios";

export interface TrackingItem {
  id: number;
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  paused: boolean;
}

export function useTracking(
  showId: number,
  showName: string
): {
  tracking: TrackingItem | null;
  pausedEntry: TrackingItem | null;
  start: () => Promise<TrackingItem>;
  pause: () => Promise<void>;
  loading: boolean;
} {
  const [tracking, setTracking] = useState<TrackingItem | null>(null);
  const [pausedEntry, setPausedEntry] = useState<TrackingItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing entries (active vs paused)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get<TrackingItem[]>("/api/tracking", { params: { showId } })
      .then((res) => {
        if (!mounted) return;
        const active =
          res.data.find((t) => t.showId === showId && !t.paused) || null;
        const paused =
          res.data.find((t) => t.showId === showId && t.paused) || null;
        setTracking(active);
        setPausedEntry(paused);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [showId]);

  // Start or resume tracking
  const start = async (): Promise<TrackingItem> => {
    // If a paused entry exists, un-pause it
    if (pausedEntry) {
      const res = await axios.patch<TrackingItem>(
        `/api/tracking/${pausedEntry.id}`,
        {
          paused: false,
          seasonNumber: pausedEntry.seasonNumber,
          episodeNumber: pausedEntry.episodeNumber,
        }
      );
      setTracking(res.data);
      setPausedEntry(null);
      return res.data;
    }
    // Otherwise, create new
    const res = await axios.post<TrackingItem>("/api/tracking", {
      showId,
      showName,
      seasonNumber: 1,
      episodeNumber: 0,
      paused: false,
    });
    setTracking(res.data);
    return res.data;
  };

  // Pause tracking by setting paused=true
  const pause = async (): Promise<void> => {
    if (!tracking) return;
    await axios.patch(`/api/tracking/${tracking.id}`, {
      paused: true,
      seasonNumber: tracking.seasonNumber,
      episodeNumber: tracking.episodeNumber,
    });
    // move to pausedEntry
    setPausedEntry({ ...tracking, paused: true });
    setTracking(null);
  };

  return { tracking, pausedEntry, start, pause, loading };
}
