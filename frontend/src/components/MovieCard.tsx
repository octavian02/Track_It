// src/components/MovieCard.tsx
import React, { useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./MovieCard.css";
import TrailerDialog from "./TrailerDialog";
import ImageWithFallback from "./ImageWithFallback";
import { useNotify } from "../components/NotificationsContext";
import { useWatchlist } from "../hooks/useWatchlist";
import { motion } from "framer-motion";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const StarIcon = FaStar as React.FC<React.SVGProps<SVGSVGElement>>;
  const notify = useNotify();
  const { inWatchlist, toggle } = useWatchlist(movie.id, movie.title, "movie");

  const handleTrailer = async () => {
    if (!movie.id) {
      alert("No movie ID available.");
      return;
    }
    try {
      const { data } = await axios.get<{ results: any[] }>(
        `/api/movies/${movie.id}/videos`
      );
      console.log(data);
      const trailer = data.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      );
      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setDialogOpen(true);
      } else {
        alert("No trailer found for this movie.");
      }
    } catch (err: any) {
      console.error("Trailer request failed:", err.response || err);
      alert("Could not load trailer.");
    }
  };

  const handleWatchToggle = async () => {
    const res = await toggle();
    if (!res.success) {
      notify({ message: "Could not update watchlist", severity: "error" });
    } else {
      notify({
        message: res.added ? "Added to watchlist" : "Removed from watchlist",
        severity: res.added ? "success" : "info",
      });
    }
  };

  return (
    <>
      <motion.div
        className="movie-card"
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}
        whileTap={{ scale: 0.98 }}
      >
        <Link to={`/movie/${movie.id}`} style={{ textDecoration: "none" }}>
          <ImageWithFallback
            className="movie-poster"
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                : "/default-movie-poster.png"
            }
            fallbackSrc="/default-movie-poster.png"
            alt={`${movie.title} Poster`}
          />
        </Link>
        <div className="movie-details">
          <h3 className="movie-title">{movie.title}</h3>
          <div className="movie-rating">
            <StarIcon className="star-icon" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>
          <div className="movie-actions">
            <div className="movie-actions">
              <button className="watchlist-button" onClick={handleWatchToggle}>
                {inWatchlist ? <>In Watchlist</> : "+ Watchlist"}
              </button>
            </div>
            <button className="trailer-button" onClick={handleTrailer}>
              Trailer
            </button>
          </div>
        </div>
      </motion.div>
      <TrailerDialog
        open={dialogOpen}
        videoKey={trailerKey}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default MovieCard;
