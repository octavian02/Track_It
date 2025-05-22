// src/pages/ShowSeasons.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  LinearProgress,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  DoneAll as DoneAllIcon,
  Replay as ReplayIcon,
  RemoveCircle as RemoveCircleIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import defaultShowImage from "../static/default-show-image.jpg";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}
interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
  air_date: string;
}
interface HistoryRow {
  seasonNumber: number;
  episodeNumber: number;
  watchCount: number;
}

const ShowSeasons: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodesMap, setEpisodesMap] = useState<Record<number, Episode[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(0);
  const [historyMap, setHistoryMap] = useState<Record<number, number>>({});
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({ open: false, message: "", severity: "info" });

  // 1) Fetch seasons & episodes
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await axios.get<{ seasons: Season[] }>(
          `/api/shows/${id}`
        );
        // Specials (0) go last
        const normal = data.seasons.filter((s) => s.season_number > 0);
        const specials = data.seasons.filter((s) => s.season_number === 0);
        const ordered = [...normal, ...specials];
        setSeasons(ordered);
        if (ordered.length) setSelectedSeason(ordered[0].season_number);

        // Fetch episodes per season
        const calls = ordered.map((s) =>
          axios
            .get<{
              episodes: Episode[];
            }>(`/api/shows/${id}/seasons/${s.season_number}`)
            .then((res) => ({
              season: s.season_number,
              episodes: res.data.episodes,
            }))
        );
        const results = await Promise.all(calls);
        const map: Record<number, Episode[]> = {};
        results.forEach((r) => (map[r.season] = r.episodes));
        setEpisodesMap(map);
      } catch {
        /* ignore errors */
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 2) Fetch watch counts
  useEffect(() => {
    if (!id) return;
    axios
      .get<HistoryRow[]>(`/api/history/show/${id}`)
      .then((res) => {
        const map: Record<number, number> = {};
        res.data
          .filter((h) => h.seasonNumber === selectedSeason)
          .forEach((h) => {
            map[h.episodeNumber] = h.watchCount;
          });
        setHistoryMap(map);
      })
      .catch(() => {});
  }, [id, selectedSeason]);

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 8 }}>
        <Typography>Loading…</Typography>
      </Container>
    );
  }

  const episodes = episodesMap[selectedSeason] || [];
  const totalCount = episodes.length;
  const watchedCount = Object.keys(historyMap).length;
  const isComplete = watchedCount === totalCount && totalCount > 0;

  // 3) Season-level actions
  const toggleSeason = async () => {
    if (!id || selectedSeason === 0) return;
    try {
      if (!isComplete) {
        // mark all
        await axios.post(
          `/api/tracking/show/${id}/season/${selectedSeason}/complete`
        );
        const newMap: Record<number, number> = {};
        episodes.forEach((ep) => {
          newMap[ep.episode_number] = 1;
        });
        setHistoryMap(newMap);
        setSnackbar({
          open: true,
          message: "Season marked complete",
          severity: "success",
        });
      } else {
        // rewatch all
        await Promise.all(
          episodes.map((ep) =>
            axios.post(
              `/api/history/episode/${id}/${selectedSeason}/${ep.episode_number}`
            )
          )
        );
        const newMap: Record<number, number> = {};
        episodes.forEach((ep) => {
          newMap[ep.episode_number] = (historyMap[ep.episode_number] || 1) + 1;
        });
        setHistoryMap(newMap);
        setSnackbar({
          open: true,
          message: "Season rewatched",
          severity: "info",
        });
      }
    } catch {
      setSnackbar({ open: true, message: "Action failed", severity: "error" });
    }
  };

  const unwatchSeason = async () => {
    if (!id || selectedSeason === 0) return;
    try {
      // call the new bulk-unwatch route
      await axios.delete(`/api/history/season/${id}/${selectedSeason}`);

      // locally decrement each count by one
      setHistoryMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const ep = Number(k);
          const cnt = next[ep];
          if (cnt > 1) next[ep] = cnt - 1;
          else delete next[ep];
        });
        return next;
      });

      setSnackbar({
        open: true,
        message: "Removed one viewing from every episode in this season",
        severity: "info",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to unwatch season",
        severity: "error",
      });
    }
  };

  // 4) Episode-level actions
  const toggleEpisode = async (epNum: number) => {
    if (!id) return;
    try {
      if (historyMap[epNum]) {
        // remove one watch
        await axios.delete(
          `/api/history/episode/${id}/${selectedSeason}/${epNum}`
        );
        setHistoryMap((prev) => {
          const next = { ...prev };
          const num = next[epNum];
          if (num > 1) next[epNum] = num - 1;
          else delete next[epNum];
          return next;
        });
        setSnackbar({
          open: true,
          message: `Removed one watch of episode ${epNum}`,
          severity: "info",
        });
      } else {
        // mark watched
        await axios.post(
          `/api/history/episode/${id}/${selectedSeason}/${epNum}`
        );
        setHistoryMap((prev) => ({ ...prev, [epNum]: 1 }));
        setSnackbar({
          open: true,
          message: `Watched episode ${epNum}`,
          severity: "success",
        });
      }
    } catch {
      setSnackbar({ open: true, message: "Action failed", severity: "error" });
    }
  };

  const rewatchEpisode = async (epNum: number) => {
    if (!id) return;
    try {
      await axios.post(`/api/history/episode/${id}/${selectedSeason}/${epNum}`);
      setHistoryMap((prev) => ({
        ...prev,
        [epNum]: (prev[epNum] || 1) + 1,
      }));
      setSnackbar({
        open: true,
        message: `Rewatched episode ${epNum}`,
        severity: "info",
      });
    } catch {
      setSnackbar({ open: true, message: "Action failed", severity: "error" });
    }
  };

  // 5) Progress bar color
  const percent = totalCount
    ? Math.round((watchedCount / totalCount) * 100)
    : 0;
  let barColor: "error" | "warning" | "success" = "error";
  if (percent >= 80) barColor = "success";
  else if (percent >= 50) barColor = "warning";

  return (
    <Container sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{ textTransform: "none", mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">Episode Guide</Typography>
        </Box>
        {selectedSeason !== 0 && (
          <Box>
            <Tooltip
              title={
                isComplete
                  ? "Rewatch entire season"
                  : "Mark entire season watched"
              }
            >
              <span>
                <Button
                  startIcon={isComplete ? <ReplayIcon /> : <DoneAllIcon />}
                  variant="contained"
                  color="primary"
                  onClick={toggleSeason}
                  sx={{ textTransform: "none", mr: 1 }}
                >
                  {isComplete ? "Rewatch Season" : "Complete Season"}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Unwatch one viewing of the season">
              <span>
                <Button
                  startIcon={<RemoveCircleIcon />}
                  variant="outlined"
                  color="secondary"
                  onClick={unwatchSeason}
                  sx={{ textTransform: "none" }}
                >
                  Unwatch Season
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Progress */}
      {selectedSeason !== 0 && totalCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={percent}
            color={barColor}
            sx={{ height: 10, borderRadius: 5, mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {watchedCount} / {totalCount} watched ({percent}%)
          </Typography>
        </Box>
      )}

      {/* Season Tabs */}
      <Tabs
        value={selectedSeason}
        onChange={(_, sn) => {
          setSelectedSeason(sn);
          setHistoryMap({});
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {seasons.map((s) => (
          <Tab
            key={s.season_number}
            label={
              s.season_number === 0 ? "Specials" : `Season ${s.season_number}`
            }
            value={s.season_number}
          />
        ))}
      </Tabs>

      {/* Episodes */}
      <Box>
        {episodes.map((ep) => {
          const count = historyMap[ep.episode_number] || 0;
          return (
            <Card
              key={ep.id}
              sx={{
                display: "flex",
                mb: 3,
                boxShadow: 3,
                transition: "box-shadow 0.3s",
                "&:hover": { boxShadow: 6 },
              }}
            >
              <CardMedia
                component="img"
                image={
                  ep.still_path
                    ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                    : defaultShowImage
                }
                alt={ep.name}
                sx={{ width: 150, objectFit: "cover" }}
              />
              <Box sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {ep.episode_number}. {ep.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ep.air_date
                      ? format(new Date(ep.air_date), "MMM d, yyyy")
                      : "TBA"}{" "}
                    • {ep.runtime != null ? `${ep.runtime} min` : "–"}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {ep.overview || "No synopsis available."}
                  </Typography>
                </CardContent>
              </Box>
              <CardActions>
                <Tooltip
                  title={
                    count > 0 ? "Unwatch this episode" : "Watch this episode"
                  }
                >
                  <span>
                    <IconButton
                      onClick={() => toggleEpisode(ep.episode_number)}
                      color={count > 0 ? "primary" : "default"}
                    >
                      {count > 0 ? (
                        <CheckCircleIcon />
                      ) : (
                        <CheckCircleOutlineIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={`Rewatch (${count})`}>
                  <span>
                    <IconButton
                      onClick={() => rewatchEpisode(ep.episode_number)}
                      disabled={count === 0}
                    >
                      <ReplayIcon />
                      {count > 1 && (
                        <Chip label={count} size="small" sx={{ ml: 0.5 }} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ShowSeasons;
