import React, { useState } from "react";
import axios from "axios";
import { Box, Typography, Button, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { styled } from "@mui/system";
import TrailerDialog from "./TrailerDialog";
import { Link } from "react-router-dom";

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
}

interface HeroBannerProps {
  movie: Movie;
  onMoreInfo: (movie: Movie) => void;
  onToggleWatchlist: (movie: Movie) => void;
}

const BannerRoot = styled(Box)({
  position: "relative",
  height: "50vh",
  color: "#fff",
  display: "flex",
  alignItems: "flex-end",
  padding: "0 2rem",
  backgroundSize: "contain",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
});

const FadeOverlay = styled("div")({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background:
    "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
});

const Content = styled(Box)({
  position: "relative",
  maxWidth: "50%",
});

const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onMoreInfo,
  onToggleWatchlist,
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;

  const handlePlay = async () => {
    try {
      const { data } = await axios.get<{ results: any[] }>(
        `/api/movies/${movie.id}/videos`
      );
      const trailer = data.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      );
      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setDialogOpen(true);
      } else {
        alert("Trailer not available");
      }
    } catch {
      alert("Could not load trailer");
    }
  };

  return (
    <>
      <BannerRoot style={{ backgroundImage: `url(${backdropUrl})` }}>
        <FadeOverlay />
        <Content>
          <Typography variant="h3" gutterBottom>
            {movie.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {movie.overview.length > 200
              ? movie.overview.slice(0, 200) + "…"
              : movie.overview}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handlePlay}
            >
              Play
            </Button>
            <Link to={`/movie/${movie.id}`} style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                startIcon={<InfoOutlinedIcon />}
                onClick={() => onMoreInfo(movie)}
              >
                More Info
              </Button>
            </Link>
            <IconButton
              sx={{ color: "#fff" }}
              onClick={() => onToggleWatchlist(movie)}
            >
              <BookmarkBorderIcon />
            </IconButton>
          </Box>
        </Content>
      </BannerRoot>
      <TrailerDialog
        open={dialogOpen}
        videoKey={trailerKey}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default HeroBanner;
