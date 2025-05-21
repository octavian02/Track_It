// src/hooks/useHistory.ts
import { useState, useEffect } from "react";
import axios from "axios";

type Result = {
  success: boolean;
  count: number;
  error?: any;
};

interface MovieHistoryRow {
  mediaId: number;
  mediaType: string;
  watchCount: number;
}

interface EpisodeHistoryRow {
  mediaId: number; // showId
  mediaType: string; // "episode"
  seasonNumber: number;
  episodeNumber: number;
  watchCount: number;
}

/**
 * Hook for re-watchable movie history.
 */
export function useWatchedMovie(movieId: number) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // on mount, load the user's movie history and pick out our row
  useEffect(() => {
    (async () => {
      try {
        const { data } =
          await axios.get<MovieHistoryRow[]>("/api/history/movie");
        const row = data.find((r) => r.mediaId === movieId);
        setCount(row?.watchCount ?? 0);
      } catch (err) {
        console.error("Failed loading watched movies", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [movieId]);

  // Mark or rewatch
  const rewatch = async (mediaName?: string): Promise<Result> => {
    try {
      const { data: row } = await axios.post<MovieHistoryRow>(
        `/api/history/movie/${movieId}`,
        { mediaName }
      );
      setCount(row.watchCount);
      return { success: true, count: row.watchCount };
    } catch (error) {
      console.error("Failed rewatching movie", error);
      return { success: false, count, error };
    }
  };

  // Unwatch one viewing
  const unwatchOne = async (): Promise<Result> => {
    try {
      const { data } = await axios.delete<{ removed: boolean }>(
        `/api/history/movie/${movieId}`
      );
      // decrement locally
      setCount((c) => Math.max(0, c - 1));
      return { success: true, count: Math.max(0, count - 1) };
    } catch (error) {
      console.error("Failed unwatching movie", error);
      return { success: false, count, error };
    }
  };

  return { count, loading, rewatch, unwatchOne };
}

/**
 * Hook for re-watchable episode history.
 */
export function useWatchedEpisode(
  showId: number,
  seasonNumber: number,
  episodeNumber: number
) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // on mount, load all watched‐episodes for this show and filter ours
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<EpisodeHistoryRow[]>(
          `/api/history/show/${showId}`
        );
        const row = data.find(
          (r) =>
            r.seasonNumber === seasonNumber && r.episodeNumber === episodeNumber
        );
        setCount(row?.watchCount ?? 0);
      } catch (err) {
        console.error("Failed loading watched episodes", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [showId, seasonNumber, episodeNumber]);

  // Mark or rewatch this episode
  const rewatch = async (): Promise<Result> => {
    try {
      const { data: row } = await axios.post<EpisodeHistoryRow>(
        `/api/history/episode/${showId}/${seasonNumber}/${episodeNumber}`
      );
      setCount(row.watchCount);
      return { success: true, count: row.watchCount };
    } catch (error) {
      console.error("Failed rewatching episode", error);
      return { success: false, count, error };
    }
  };

  // Unwatch one viewing of this episode
  const unwatchOne = async (): Promise<Result> => {
    try {
      const { data } = await axios.delete<{ removed: boolean }>(
        `/api/history/episode/${showId}/${seasonNumber}/${episodeNumber}`
      );
      setCount((c) => Math.max(0, c - 1));
      return { success: true, count: Math.max(0, count - 1) };
    } catch (error) {
      console.error("Failed unwatching episode", error);
      return { success: false, count, error };
    }
  };

  return { count, loading, rewatch, unwatchOne };
}
