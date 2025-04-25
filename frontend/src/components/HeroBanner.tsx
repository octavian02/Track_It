import React, { useState } from "react";
import axios from "axios";
import { Box, Typography, Button, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Bookmark } from "@mui/icons-material";
import { styled } from "@mui/system";
import TrailerDialog from "./TrailerDialog";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "../hooks/useWatchlist";
import { useNotify } from "../components/NotificationsContext";

export interface BannerMedia {
  id: number;
  title: string; // use name → title mapping upstream for shows
  overview: string;
  backdrop_path: string;
  poster_path?: string;
  vote_average?: number;
}

interface HeroBannerProps {
  media: BannerMedia;
  resourceType: "movie" | "tv";
  onInfo: (m: BannerMedia) => void;
  onToggleWatchlist: (movie: BannerMedia) => void;
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
  media,
  resourceType,
  onInfo,
  onToggleWatchlist,
}) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { inWatchlist, toggle } = useWatchlist(
    media.id,
    media.title,
    resourceType === "movie" ? "movie" : "tv"
  );
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const backdropUrl =
    `https://image.tmdb.org/t/p/original${media.backdrop_path}`
      ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
      : "/default-movie-poster.png";

  const handlePlay = async () => {
    try {
      const { data } = await axios.get<{ results: any[] }>(
        `/api/${resourceType}/${media.id}/videos`
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
    } catch {
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
    onToggleWatchlist(media);
  };

  return (
    <>
      <BannerRoot sx={{ backgroundImage: `url(${backdropUrl})` }}>
        <FadeOverlay />
        <Content>
          <Typography variant="h3" gutterBottom>
            {media.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {media.overview.length > 200
              ? media.overview.slice(0, 200) + "…"
              : media.overview}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handlePlay}
            >
              Play
            </Button>

            <Button
              variant="outlined"
              startIcon={<InfoOutlinedIcon />}
              onClick={() => navigate(`/${resourceType}/${media.id}`)}
            >
              More Info
            </Button>

            <IconButton sx={{ color: "#fff" }} onClick={handleWatchToggle}>
              {inWatchlist ? <Bookmark /> : <BookmarkBorderIcon />}
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
