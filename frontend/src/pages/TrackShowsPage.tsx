// src/pages/TrackShowsPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Box,
  Tabs,
  Tab,
  Grid,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";
import TrackedShowCard from "../components/TrackedShowCard";
import UpcomingShowCard, { UpcomingShow } from "../components/UpcomingShowCard";
import EpisodeHistoryDialog from "../components/EpisodeHistoryDialog";
import { useNotify } from "../components/NotificationsContext";
import ReleaseScheduler from "../components/ReleaseScheduler";

interface TrackingEntry {
  id: number;
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  paused: boolean;
}

export default function TrackShowsPage() {
  const nav = useNavigate();
  const notify = useNotify();

  const [tab, setTab] = useState<0 | 1>(0);
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [histDlg, setHistDlg] = useState<{
    open: boolean;
    showId: number;
    showName: string;
  }>({
    open: false,
    showId: 0,
    showName: "",
  });
  const [detailsMap, setDetailsMap] = useState<{
    [showId: number]: {
      nextEp: {
        season_number: number;
        episode_number: number;
        air_date: string;
      } | null;
      lastEp: {
        season_number: number;
        episode_number: number;
        air_date: string;
      } | null;
    };
  }>({});

  const loadEntries = async () => {
    setLoading(true);
    try {
      // 1) load your tracking entries
      const { data: list } = await axios.get<TrackingEntry[]>("/api/tracking");
      setEntries(list);

      // 2) fetch details for each show (next_ep & last_ep) in parallel
      const detailResponses = await Promise.all(
        list.map((e) =>
          axios.get<{
            id: number;
            name: string;
            next_episode_to_air: {
              season_number: number;
              episode_number: number;
              air_date: string;
              name: string;
            } | null;
            last_episode_to_air: {
              season_number: number;
              episode_number: number;
              air_date: string;
            } | null;
            poster_path: string | null;
          }>(`/api/shows/${e.showId}`)
        )
      );

      // 3) build a lookup map for filtering “caught-up” shows
      const map: typeof detailsMap = {};
      detailResponses.forEach(({ data }) => {
        map[data.id] = {
          nextEp: data.next_episode_to_air
            ? {
                season_number: data.next_episode_to_air.season_number,
                episode_number: data.next_episode_to_air.episode_number,
                air_date: data.next_episode_to_air.air_date,
              }
            : null,
          lastEp: data.last_episode_to_air
            ? {
                season_number: data.last_episode_to_air.season_number,
                episode_number: data.last_episode_to_air.episode_number,
                air_date: data.last_episode_to_air.air_date,
              }
            : null,
        };
      });
      setDetailsMap(map);

      // 4) build your upcoming list from that same detailResponses
      const upcomingList: UpcomingShow[] = detailResponses
        .map(({ data }) => {
          const nea = data.next_episode_to_air;
          if (!nea) return null;
          const airDate = new Date(nea.air_date);
          if (airDate <= new Date()) return null;
          return {
            showId: data.id,
            showName: data.name,
            posterUrl: data.poster_path
              ? `https://image.tmdb.org/t/p/w300${data.poster_path}`
              : PortraitPlaceholder,
            nextSeason: nea.season_number,
            nextEpisode: nea.episode_number,
            nextEpisodeName: nea.name,
            nextAirDate: nea.air_date,
            isNewest: false, // default; we’ll mark one below
          };
        })
        .filter((u): u is UpcomingShow => u !== null);

      // 5) sort ascending and tag the very next one
      upcomingList.sort(
        (a, b) =>
          new Date(a.nextAirDate).getTime() - new Date(b.nextAirDate).getTime()
      );
      if (upcomingList.length > 0) {
        upcomingList[0].isNewest = true;
      }

      setUpcoming(upcomingList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const surprise = async () => {
    try {
      const { data } = await axios.get<{ id: number }>("/api/shows/random");
      nav(`/tv/${data.id}`);
      notify({ message: "Enjoy your surprise show!", severity: "info" });
    } catch {
      notify({
        message: "Couldn't grab a surprise right now",
        severity: "error",
      });
      nav("/tv");
    }
  };

  // Mutate an entry after marking watched
  const handleMutate = ({
    entryId,
    season,
    episode,
  }: {
    entryId: number;
    season: number;
    episode: number;
  }) => {
    setEntries((prev) =>
      prev.map((x) =>
        x.id === entryId
          ? { ...x, seasonNumber: season, episodeNumber: episode }
          : x
      )
    );
    notify({
      message: `Marked S${season}·E${episode} as watched`,
      severity: "success",
    });
  };

  const handlePause = (pausedId: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === pausedId ? { ...e, paused: true } : e))
    );
    notify({ message: "Show paused", severity: "info" });
  };

  // Resume a paused entry
  const handleResume = async (e: TrackingEntry) => {
    try {
      await axios.patch(`/api/tracking/${e.id}`, {
        paused: false,
        seasonNumber: e.seasonNumber,
        episodeNumber: e.episodeNumber,
      });
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === e.id ? { ...entry, paused: false } : entry
        )
      );
      notify({
        message: `Resumed at S${e.seasonNumber}·E${e.episodeNumber}`,
        severity: "success",
      });
    } catch {
      notify({ message: "Could not resume tracking", severity: "error" });
    }
  };

  const notCaughtUp = entries.filter((e) => {
    const last = detailsMap[e.showId]?.lastEp;
    if (!last) return true;
    return !(
      e.seasonNumber === last.season_number &&
      e.episodeNumber === last.episode_number
    );
  });

  // 2) keep only shows where lastEp is strictly ahead of your pointer
  const availableEntries = notCaughtUp.filter((e) => {
    const last = detailsMap[e.showId]?.lastEp;
    return (
      !!last &&
      (last.season_number > e.seasonNumber ||
        (last.season_number === e.seasonNumber &&
          last.episode_number > e.episodeNumber))
    );
  });

  // 3) pick the one with the most recent lastEp.air_date
  let newestEntryId: number | null = null;
  let newestTs = 0;
  for (const e of availableEntries) {
    const last = detailsMap[e.showId]!.lastEp!;
    const ts = new Date(last.air_date).getTime();
    if (ts > newestTs) {
      newestTs = ts;
      newestEntryId = e.id;
    }
  }

  // 4) split into your tabs
  const active = notCaughtUp.filter((e) => !e.paused);
  const inProg = active.filter((e) => e.episodeNumber > 0);
  const notStarted = active.filter((e) => e.episodeNumber === 0);
  const paused = entries.filter((e) => e.paused);

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
        >
          <Tab label="Shows" />
          <Tab label="Upcoming" />
        </Tabs>
      </Box>

      {loading ? (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 && entries.length === 0 ? (
        <Box textAlign="center" sx={{ mt: 10 }}>
          <Typography variant="h5" gutterBottom>
            You haven't started tracking any shows yet.
          </Typography>
          <Button variant="contained" onClick={() => nav("/tv")} sx={{ mx: 1 }}>
            Browse Shows
          </Button>
          <Button variant="outlined" onClick={surprise} sx={{ mx: 1 }}>
            Surprise Me
          </Button>
        </Box>
      ) : tab === 0 ? (
        <>
          {/* In Progress */}
          {inProg.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                In Progress
              </Typography>
              <Grid container spacing={2}>
                {inProg.map((e) => (
                  <Grid key={e.id} item xs={12} sm={6} md={4} lg={3}>
                    <TrackedShowCard
                      entryId={e.id}
                      showId={e.showId}
                      isNewest={e.id === newestEntryId}
                      onViewHistory={(showId, showName) =>
                        setHistDlg({ open: true, showId, showName })
                      }
                      onMutate={handleMutate}
                      onPause={handlePause}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Haven’t Started */}
          {notStarted.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Haven’t Started
              </Typography>
              <Grid container spacing={2}>
                {notStarted.map((e) => (
                  <Grid key={e.id} item xs={12} sm={6} md={4} lg={3}>
                    <TrackedShowCard
                      entryId={e.id}
                      showId={e.showId}
                      onViewHistory={(showId, showName) =>
                        setHistDlg({ open: true, showId, showName })
                      }
                      onMutate={handleMutate}
                      onPause={handlePause}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Paused Shows */}
          {paused.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Paused Shows
              </Typography>
              <Grid container spacing={2}>
                {paused.map((e) => (
                  <Grid key={e.id} item xs={12} sm={6} md={4} lg={3}>
                    <TrackedShowCard
                      entryId={e.id}
                      showId={e.showId}
                      paused={true}
                      onResume={() => handleResume(e)}
                      onViewHistory={(showId, showName) =>
                        setHistDlg({ open: true, showId, showName })
                      }
                      onMutate={handleMutate}
                      onPause={handlePause}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      ) : (
        <>
          {/* Upcoming Episodes */}
          {upcoming.length === 0 ? (
            <Box textAlign="center" sx={{ mt: 4 }}>
              <Typography color="gray">No upcoming episodes found.</Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Upcoming Episodes
              </Typography>
              <Grid container spacing={2}>
                {upcoming.map((u) => (
                  <Grid key={u.showId} item xs={12} sm={6} md={4} lg={3}>
                    <UpcomingShowCard
                      show={u}
                      onClick={(id) => nav(`/tv/${id}`)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      <EpisodeHistoryDialog
        open={histDlg.open}
        showId={histDlg.showId}
        showName={histDlg.showName}
        onClose={() => setHistDlg((s) => ({ ...s, open: false }))}
      />
    </Container>
  );
}
