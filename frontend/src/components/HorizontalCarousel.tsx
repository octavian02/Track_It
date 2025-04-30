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
import ShowCard from "./ShowCard";

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

const HorizontalCarousel: React.FC<Props> = ({ title, loading, items }) => {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  };

  useEffect(() => {
    updateArrows();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [items]);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <Box mt={6} px={2} overflow="hidden">
      {" "}
      {/* hide overflow */}
      <Typography variant="h5" mb={1}>
        {title}
      </Typography>
      {loading ? (
        <Box textAlign="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">
          No {title.toLowerCase()} found.
        </Typography>
      ) : (
        <Box position="relative">
          {/* LEFT ARROW */}
          <IconButton
            onClick={() => scroll("left")}
            disabled={!canLeft}
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              zIndex: 10,
            }}
          >
            <ChevronLeft
              fontSize="large"
              sx={{
                color: canLeft
                  ? theme.palette.text.primary
                  : theme.palette.action.disabled,
              }}
            />
          </IconButton>

          {/* SCROLL STRIP */}
          <Box
            ref={ref}
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              scrollBehavior: "smooth",
              pr: 1,
              pl: 1, // small internal padding
              "::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {items.map((it) => (
              <Box key={it.id} sx={{ flex: "0 0 auto", width: 140 }}>
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

          {/* RIGHT ARROW */}
          <IconButton
            onClick={() => scroll("right")}
            disabled={!canRight}
            sx={{
              position: "absolute",
              top: "50%",
              right: 0,
              transform: "translate(50%, -50%)",
              bgcolor: "background.paper",
              zIndex: 10,
            }}
          >
            <ChevronRight
              fontSize="large"
              sx={{
                color: canRight
                  ? theme.palette.text.primary
                  : theme.palette.action.disabled,
              }}
            />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default HorizontalCarousel;
