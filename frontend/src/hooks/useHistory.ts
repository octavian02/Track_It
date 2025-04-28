// src/hooks/useHistory.ts
import { useState, useEffect } from "react";
import axios from "axios";

type Result = {
  success: boolean;
  watched: boolean;
  error?: any;
};

export function useWatchedMovie(movieId: number) {
  const [watched, setWatched] = useState(false);

  // on mount, fetch the list of watched movies and see if ours is in there
  useEffect(() => {
    (async () => {
      try {
        const { data } =
          await axios.get<{ mediaId: number; mediaType: string }[]>(
            "/api/history/movie"
          );
        setWatched(data.some((i) => i.mediaId === movieId));
      } catch (err) {
        console.error("Failed loading watched movies", err);
      }
    })();
  }, [movieId]);

  const toggle = async (mediaName?: string): Promise<Result> => {
    try {
      if (watched) {
        await axios.delete(`/api/history/movie/${movieId}`);
      } else {
        await axios.post(`/api/history/movie/${movieId}`, { mediaName });
      }
      setWatched(!watched);
      return { success: true, watched: !watched };
    } catch (error) {
      console.error("Failed toggling watched", error);
      return { success: false, watched, error };
    }
  };

  return { watched, toggle };
}

/**
 * Tracks whether the current user has “watched” a specific episode.
 */
export function useWatchedEpisode(
  showId: number,
  season: number,
  episode: number
) {
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<
          {
            mediaType: string;
            mediaId: number; // showId
            seasonNumber: number;
            episodeNumber: number;
          }[]
        >(`/api/history/show/${showId}`);
        setWatched(
          data.some(
            (i) => i.seasonNumber === season && i.episodeNumber === episode
          )
        );
      } catch (err) {
        console.error("Failed loading watched episodes", err);
      }
    })();
  }, [showId, season, episode]);

  const toggle = async (): Promise<Result> => {
    try {
      if (watched) {
        await axios.delete(
          `/api/history/show/${showId}/season/${season}/episode/${episode}`
        );
      } else {
        await axios.post(
          `/api/history/show/${showId}/season/${season}/episode/${episode}`
        );
      }
      setWatched(!watched);
      return { success: true, watched: !watched };
    } catch (error) {
      console.error("Failed toggling episode", error);
      return { success: false, watched, error };
    }
  };

  return { watched, toggle };
}
