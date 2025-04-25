// src/components/ShowCard.tsx
import React, { useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./MovieCard.css"; // re-use your existing styles
import TrailerDialog from "./TrailerDialog";
import ImageWithFallback from "./ImageWithFallback";
import { useWatchlist } from "../hooks/useWatchlist";
import { useNotify } from "../components/NotificationsContext";

interface Show {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
}

interface ShowCardProps {
  show: Show;
}

const ShowCard: React.FC<ShowCardProps> = ({ show }) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const StarIcon = FaStar as React.FC<React.SVGProps<SVGSVGElement>>;
  const notify = useNotify();
  const { inWatchlist, toggle } = useWatchlist(show.id, show.name, "tv");

  const handleTrailer = async () => {
    try {
      const { data } = await axios.get<{ results: any[] }>(
        `/api/shows/${show.id}/videos`
      );
      const trailer = data.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      );
      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setDialogOpen(true);
      } else {
        notify({ message: "No trailer available", severity: "info" });
      }
    } catch (err) {
      console.error("Trailer request failed:", err);
      notify({ message: "Could not load trailer", severity: "error" });
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
      <div className="movie-card">
        <Link to={`/tv/${show.id}`} style={{ textDecoration: "none" }}>
          <ImageWithFallback
            className="movie-poster"
            src={
              show.poster_path
                ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
                : "/default-movie-poster.png"
            }
            fallbackSrc="/default-movie-poster.png"
            alt={`${show.name} Poster`}
          />
        </Link>
        <div className="movie-details">
          <h3 className="movie-title">{show.name}</h3>
          <div className="movie-rating">
            <StarIcon className="star-icon" />
            <span>{show.vote_average.toFixed(1)}</span>
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
      </div>
      <TrailerDialog
        open={dialogOpen}
        videoKey={trailerKey}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default ShowCard;
