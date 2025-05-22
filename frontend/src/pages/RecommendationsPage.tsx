// src/pages/RecommendationsPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Paper,
  useTheme,
} from "@mui/material";
import ShowCarousel from "../components/TVShowCarousel";
import MovieCarousel from "../components/MovieCarousel";
import "./RecommendationsPage.css";

interface TMDBShow {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
}

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

const RecommendationsPage: React.FC = () => {
  const theme = useTheme();
  const [tvRecs, setTvRecs] = useState<TMDBShow[]>([]);
  const [movieRecs, setMovieRecs] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tvPromise = axios
      .get<TMDBShow[]>("/api/recommendations", {
        params: { type: "tv", count: 10 },
      })
      .then((res) => setTvRecs(res.data))
      .catch((err) => console.error("TV recs failed", err));

    const moviePromise = axios
      .get<TMDBMovie[]>("/api/recommendations", {
        params: { type: "movie", count: 10 },
      })
      .then((res) => setMovieRecs(res.data))
      .catch((err) => console.error("Movie recs failed", err));

    Promise.all([tvPromise, moviePromise]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" sx={{ mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasTV = tvRecs.length > 0;
  const hasMovies = movieRecs.length > 0;

  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.background.default,
        minHeight: "100vh",
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        {/* ─────────── Modern Gradient Banner ─────────── */}
        <Box
          sx={{
            position: "relative",
            mb: 6,
            height: 220,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* subtle purple→pink gradient */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(127,0,255,0.8) 0%, rgba(224,0,255,0.8) 100%)",
            }}
          />
          {/* text overlay */}
          <Box
            sx={{
              position: "relative",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "common.white",
              textAlign: "center",
              px: 2,
            }}
          >
            <Typography variant="h3" component="h1" gutterBottom>
              Recommended for You
            </Typography>
            <Typography variant="h6">
              Personalized picks based on your ratings and your friends’ watches
            </Typography>
          </Box>
        </Box>
        <Container>
          {/* TV Shows Carousel */}
          {hasTV && (
            <Paper
              elevation={1}
              sx={{
                mb: 4,
                p: 2,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" gutterBottom>
                TV Shows You Might Like
              </Typography>
              <div className="recommendation-carousel">
                <ShowCarousel title="" shows={tvRecs} />
              </div>
            </Paper>
          )}

          {hasMovies && (
            <Paper
              elevation={1}
              sx={{
                mb: 4,
                p: 2,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" gutterBottom>
                Movies You Might Like
              </Typography>
              <div className="recommendation-carousel">
                <MovieCarousel title="" movies={movieRecs} />
              </div>
            </Paper>
          )}
        </Container>
        {/* No Recommendations Fallback */}
        {!hasTV && !hasMovies && (
          <Box textAlign="center" mt={4}>
            <Typography variant="subtitle1" color="text.secondary">
              No recommendations found yet. Rate some movies or shows to get
              started!
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default RecommendationsPage;
