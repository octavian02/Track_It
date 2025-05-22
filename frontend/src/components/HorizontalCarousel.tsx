// src/components/HorizontalCarousel.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  useTheme,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import MovieCard from "./MovieCard";
import ShowCard from "./TVShowCard";

export interface CarouselItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  resourceType: "movie" | "tv";
}

interface Props {
  title: string;
  loading: boolean;
  items: CarouselItem[];
}

export default function HorizontalCarousel({ title, loading, items }: Props) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Only show things that have already released
  const today = new Date().toISOString().substr(0, 10);
  const filtered = items.filter((it) => {
    const date = it.release_date ?? it.first_air_date;
    return date ? date <= today : true;
  });

  // Check scroll position to enable/disable arrows
  const updateArrows = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    const el = ref.current;
    el?.addEventListener("scroll", updateArrows, { passive: true });
    return () => {
      window.removeEventListener("resize", updateArrows);
      el?.removeEventListener("scroll", updateArrows);
    };
  }, [filtered]);

  // Scroll by 80% of viewport width
  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <Box mt={6} px={4} sx={{ position: "relative", overflow: "visible" }}>
      <Typography variant="h5" mb={1}>
        {title}
      </Typography>

      {loading ? (
        <Box textAlign="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary">
          No {title.toLowerCase()} found.
        </Typography>
      ) : (
        <React.Fragment>
          {/* Left arrow */}
          <IconButton
            onClick={() => scroll("left")}
            disabled={!canLeft}
            sx={{
              position: "absolute",
              top: "50%",
              zIndex: 10,
              left: theme.spacing(1),
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.8)",
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              boxShadow: 1,
            }}
          >
            <ChevronLeft
              fontSize="large"
              sx={{ color: canLeft ? theme.palette.text.primary : "#aaa" }}
            />
          </IconButton>

          {/* Scrollable track */}
          <Box
            ref={ref}
            sx={{
              display: "flex",
              gap: theme.spacing(2),
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {filtered.map((it) => (
              <Box
                key={it.id}
                sx={{
                  flex: "0 0 auto",
                  scrollSnapAlign: "start",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                {it.resourceType === "movie" ? (
                  <MovieCard
                    movie={{
                      id: it.id,
                      title: it.title!,
                      poster_path: it.poster_path ?? "",
                      vote_average: it.vote_average ?? 0,
                      release_date: it.release_date,
                    }}
                  />
                ) : (
                  <ShowCard
                    show={{
                      id: it.id,
                      name: it.name!,
                      poster_path: it.poster_path ?? "",
                      vote_average: it.vote_average ?? 0,
                      first_air_date: it.first_air_date,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {/* Right arrow */}
          <IconButton
            onClick={() => scroll("right")}
            disabled={!canRight}
            sx={{
              position: "absolute",
              top: "50%",
              zIndex: 10,
              right: theme.spacing(1),
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.8)",
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              boxShadow: 1,
            }}
          >
            <ChevronRight
              fontSize="large"
              sx={{ color: canRight ? theme.palette.text.primary : "#aaa" }}
            />
          </IconButton>
        </React.Fragment>
      )}
    </Box>
  );
}
