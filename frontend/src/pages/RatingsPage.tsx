// src/pages/RatingsPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import ImageWithFallback from "../components/ImageWithFallback";
import { useAuth } from "../contexts/AuthContext";

interface RawRating {
  mediaId: number;
  mediaName: string;
  mediaType: "movie" | "tv";
  score: number;
  dateAdded: Date; // mapped from ratedAt
}

interface EnrichedRating extends RawRating {
  posterUrl?: string;
  tmdbRating?: number;
  dateAdded: Date;
}

export default function RatingsPage() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwn = !username || username === "me" || username === user?.username;
  const profilePath = isOwn ? "/user/me/profile" : `/user/${username}/profile`;

  const [items, setItems] = useState<EnrichedRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const url = isOwn
      ? "/api/ratings"
      : `/api/ratings?userId=${encodeURIComponent(username!)}`;

    axios
      .get<RawRating[]>(url)
      .then(async (res) => {
        if (!mounted) return;
        const enriched = await Promise.all(
          res.data.map(async (r) => {
            const kind = r.mediaType === "movie" ? "movies" : "shows";
            const { data } = await axios.get<any>(`/api/${kind}/${r.mediaId}`);
            return {
              ...r,
              posterUrl: data.poster_path
                ? `https://image.tmdb.org/t/p/w300${data.poster_path}`
                : undefined,
              tmdbRating: data.vote_average,
              dateAdded: new Date(r.dateAdded),
            };
          })
        );
        // newest-first
        enriched.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
        setItems(enriched);
      })
      .catch(console.error)
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [username, user, isOwn]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  const filtered = items.filter(
    (it) => filter === "all" || it.mediaType === filter
  );

  return (
    <Container sx={{ py: 4 }}>
      {/* Back to profile + Title */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton
          onClick={() => navigate(profilePath)}
          sx={{
            color: (theme) => theme.palette.text.primary,
            "&:hover": { backgroundColor: "transparent" },
          }}
          size="large"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            ml: 1,
            color: (theme) => theme.palette.text.primary,
            fontWeight: 600,
          }}
        >
          {isOwn ? "My Ratings" : `${username}'s Ratings`}
        </Typography>
      </Box>

      {/* Media-type filter */}
      <Box mb={2} display="flex" justifyContent="center">
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v)}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="movie">Movies</ToggleButton>
          <ToggleButton value="tv">TV Shows</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {filtered.length === 0 ? (
        <Typography color="text.secondary">
          {isOwn
            ? "You haven’t rated anything yet."
            : "This user hasn’t rated anything yet."}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((it) => (
            <Grid key={it.mediaId} item xs={6} sm={4} md={3} lg={2}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.03)" },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={`/${it.mediaType}/${it.mediaId}`}
                >
                  <ImageWithFallback
                    src={it.posterUrl || "/default-movie-poster.png"}
                    fallbackSrc="/default-movie-poster.png"
                    style={{
                      width: "100%",
                      height: 240,
                      objectFit: "cover",
                    }}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" noWrap>
                      {it.mediaName}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {it.tmdbRating != null && (
                        <Box display="flex" alignItems="center">
                          <Tooltip title="TMDB rating">
                            <StarIcon sx={{ color: "#FFD700", mr: 0.5 }} />
                          </Tooltip>
                          <Typography variant="body2">
                            {it.tmdbRating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                      {it.score != null && (
                        <Box display="flex" alignItems="center" ml={2}>
                          <Tooltip title="User Rating">
                            <StarIcon sx={{ color: "#4caf50", mr: 0.5 }} />
                          </Tooltip>
                          <Typography variant="body2">{it.score}</Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      Rated on {it.dateAdded.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
