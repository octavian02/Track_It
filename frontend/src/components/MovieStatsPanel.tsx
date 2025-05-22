// src/components/MovieStatsPanel.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { Link } from "react-router-dom";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

interface RawHistory {
  mediaId: number;
  mediaName: string;
  lastWatchedAt: string; // ISO from your API
}

interface MovieHistory {
  mediaId: number;
  mediaName: string;
  posterUrl: string;
  watchedAt: Date;
}

export default function MovieStatsPanel({ userId }: { userId: number }) {
  const [movies, setMovies] = useState<MovieHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    setLoading(true);

    (async () => {
      try {
        // 1) Fetch the raw history
        const { data: raw } = await axios.get<RawHistory[]>(
          `/api/history/movie?userId=${userId}`
        );

        // 2) Enrich each with TMDB poster
        const enriched = await Promise.all(
          raw.map(async (h) => {
            let posterUrl = "/default-movie-poster.png";
            try {
              const { data: det } = await axios.get<any>(
                `/api/movies/${h.mediaId}`
              );
              if (det.poster_path) {
                posterUrl = TMDB_IMG + det.poster_path;
              }
            } catch {
              // leave fallback
            }
            return {
              mediaId: h.mediaId,
              mediaName: h.mediaName,
              posterUrl,
              watchedAt: new Date(h.lastWatchedAt),
            };
          })
        );

        // 3) Sort by date desc and keep the most recent 6
        enriched
          .sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime())
          .splice(6);

        if (!canceled) setMovies(enriched);
      } catch (err) {
        console.error("Failed to load movie history", err);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (movies.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">No movies watched yet.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recently Watched Movies
      </Typography>
      <Grid container spacing={2}>
        {movies.map((m) => (
          <Grid key={m.mediaId} item xs={6} sm={4} md={2}>
            <Card>
              <CardActionArea component={Link} to={`/movie/${m.mediaId}`}>
                <CardMedia
                  component="img"
                  height="180"
                  image={m.posterUrl}
                  alt={m.mediaName}
                />
                <CardContent>
                  <Tooltip title={m.mediaName}>
                    <Typography variant="subtitle2" noWrap>
                      {m.mediaName}
                    </Typography>
                  </Tooltip>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    Watched on {m.watchedAt.toLocaleDateString()}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
