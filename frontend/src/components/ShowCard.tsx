import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import TrailerDialog from "./TrailerDialog";
import ImageWithFallback from "./ImageWithFallback";
import { useWatchlist } from "../hooks/useWatchlist";
import { useNotify } from "../components/NotificationsContext";
import {
  Card,
  CardActionArea,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import {
  Star as StarIcon,
  BookmarkAddOutlined as BookmarkAddIcon,
  BookmarkAdded as BookmarkAddedIcon,
  PlayCircleOutline as PlayIcon,
} from "@mui/icons-material";

interface Show {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
  first_air_date?: string;
}

interface ShowCardProps {
  show: Show;
}

const ShowCard: React.FC<ShowCardProps> = ({ show }) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const notify = useNotify();
  const { inWatchlist, toggle } = useWatchlist(show.id, show.name, "tv");

  const imageUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w342${show.poster_path}`
    : "/default-movie-poster.png";

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
      <Card
        sx={{
          width: 200,
          borderRadius: 8, // more rounded
          boxShadow: 3,
          bgcolor: "transparent",
          overflow: "visible",
        }}
      >
        {/* Poster clipped to rounded top corners */}
        <Box
          sx={{
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            overflow: "hidden",
          }}
        >
          <CardActionArea
            component={Link}
            to={`/tv/${show.id}`}
            sx={{ display: "block" }}
          >
            <ImageWithFallback
              src={imageUrl}
              fallbackSrc="/default-movie-poster.png"
              alt={`${show.name} Poster`}
              style={
                {
                  width: "100%",
                  aspectRatio: "2/3",
                  objectFit: "cover",
                  display: "block",
                } as React.CSSProperties
              }
            />
            <Chip
              icon={<StarIcon style={{ color: "#fbc02d" }} />}
              label={show.vote_average.toFixed(1)}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                bgcolor: "rgba(0,0,0,0.7)",
                color: "#fff",
                backdropFilter: "blur(4px)",
              }}
            />
          </CardActionArea>
        </Box>

        {/* White bottom panel with rounded bottom corners */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            pt: 1.5,
            px: 1.5,
            pb: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="subtitle1" noWrap fontWeight={600}>
            {show.name}
          </Typography>
          {show.first_air_date && (
            <Typography variant="caption" color="text.secondary">
              {new Date(show.first_air_date).getFullYear()}
            </Typography>
          )}

          <CardActions
            disableSpacing
            sx={{ justifyContent: "space-between", mt: 1, px: 0 }}
          >
            <Tooltip
              title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              <IconButton size="small" onClick={handleWatchToggle}>
                {inWatchlist ? (
                  <BookmarkAddedIcon fontSize="small" />
                ) : (
                  <BookmarkAddIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Play trailer">
              <IconButton size="small" onClick={handleTrailer}>
                <PlayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Box>
      </Card>

      <TrailerDialog
        open={dialogOpen}
        videoKey={trailerKey}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default ShowCard;
