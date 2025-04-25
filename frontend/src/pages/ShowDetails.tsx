// src/pages/ShowDetails.tsx
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Rating,
  Tooltip,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import { useNotify } from "../components/NotificationsContext";
import { useWatchlist } from "../hooks/useWatchlist";
import TrailerDialog from "../components/TrailerDialog";
import "./MovieDetails.css";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";

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
  const [directors, setDirectors] = useState<CrewMember[]>([]);
  const [producers, setProducers] = useState<CrewMember[]>([]);
  const [showrunners, setShowrunners] = useState<CrewMember[]>([]);
  const [writers, setWriters] = useState<CrewMember[]>([]);
  const [avgRuntime, setAvgRuntime] = useState<number | null>(null);

  const { inWatchlist, toggle: toggleWatchlist } = useWatchlist(
    Number(id),
    show?.name ?? "",
    "tv"
  );

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [showRes, creditsRes, videosRes, ratingRes] = await Promise.all([
          axios.get<ShowDetail>(`/api/shows/${id}`),
          axios.get<{ cast: CastMember[]; crew: CrewMember[] }>(
            `/api/shows/${id}/aggregate_credits`
          ),
          axios.get<{ results: any[] }>(`/api/shows/${id}/videos`),
          axios.get<{ score: number }>(`/api/ratings/${id}`),
        ]);

        setShow(showRes.data);

        const fullCast = creditsRes.data.cast;
        setAllCast(fullCast);
        setCast(fullCast.slice(0, 8));

        const fullCrew = creditsRes.data.crew;
        setCrew(fullCrew);
        setDirectors(fullCrew.filter((c) => c.job === "Director"));
        setProducers(fullCrew.filter((c) => c.job === "Producer"));
        setShowrunners(
          fullCrew.filter(
            (c) => c.job === "Executive Producer" || c.job === "Creator"
          )
        );
        setWriters(
          fullCrew.filter((c) =>
            ["Writer", "Screenplay", "Story"].includes(c.job)
          )
        );

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
    (async () => {
      try {
        const { data } = await axios.get<{ averageRuntime: number }>(
          `/api/shows/${id}/avg-runtime`
        );
        setAvgRuntime(data.averageRuntime);
      } catch {
        setAvgRuntime(null);
      }
    })();
  }, [id]);

  const handleWatchToggle = async () => {
    const res = await toggleWatchlist();
    if (!res.success) {
      notify({ message: "Could not update watchlist", severity: "error" });
    } else {
      notify({
        message: res.added ? "Added to watchlist" : "Removed from watchlist",
        severity: res.added ? "success" : "info",
      });
    }
  };

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

  if (!show) {
    return <div className="loading-screen">Loading show details…</div>;
  }

  const backdropUrl = `https://image.tmdb.org/t/p/original${show.backdrop_path}`;
  const year = new Date(show.first_air_date).getFullYear();
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
          <Typography variant="subtitle1" gutterBottom className="sub">
            {year} • {show.number_of_seasons} seasons •{" "}
            {avgRuntime !== null && <> • {avgRuntime} min avg ep</>}
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

          {/* Stats & Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
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

            <Button
              variant="outlined"
              startIcon={
                inWatchlist ? <FavoriteIcon /> : <FavoriteBorderIcon />
              }
              onClick={handleWatchToggle}
            >
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </Button>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Play Trailer
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
          <Link to={`/tv/${id}/credits`} style={{ textDecoration: "none" }}>
            <Button variant="text" onClick={() => setCastDialog(true)}>
              See All
            </Button>
          </Link>
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
