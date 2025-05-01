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
  Card,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";
import TrackedShowCard from "../components/TrackedShowCard";
import UpcomingShowCard, { UpcomingShow } from "../components/UpcomingShowCard";
import EpisodeHistoryDialog from "../components/EpisodeHistoryDialog";
import { useNotify } from "../components/NotificationsContext";

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

  // Load entries from API
  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data: list } = await axios.get<TrackingEntry[]>("/api/tracking");
      setEntries(list);

      // Build upcoming list
      const upcomingList: UpcomingShow[] = [];
      await Promise.all(
        list.map(async (e) => {
          const { data: details } = await axios.get<{
            name: string;
            poster_path: string | null;
            next_episode_to_air: {
              season_number: number;
              episode_number: number;
              name: string;
              air_date: string;
            } | null;
          }>(`/api/shows/${e.showId}`);
          const nea = details.next_episode_to_air;
          if (nea) {
            const air = new Date(nea.air_date);
            if (air > new Date()) {
              upcomingList.push({
                showId: e.showId,
                showName: details.name,
                posterUrl: details.poster_path
                  ? `https://image.tmdb.org/t/p/w300${details.poster_path}`
                  : PortraitPlaceholder,
                nextSeason: nea.season_number,
                nextEpisode: nea.episode_number,
                nextEpisodeName: nea.name,
                nextAirDate: nea.air_date,
              });
            }
          }
        })
      );
      upcomingList.sort(
        (a, b) =>
          new Date(a.nextAirDate).getTime() - new Date(b.nextAirDate).getTime()
      );
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

  // Remove an entry altogether
  const handleRemoved = (removedId: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== removedId));
    notify({ message: "Show removed from your list", severity: "success" });
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

  const active = entries.filter((e) => !e.paused);
  const paused = entries.filter((e) => e.paused);
  const inProg = active.filter((e) => e.episodeNumber > 0);
  const notStarted = active.filter((e) => e.episodeNumber === 0);

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
                      onViewHistory={(showId, showName) =>
                        setHistDlg({ open: true, showId, showName })
                      }
                      onRemoved={handleRemoved}
                      onMutate={handleMutate}
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
                      onRemoved={handleRemoved}
                      onMutate={handleMutate}
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
                      onRemoved={handleRemoved}
                      onMutate={handleMutate}
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
