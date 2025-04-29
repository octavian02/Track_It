// src/components/HeroCarousel.tsx
import React, { useState, useEffect, useRef, MouseEvent } from "react";
import axios from "axios";
import {
  IconButton,
  Box,
  Typography,
  Button,
  useTheme,
  styled,
} from "@mui/material";
import {
  ArrowBackIos,
  ArrowForwardIos,
  PlayArrow,
  InfoOutlined,
  BookmarkBorder,
  Bookmark,
} from "@mui/icons-material";
import TrailerDialog from "./TrailerDialog";
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

const CarouselRoot = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "55vh",
  color: "#fff",
  overflow: "hidden",
  [theme.breakpoints.down("md")]: {
    height: "50vh",
  },
}));

const Slide = styled(Box)<{ bg: string }>(({ bg }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundImage: `url(${bg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  transition: "opacity 1s ease-in-out",
  opacity: 0,
  zIndex: 0,
  "&.active": { opacity: 1, zIndex: 1 },
}));

const FadeOverlay = styled("div")(({ theme }) => ({
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)",
  zIndex: 2,
}));

const Content = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(4),
  left: theme.spacing(4),
  width: "40%",
  maxWidth: 700,
  zIndex: 3,
  [theme.breakpoints.down("md")]: {
    width: "60%",
    left: theme.spacing(2),
    bottom: theme.spacing(2),
  },
}));

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [slides] = useState(() => [...items].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const timerRef = useRef<number>();
  const theme = useTheme();
  const notify = useNotify();
  const navigate = useNavigate();

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
    timerRef.current = window.setTimeout(next, 7000);
    return () => window.clearTimeout(timerRef.current);
  }, [idx, slides.length]);

  const handlePlay = async () => {
    const path = current.resourceType === "movie" ? "movies" : "shows";
    try {
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
    } catch (err) {
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

  const iconButtonStyle = {
    bgcolor: "rgba(0,0,0,0.5)",
    width: 48,
    height: 48,
    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
    color: "#fff",
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 5,
  };

  return (
    <CarouselRoot>
      {slides.map((item, i) => (
        <Slide
          key={item.id}
          bg={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
          className={i === idx ? "active" : ""}
        />
      ))}

      <FadeOverlay />

      <Content>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2,
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            display: "-webkit-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
          }}
        >
          {current.title}
        </Typography>

        <Typography
          variant="body1"
          paragraph
          sx={{
            maxHeight: "4.8em",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {current.overview}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrow />}
            onClick={handlePlay}
            sx={{
              borderRadius: "24px",
              px: 3,
              py: 1,
              fontWeight: 600,
            }}
          >
            Trailer
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<InfoOutlined />}
            onClick={() => navigate(`/${current.resourceType}/${current.id}`)}
            sx={{
              borderRadius: "24px",
              px: 3,
              py: 1,
              borderColor: "rgba(255,255,255,0.8)",
              color: "rgba(255,255,255,0.9)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
            }}
          >
            More Info
          </Button>

          <Button
            variant={inWatchlist ? "contained" : "outlined"}
            startIcon={inWatchlist ? <Bookmark /> : <BookmarkBorder />}
            onClick={handleWatchToggle}
            sx={{
              borderRadius: "24px",
              px: 3,
              py: 1,
              color: "#fff",
              borderColor: "rgba(255,255,255,0.8)",
              backgroundColor: inWatchlist
                ? "rgba(255,255,255,0.3)"
                : "transparent",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.4)" },
            }}
          >
            {inWatchlist ? "In Watchlist" : "Watchlist"}
          </Button>
        </Box>
      </Content>

      <IconButton
        onClick={prev}
        sx={{ ...iconButtonStyle, left: theme.spacing(2) }}
      >
        <ArrowBackIos />
      </IconButton>

      <IconButton
        onClick={next}
        sx={{ ...iconButtonStyle, right: theme.spacing(2) }}
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
}
