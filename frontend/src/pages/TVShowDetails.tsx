// src/pages/ShowDetails.tsx
import React, { useState, useEffect } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Rating,
  Tooltip,
  Dialog,
  DialogContent,
  LinearProgress,
  Typography,
  Link,
} from "@mui/material";
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import { useNotify } from "../components/NotificationsContext";
import { useWatchlist } from "../hooks/useWatchlist";
import { useTracking } from "../hooks/useTracking";
import TrailerDialog from "../components/TrailerDialog";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";
import "./MovieDetails.css";

interface Genre {
  id: number;
  name: string;
}
interface CastMember {
  id: number;
  name: string;
  profile_path: string;
  roles: { character: string; episode_count: number }[];
}
interface CrewMember {
  id: number;
  name: string;
  job: string;
}
interface ShowDetail {
  id: number;
  name: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  vote_average: number;
  first_air_date: string;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  genres: Genre[];
  original_language: string;
  seasons: { season_number: number; episode_count: number }[];
  last_episode_to_air: {
    season_number: number;
    episode_number: number;
    air_date: string;
  } | null;
}

const ShowDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const notify = useNotify();

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [allCast, setAllCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [castDialog, setCastDialog] = useState(false);
  const [avgRuntime, setAvgRuntime] = useState<number | null>(null);
  const [historyEntries, setHistoryEntries] = useState<
    { seasonNumber: number; episodeNumber: number }[]
  >([]);

  const { inWatchlist, toggle: toggleWatchlist } = useWatchlist(
    Number(id),
    show?.name ?? "",
    "tv"
  );
  const {
    tracking,
    pausedEntry,
    start: startTracking,
    pause: pauseTracking,
    loading: trackingLoading,
  } = useTracking(Number(id), show?.name ?? "");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [showRes, creditsRes, videosRes, ratingRes] = await Promise.all([
          axios.get<ShowDetail & { averageRuntime: number }>(
            `/api/shows/${id}`
          ),
          axios.get<{ cast: CastMember[]; crew: CrewMember[] }>(
            `/api/shows/${id}/aggregate_credits`
          ),
          axios.get<{ results: any[] }>(`/api/shows/${id}/videos`),
          axios.get<{ score: number }>(`/api/ratings/${id}`),
        ]);

        setShow(showRes.data);
        setAvgRuntime(showRes.data.averageRuntime);
        setAllCast(creditsRes.data.cast);
        setCast(creditsRes.data.cast.slice(0, 9));
        setCrew(creditsRes.data.crew);

        const trailer = videosRes.data.results.find(
          (v) => v.site === "YouTube" && v.type === "Trailer"
        );
        setTrailerKey(trailer?.key ?? null);

        setUserRating(ratingRes.data?.score ?? 0);
      } catch (e) {
        console.error("Error loading show details", e);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    axios
      .get<{ seasonNumber: number; episodeNumber: number }[]>(
        `/api/history/show/${id}`
      )
      .then((res) => setHistoryEntries(res.data))
      .catch(() => {});
  }, [id]);

  // — toggle watchlist
  const handleWatchToggle = async () => {
    const res = await toggleWatchlist();
    notify({
      message: res.success
        ? res.added
          ? "Added to watchlist"
          : "Removed from watchlist"
        : "Could not update watchlist",
      severity: res.success ? (res.added ? "success" : "info") : "error",
    });
  };

  // — rate show
  const handleRatingChange = async (_: any, newVal: number | null) => {
    if (newVal == null || !show) return;
    try {
      await axios.post(`/api/ratings/${id}`, {
        mediaName: show.name,
        mediaType: "tv",
        score: newVal,
      });
      setUserRating(newVal);
      notify({ message: `Rated ${newVal.toFixed(1)}`, severity: "success" });
    } catch {
      notify({ message: "Could not save rating", severity: "error" });
    }
  };

  const handleTrackToggle = async () => {
    if (!show) return;
    try {
      if (tracking) {
        await pauseTracking();
        notify({
          message: `Paused at S${tracking.seasonNumber}·E${tracking.episodeNumber}`,
          severity: "info",
        });
      } else {
        const entry = await startTracking();
        notify({
          message: `Tracking at S${entry.seasonNumber}·E${entry.episodeNumber}`,
          severity: "success",
        });
      }
    } catch {
      notify({ message: "Could not update tracking", severity: "error" });
    }
  };

  if (!show) {
    return <div className="loading-screen">Loading show details…</div>;
  }

  const backdropUrl = `https://image.tmdb.org/t/p/original${show.backdrop_path}`;
  const year = new Date(show.first_air_date).getFullYear();

  const lastEp = show.last_episode_to_air;
  const seasons = show.seasons.filter((s) => s.season_number > 0);

  let totalAired = 0;
  if (lastEp) {
    // sum all fully‐aired seasons
    totalAired =
      seasons
        .filter((s) => s.season_number < lastEp.season_number)
        .reduce((sum, s) => sum + s.episode_count, 0) + lastEp.episode_number;
  }
  // compute how many you've watched so far:
  const watchedSet = new Set<string>();
  for (const h of historyEntries) {
    if (h.seasonNumber > 0) {
      watchedSet.add(`${h.seasonNumber}:${h.episodeNumber}`);
    }
  }
  const watchedCount = watchedSet.size;

  // percentage clamped to 100
  const percent =
    totalAired > 0 ? Math.round((watchedCount / totalAired) * 100) : 0;

  // choose bar color
  let barColor: "primary" | "warning" | "success" = "primary";
  if (percent === 100) barColor = "success";
  else if (pausedEntry) barColor = "warning";

  return (
    <div className="detail-page">
      {/* Hero Banner */}
      <Box
        className="detail-banner"
        sx={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <Box className="detail-banner-overlay" />
        <Box className="detail-info container">
          <Typography variant="h3" gutterBottom>
            {show.name}
          </Typography>
          <Typography variant="subtitle1" className="sub">
            {year} •{" "}
            <Link
              component={RouterLink}
              to={`/tv/${id}/seasons`}
              color="primary.light" // bright on dark background
              underline="hover"
              sx={{
                fontWeight: 600,
                px: 0.5, // a bit of padding so it’s easier to hit
                borderRadius: 1,
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
                "&:visited": {
                  color: "primary.light", // prevent that default purple
                },
              }}
            >
              {show.number_of_seasons} seasons
            </Link>
            {avgRuntime != null && <> • {avgRuntime} min avg ep</>}
          </Typography>

          <Box sx={{ mt: 2 }} className="detail-extra">
            <Typography variant="subtitle1">
              <strong>Genres:</strong>{" "}
              {show.genres.map((g) => g.name).join(", ")}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Episodes:</strong> {show.number_of_episodes}
            </Typography>
          </Box>

          <Typography variant="subtitle2" gutterBottom className="language">
            Language: {show.original_language.toUpperCase()}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2">
              Watched {watchedCount} of {totalAired} aired ({percent}%)
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percent}
              color={barColor}
              sx={{ height: 10, borderRadius: 5, mt: 1 }}
            />
          </Box>
          {/* Stats & Actions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              mt: 1,
            }}
          >
            <Tooltip title="TMDB Score">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h5" sx={{ color: "#f5c518" }}>
                  {show.vote_average.toFixed(1)}
                </Typography>
                <Rating
                  value={show.vote_average / 2}
                  readOnly
                  precision={0.1}
                  size="large"
                  sx={{
                    color: "#f5c518",
                    "& .MuiRating-iconEmpty": { color: "#666" },
                  }}
                />
              </Box>
            </Tooltip>

            <Tooltip title="Your Rating">
              <Rating
                value={userRating}
                onChange={handleRatingChange}
                precision={0.5}
                size="large"
                max={10}
                sx={{
                  color: "#4caf50",
                  "& .MuiRating-iconEmpty": { color: "#fff" },
                }}
              />
            </Tooltip>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              gap: 2,
            }}
          >
            <Button
              size="medium"
              variant="contained"
              color="secondary"
              startIcon={<PlayArrowIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: "24px",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: 6,
                  transform: "scale(1.05)",
                  backgroundColor: "#f50057",
                },
              }}
            >
              Trailer
            </Button>
            <Button
              size="medium"
              variant={tracking ? "outlined" : "contained"}
              color={tracking ? "warning" : "primary"}
              startIcon={<HistoryEduIcon />}
              onClick={handleTrackToggle}
              disabled={trackingLoading}
              sx={{
                borderRadius: "24px",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: 6,
                  transform: "scale(1.05)",
                  backgroundColor: tracking ? "#f57c00" : "#303f9f",
                },
              }}
            >
              {trackingLoading
                ? "…"
                : tracking
                  ? "Stop Tracking"
                  : pausedEntry
                    ? `Resume at S${pausedEntry.seasonNumber}·E${pausedEntry.episodeNumber}`
                    : "Start Tracking"}
            </Button>
            <Button
              size="medium"
              variant={inWatchlist ? "contained" : "outlined"}
              color={inWatchlist ? "warning" : "info"}
              startIcon={
                inWatchlist ? <FavoriteIcon /> : <FavoriteBorderIcon />
              }
              onClick={handleWatchToggle}
              sx={{
                borderRadius: "24px",
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: 6,
                  transform: "scale(1.05)",
                  backgroundColor: inWatchlist ? "#f57c00" : "#00acc1",
                  borderColor: inWatchlist ? "#f57c00" : "#00838f",
                },
                borderColor: inWatchlist ? "#ff9800" : "#00bcd4",
                borderWidth: 2,
                borderStyle: "solid",
                "&:focus": {
                  outline: "none",
                },
              }}
            >
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Top Cast Preview */}
      <section className="cast-section container">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">Top Cast</Typography>
          <RouterLink
            to={`/tv/${id}/credits`}
            style={{ textDecoration: "none" }}
            onClick={() => setCastDialog(true)}
          >
            <Button variant="text">See All</Button>
          </RouterLink>
        </Box>
        <Box className="cast-grid">
          {cast.map((m) => {
            const totalEps = m.roles.reduce(
              (sum, r) => sum + r.episode_count,
              0
            );
            const chars = m.roles.map((r) => r.character).join(", ");
            return (
              <Box key={m.id} className="cast-card">
                <img
                  src={
                    m.profile_path
                      ? `https://image.tmdb.org/t/p/w185${m.profile_path}`
                      : PortraitPlaceholder
                  }
                  alt={m.name}
                />
                <Typography variant="subtitle2" noWrap>
                  {m.name}
                </Typography>
                <Tooltip title={chars}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    as {chars}
                  </Typography>
                </Tooltip>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}
                >
                  {totalEps} {totalEps === 1 ? "episode" : "episodes"}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </section>

      {/* Trailer Dialog */}
      <TrailerDialog
        open={dialogOpen}
        videoKey={trailerKey}
        onClose={() => setDialogOpen(false)}
      />

      {/* Full Cast Dialog */}
      <Dialog
        open={castDialog}
        onClose={() => setCastDialog(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Full Cast
          </Typography>
          <Box className="cast-grid-full">
            {allCast.map((m) => {
              const totalEps = m.roles.reduce(
                (sum, r) => sum + r.episode_count,
                0
              );
              const chars = m.roles.map((r) => r.character).join(", ");
              return (
                <Box key={m.id} className="cast-card-full">
                  <img
                    src={
                      m.profile_path
                        ? `https://image.tmdb.org/t/p/w185${m.profile_path}`
                        : PortraitPlaceholder
                    }
                    alt={m.name}
                  />
                  <Typography variant="subtitle2" noWrap>
                    {m.name}
                  </Typography>
                  <Tooltip title={chars}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      as {chars}
                    </Typography>
                  </Tooltip>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}
                  >
                    {totalEps} {totalEps === 1 ? "episode" : "episodes"}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShowDetails;
