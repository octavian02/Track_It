// src/pages/MovieDetails.tsx
import React, { useState, useEffect, useRef } from "react";
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
import CheckIcon from "@mui/icons-material/Check";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import TrailerDialog from "../components/TrailerDialog";
import { useNotify } from "../components/NotificationsContext";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";
import { useWatchedMovie } from "../hooks/useHistory";
import { useWatchlist } from "../hooks/useWatchlist";
import "./MovieDetails.css";
import HorizontalCarousel, {
  CarouselItem,
} from "../components/HorizontalCarousel";

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
  belongs_to_collection?: {
    id: number;
    name: string;
  } | null;
}

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [allCast, setAllCast] = useState<CastMember[]>([]);
  const [director, setDirector] = useState<CrewMember[]>([]);
  const [writers, setWriters] = useState<CrewMember[]>([]);
  const [userRating, setUserRating] = useState<number | null>(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [castDialog, setCastDialog] = useState(false);
  const [recommendations, setRecommendations] = useState<CarouselItem[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const notify = useNotify();
  const movieId = Number(id);
  const { watched, toggle: toggleWatched } = useWatchedMovie(movieId);
  const { inWatchlist, toggle: toggleWatchlist } = useWatchlist(
    movieId,
    movie?.title || "",
    "movie"
  );

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [movieRes, creditsRes, videosRes, ratingRes] = await Promise.all([
          axios.get<MovieDetail>(`/api/movies/${id}`),
          axios.get<{ cast: CastMember[]; crew: CrewMember[] }>(
            `/api/movies/${id}/credits`
          ),
          axios.get<{ results: any[] }>(`/api/movies/${id}/videos`),
          axios.get<{ score: number }>(`/api/ratings/${id}`),
        ]);

        const m = movieRes.data;
        setMovie(m);

        const full = creditsRes.data.cast;
        setAllCast(full);
        setCast(full.slice(0, 9));
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
        setUserRating(ratingRes.data?.score ?? 0);
      } catch (e) {
        console.error("Error loading movie details", e);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!movie) return;
    let mounted = true;
    setLoadingRecs(true);

    const coll$ = movie.belongs_to_collection
      ? axios.get<{ parts: any[] }>(
          `/api/movies/collection/${movie.belongs_to_collection.id}`
        )
      : Promise.resolve({ data: { parts: [] } });

    const rec$ = axios.get<{ results: any[] }>(`/api/movies/${id}/similar`);

    Promise.all([coll$, rec$])
      .then(([colRes, recRes]) => {
        if (!mounted) return;

        // 1) collection entries, excluding the current movie
        const collItems: CarouselItem[] = colRes.data.parts
          .filter((p) => p.id !== movie.id)
          .map((p) => ({
            id: p.id,
            title: p.title,
            poster_path: p.poster_path,
            vote_average: p.vote_average,
            release_date: p.release_date,
            resourceType: "movie",
          }));

        const recItems: CarouselItem[] = recRes.data.results
          .filter(
            (r) =>
              r.id !== movie.id &&
              !collItems.some((c) => c.id === r.id) &&
              r.poster_path && // <-- must have a poster
              r.title && // <-- must have a title
              r.release_date // <-- must have a release date
          )
          .map((r) => ({
            id: r.id,
            title: r.title,
            poster_path: r.poster_path,
            vote_average: r.vote_average,
            release_date: r.release_date,
            resourceType: "movie",
          }));

        setRecommendations([...collItems, ...recItems]);
      })
      .catch((err) => console.error("Recs fetch failed:", err))
      .finally(() => mounted && setLoadingRecs(false));

    return () => {
      mounted = false;
    };
  }, [movie, id]);

  const onRatingChange = async (_: any, newVal: number | null) => {
    if (newVal == null || !movie) return;
    try {
      await axios.post(`/api/ratings/${id}`, {
        mediaName: movie.title,
        mediaType: "movie",
        score: newVal,
      });
      setUserRating(newVal);
      notify({ message: `Rated ${newVal.toFixed(1)}`, severity: "success" });
    } catch {
      notify({ message: "Could not save rating", severity: "error" });
    }
  };

  const handleWatchlist = () => {
    toggleWatchlist();
    notify({
      message: inWatchlist ? "Removed from watchlist" : "Added to watchlist",
      severity: inWatchlist ? "info" : "success",
    });
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
              variant={inWatchlist ? "contained" : "outlined"}
              color={inWatchlist ? "warning" : "info"}
              startIcon={
                inWatchlist ? <FavoriteIcon /> : <FavoriteBorderIcon />
              }
              onClick={handleWatchlist}
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
              }}
            >
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </Button>
            <Button
              size="medium"
              variant={watched ? "contained" : "outlined"}
              color={watched ? "success" : "primary"}
              startIcon={watched ? <CheckIcon /> : <WatchLaterIcon />}
              onClick={async () => {
                const res = await toggleWatched(movie.title);
                if (!res.success) {
                  notify({
                    message: "Could not update history",
                    severity: "error",
                  });
                }
              }}
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
                  backgroundColor: watched ? "#388e3c" : "#3f51b5",
                  borderColor: watched ? "#388e3c" : "#303f9f",
                },
                minWidth: 140,
                borderColor: watched ? "#4caf50" : "#3f51b5",
                borderWidth: 2,
                borderStyle: "solid",
                "&:focus": {
                  outline: "none",
                },
              }}
            >
              {watched ? "Watched" : "Mark as Watched"}
            </Button>
          </Box>
        </Box>
      </Box>

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
            <Button>See All</Button>
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
      <HorizontalCarousel
        title="Similar Movies"
        loading={loadingRecs}
        items={recommendations}
      />
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
            {allCast.map((member) => (
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
