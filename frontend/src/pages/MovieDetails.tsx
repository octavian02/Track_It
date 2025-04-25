// src/pages/MovieDetails.tsx
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
import "./MovieDetails.css";
import TrailerDialog from "../components/TrailerDialog";
import { useNotify } from "../components/NotificationsContext";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";

interface Genre {
  id: number;
  name: string;
}
interface CastMember {
  id: number;
  name: string;
  profile_path: string;
  character: string;
}
interface CrewMember {
  id: number;
  name: string;
  job: string;
}
interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  runtime: number;
  genres: Genre[];
  original_language: string;
}

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [allCast, setAllCast] = useState<CastMember[]>([]);
  const [director, setDirector] = useState<CrewMember[]>([]);
  const [writers, setWriters] = useState<CrewMember[]>([]);
  const [userRating, setUserRating] = useState<number | null>(0);
  // const [isFavorite, setIsFavorite] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [castDialog, setCastDialog] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [movieRes, creditsRes, videosRes, wtchRes, ratingRes] =
          await Promise.all([
            axios.get<MovieDetail>(`/api/movies/${id}`),
            axios.get<{ cast: CastMember[]; crew: CrewMember[] }>(
              `/api/movies/${id}/credits`
            ),
            axios.get<{ results: any[] }>(`/api/movies/${id}/videos`),
            axios.get<{ mediaId: number }[]>(`/api/watchlist`),
            axios.get<{ score: number }>(`/api/ratings/${id}`),
          ]);
        const m = movieRes.data;
        setMovie(m);

        const full = creditsRes.data.cast;

        setAllCast(full);
        setCast(full.slice(0, 8));
        setDirector(creditsRes.data.crew.filter((c) => c.job === "Director"));
        setWriters(
          creditsRes.data.crew.filter((c) =>
            ["Writer", "Screenplay", "Story"].includes(c.job)
          )
        );

        const trailer = videosRes.data.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        );
        setTrailerKey(trailer?.key || null);
        setInWatchlist(wtchRes.data.some((item) => item.mediaId === +id));
        setUserRating(ratingRes.data?.score ?? 0);
      } catch (e) {
        console.error("Error loading movie details", e);
      }
    })();
  }, [id]);

  const toggleWatchlist = async () => {
    if (!movie) return;
    try {
      if (inWatchlist) {
        await axios.delete(`/api/watchlist/${id}`);
        setInWatchlist(false);
        notify({ message: "Removed from watchlist", severity: "info" });
      } else {
        await axios.post(`/api/watchlist/${id}`, {
          movieTitle: movie.title,
        });
        setInWatchlist(true);
        notify({ message: "Added to watchlist", severity: "success" });
      }
    } catch {
      notify({ message: "Could not update watchlist", severity: "error" });
    }
  };

  const onRatingChange = async (_: any, newVal: number | null) => {
    if (newVal == null) return;
    if (!movie) return;
    try {
      await axios.post(`/api/ratings/${id}`, {
        mediaName: movie.title,
        mediaType: "movie",
        score: newVal,
      });
      setUserRating(newVal);
      notify({
        message: `Rated ${newVal.toFixed(1)}`,
        severity: "success",
      });
    } catch {
      notify({ message: "Could not save rating", severity: "error" });
    }
  };

  if (!movie)
    return <div className="loading-screen">Loading movie details…</div>;

  const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
  const year = new Date(movie.release_date).getFullYear();

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
            {movie.title}
          </Typography>
          <Typography variant="subtitle1" className="sub" gutterBottom>
            {year} • {movie.runtime}m •{" "}
            {movie.genres.map((g) => g.name).join(", ")}
          </Typography>
          <Box className="detail-extra" sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              <strong>Director:</strong>{" "}
              {director.map((d) => d.name).join(", ") || "N/A"}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Writers:</strong>{" "}
              {writers.map((w) => w.name).join(", ") || "N/A"}
            </Typography>
          </Box>
          <Typography variant="subtitle2" className="language" gutterBottom>
            Language: {movie.original_language.toUpperCase()}
          </Typography>

          {/* Stats Row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
            <Tooltip title="TMDB Score">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h5" sx={{ color: "#f5c518" }}>
                  {movie.vote_average.toFixed(1)}
                </Typography>
                <Rating
                  value={movie.vote_average / 2}
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
                onChange={onRatingChange}
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
              onClick={toggleWatchlist}
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
          <Link to={`/movie/${id}/credits`} style={{ textDecoration: "none" }}>
            <Button variant="text" onClick={() => setCastDialog(true)}>
              See All
            </Button>
          </Link>
        </Box>
        <Box className="cast-grid">
          {cast.map((member) => (
            <Box key={member.id} className="cast-card">
              <img
                src={
                  member.profile_path
                    ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                    : PortraitPlaceholder
                }
                alt={member.name}
              />
              <Typography variant="subtitle2">{member.name}</Typography>
              <Typography variant="caption">as {member.character}</Typography>
            </Box>
          ))}
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
            {cast.map((member) => (
              <Box key={member.id} className="cast-card">
                <img
                  src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                  alt={member.name}
                />
                <Typography variant="subtitle2">{member.name}</Typography>

                <Tooltip title={member.character}>
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
                    as {member.character}
                  </Typography>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovieDetails;
