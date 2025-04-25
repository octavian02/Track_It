// src/components/HeroCarousel.tsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { IconButton, Box, Typography, Button } from "@mui/material";
import {
  ArrowBackIos,
  ArrowForwardIos,
  PlayArrow,
  InfoOutlined,
  BookmarkBorder,
  Bookmark,
} from "@mui/icons-material";
import TrailerDialog from "./TrailerDialog";
import { styled } from "@mui/system";
import { useWatchlist } from "../hooks/useWatchlist";
import { useNotify } from "./NotificationsContext";
import { useNavigate } from "react-router-dom";

export interface BannerMedia {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path?: string;
  vote_average?: number;
  resourceType: "movie" | "tv";
}

interface HeroCarouselProps {
  items: BannerMedia[];
}

const CarouselRoot = styled(Box)({
  position: "relative",
  height: "50vh",
  color: "#fff",
  overflow: "hidden",
});

const Slide = styled(Box)<{ bg: string }>(({ bg }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundImage: `url(${bg})`,
  backgroundSize: "contain",
  backgroundPosition: "center",
  transition: "opacity 0.8s ease-in-out",
  opacity: 0,
  "&.active": { opacity: 1 },
}));

const Content = styled(Box)({
  position: "absolute",
  bottom: "2rem",
  left: "2rem",
  maxWidth: "50%",
  zIndex: 2,
});

const FadeOverlay = styled("div")({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background:
    "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
  zIndex: 1,
});

// Fisher–Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
  // shuffle once on mount
  const [slides] = useState<BannerMedia[]>(() => shuffleArray(items));
  const [idx, setIdx] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const notify = useNotify();
  const navigate = useNavigate();
  const timerRef = useRef<number>();

  const current = slides[idx];
  const { inWatchlist, toggle } = useWatchlist(
    current.id,
    current.title,
    current.resourceType
  );

  const next = () => setIdx((i) => (i + 1) % slides.length);
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(next, 8000);
    return () => window.clearTimeout(timerRef.current);
  }, [idx, slides.length]);

  const handlePlay = async () => {
    try {
      const path = current.resourceType === "movie" ? "movies" : "shows";
      const { data } = await axios.get<{ results: any[] }>(
        `/api/${path}/${current.id}/videos`
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
  };

  return (
    <CarouselRoot>
      {slides.map((item, i) => (
        <Slide
          key={item.id}
          bg={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
          className={i === idx ? "active" : ""}
        >
          <FadeOverlay />
          {i === idx && (
            <Content>
              <Typography variant="h3" gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {item.overview.length > 200
                  ? item.overview.slice(0, 200) + "…"
                  : item.overview}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handlePlay}
                >
                  Play
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<InfoOutlined />}
                  onClick={() => navigate(`/${item.resourceType}/${item.id}`)}
                >
                  More Info
                </Button>
                <IconButton sx={{ color: "#fff" }} onClick={handleWatchToggle}>
                  {inWatchlist ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              </Box>
            </Content>
          )}
        </Slide>
      ))}

      <IconButton
        onClick={() => {
          prev();
        }}
        sx={{
          position: "absolute",
          left: 16,
          top: "50%",
          color: "#fff",
          zIndex: 3,
        }}
      >
        <ArrowBackIos />
      </IconButton>
      <IconButton
        onClick={() => {
          next();
        }}
        sx={{
          position: "absolute",
          right: 16,
          top: "50%",
          color: "#fff",
          zIndex: 3,
        }}
      >
        <ArrowForwardIos />
      </IconButton>

      <TrailerDialog
        open={dialogOpen}
        videoKey={trailerKey}
        onClose={() => setDialogOpen(false)}
      />
    </CarouselRoot>
  );
};

export default HeroCarousel;
