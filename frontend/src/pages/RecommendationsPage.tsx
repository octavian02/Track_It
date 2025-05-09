// src/pages/RecommendationsPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress } from "@mui/material";
import ShowCarousel from "../components/ShowCarousel";
import MovieCarousel from "../components/MovieCarousel";

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
  const [tvRecs, setTvRecs] = useState<TMDBShow[]>([]);
  const [movieRecs, setMovieRecs] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tvPromise = axios
      .get<TMDBShow[]>("/api/recommendations", {
        params: { type: "tv", count: 10 },
      })
      .then((res) =>
        setTvRecs(
          res.data.map((item) => ({
            ...item,
            name: item.name,
          }))
        )
      )
      .catch((err) => console.error("TV recs failed", err));

    // Fetch Movie recommendations
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
      <Box textAlign="center" sx={{ mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        Recommended for You
      </Typography>

      {tvRecs.length > 0 && (
        <ShowCarousel title="TV Shows You Might Like" shows={tvRecs} />
      )}

      {movieRecs.length > 0 && (
        <MovieCarousel title="Movies You Might Like" movies={movieRecs} />
      )}

      {tvRecs.length === 0 && movieRecs.length === 0 && (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="subtitle1" color="text.secondary">
            No recommendations found yet.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecommendationsPage;
