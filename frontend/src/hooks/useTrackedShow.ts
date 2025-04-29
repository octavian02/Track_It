// src/hooks/useTrackedShow.ts
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface DisplayShow {
  id: number;
  showId: number;
  showName: string;
  posterUrl: string;
  lastSeason: number;
  lastEpisode: number;
  lastEpisodeName: string;
  nextSeason: number;
  nextEpisode: number;
  nextEpisodeName: string;
  totalEpisodes: number;
  episodesLeft: number;
  nextAirDate: string;
}

export function useTrackedShow(entryId: number, showId: number) {
  const [show, setShow] = useState<DisplayShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) fetch the one tracking entry
      const { data: entry } = await axios.get<{
        id: number;
        showId: number;
        showName: string;
        seasonNumber: number;
        episodeNumber: number;
      }>(`/api/tracking/${entryId}`);

      // 2) fetch show details
      const { data: details } = await axios.get<{
        name: string;
        number_of_episodes: number;
        number_of_seasons: number;
        seasons: { season_number: number; episode_count: number }[];
        poster_path: string | null;
        next_episode_to_air: {
          season_number: number;
          episode_number: number;
          name: string;
          air_date: string;
        } | null;
      }>(`/api/shows/${showId}`);

      // 3) fetch current season episodes
      const { data: seasonData } = await axios.get<{
        episodes: { episode_number: number; name: string }[];
      }>(`/api/shows/${showId}/seasons/${entry.seasonNumber}`);

      // 4) compute DisplayShow (same logic as before)…
      const lastEp = seasonData.episodes.find(
        (ep) => ep.episode_number === entry.episodeNumber
      );
      const lastName = lastEp?.name || "";

      let nextSeason = entry.seasonNumber;
      let nextEpisode = entry.episodeNumber + 1;
      let nextName = "";
      if (nextEpisode > seasonData.episodes.length) {
        if (entry.seasonNumber < details.number_of_seasons) {
          nextSeason++;
          nextEpisode = 1;
          const { data: nextSeasonData } = await axios.get<{
            episodes: { episode_number: number; name: string }[];
          }>(`/api/shows/${showId}/seasons/${nextSeason}`);
          nextName =
            nextSeasonData.episodes.find((ep) => ep.episode_number === 1)
              ?.name || "";
        } else {
          nextSeason = entry.seasonNumber;
          nextEpisode = entry.episodeNumber;
        }
      } else {
        nextName =
          seasonData.episodes.find((ep) => ep.episode_number === nextEpisode)
            ?.name || "";
      }

      let watchedTotal = entry.episodeNumber;
      details.seasons.forEach((s) => {
        if (s.season_number < entry.seasonNumber)
          watchedTotal += s.episode_count;
      });
      const episodesLeft = details.number_of_episodes - watchedTotal;

      const posterUrl = details.poster_path
        ? `https://image.tmdb.org/t/p/w300${details.poster_path}`
        : "";

      const built: DisplayShow = {
        id: entry.id,
        showId,
        showName: details.name,
        posterUrl,
        lastSeason: entry.seasonNumber,
        lastEpisode: entry.episodeNumber,
        lastEpisodeName: lastName,
        nextSeason,
        nextEpisode,
        nextEpisodeName: nextName,
        totalEpisodes: details.number_of_episodes,
        episodesLeft,
        nextAirDate: details.next_episode_to_air?.air_date || "",
      };

      setShow(built);
    } catch (e: any) {
      console.error("useTrackedShow error:", e);
      // if it was a 404, we treat that as “gone”
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setShow(null);
      } else {
        setError("Failed to load show");
      }
    } finally {
      setLoading(false);
    }
  }, [entryId, showId]);

  useEffect(() => {
    fetchShow();
  }, [fetchShow]);

  // mutations all refetch on success
  const markWatched = async () => {
    if (!show) return;
    await axios.post(
      `/api/history/episode/${show.showId}/${show.nextSeason}/${show.nextEpisode}`,
      { mediaName: show.showName }
    );
    fetchShow();
  };

  const undo = async () => {
    if (!show) return;
    await axios.delete(
      `/api/history/episode/${show.showId}/${show.lastSeason}/${show.lastEpisode}`
    );
    fetchShow();
  };

  const remove = async () => {
    if (!show) return;
    await axios.delete(`/api/tracking/${show.id}`);
    setShow(null);
  };

  return { show, loading, error, markWatched, undo, remove };
}
