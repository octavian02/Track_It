// src/hooks/useTracking.ts
import { useState, useEffect } from "react";
import axios from "axios";

export interface TrackingItem {
  id: number;
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  nextAirDate: string | null;
}

export function useTracking(
  showId: number,
  showName: string
): {
  tracking: TrackingItem | null;
  start: () => Promise<void>;
  bump: () => Promise<void>;
  stop: () => Promise<void>;
  loading: boolean;
} {
  const [tracking, setTracking] = useState<TrackingItem | null>(null);
  const [loading, setLoading] = useState(true);

  // on mount or whenever showId changes, fetch existing tracking entry
  useEffect(() => {
    setLoading(true);
    axios
      .get<TrackingItem[]>("/api/tracking")
      .then((res) => {
        const found = res.data.find((t) => t.showId === showId) || null;
        setTracking(found);
      })
      .finally(() => setLoading(false));
  }, [showId]);

  // start at S1·E1
  const start = async () => {
    const res = await axios.post<TrackingItem>("/api/tracking", {
      showId,
      showName,
      seasonNumber: 1,
      episodeNumber: 1,
    });
    setTracking(res.data);
  };

  // bump to the next episode number
  const bump = async () => {
    if (!tracking) return;
    const nextEp = tracking.episodeNumber + 1;
    const res = await axios.patch<TrackingItem>(
      `/api/tracking/${tracking.id}`,
      {
        seasonNumber: tracking.seasonNumber,
        episodeNumber: nextEp,
      }
    );
    setTracking(res.data);
  };

  const stop = async () => {
    if (!tracking) return;
    await axios.delete(`/api/tracking/${tracking.id}`);
    setTracking(null);
  };

  return { tracking, start, bump, stop, loading };
}
