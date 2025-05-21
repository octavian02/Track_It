// src/pages/WatchlistPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  CircularProgress,
  Box,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
} from "@mui/material";
import {
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

interface RawItem {
  mediaId: number;
  mediaName: string;
  mediaType: "movie" | "tv";
  dateAdded: Date; // backend now returns this as ISO
}

interface EnrichedItem extends RawItem {
  posterUrl?: string;
  tmdbRating?: number;
  dateAdded: Date; // parsed
}

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { user } = useAuth();
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");
  const isOwn =
    !paramUsername ||
    paramUsername === "me" ||
    paramUsername === user?.username;
  const profilePath = isOwn
    ? "/user/me/profile"
    : `/user/${paramUsername}/profile`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        // 1) Figure out whose ID to use
        const profileUrl = isOwn
          ? "/api/user/me/profile"
          : `/api/user/${paramUsername}/profile`;
        const { data: prof } = await axios.get<{
          id: number;
          displayName: string;
        }>(profileUrl);
        const userId = prof.id;

        // 2) Fetch their watchlist
        const { data: raw } = await axios.get<RawItem[]>(
          `/api/watchlist?userId=${userId}`
        );

        // 3) Enrich each item
        const enriched = await Promise.all(
          raw.map(async (it) => {
            const kind = it.mediaType === "movie" ? "movies" : "shows";
            const { data } = await axios.get<any>(`/api/${kind}/${it.mediaId}`);
            return {
              ...it,
              posterUrl: data.poster_path
                ? `https://image.tmdb.org/t/p/w300${data.poster_path}`
                : undefined,
              tmdbRating: data.vote_average,
              dateAdded: new Date(it.dateAdded),
            };
          })
        );

        // 4) Sort & set
        enriched.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
        if (mounted) setItems(enriched);
      } catch (err) {
        console.error("Failed to load watchlist", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [paramUsername, isOwn]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  // apply media-type filter
  const filtered = items.filter(
    (it) => filter === "all" || it.mediaType === filter
  );

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
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
          My Watchlist
        </Typography>
      </Box>
      {/* Media‐type filter */}
      <Box mb={3} display="flex" justifyContent="center">
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
          Your watchlist is empty. Start adding titles you want to watch!
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((item) => (
            <Grid key={item.mediaId} item xs={6} sm={4} md={3} lg={2}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.03)" },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={`/${item.mediaType}/${item.mediaId}`}
                >
                  {item.posterUrl && (
                    <CardMedia
                      component="img"
                      height="240"
                      image={item.posterUrl}
                      alt={item.mediaName}
                    />
                  )}
                  <CardContent>
                    <Typography variant="subtitle2" noWrap>
                      {item.mediaName}
                    </Typography>
                    {item.tmdbRating != null && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <Tooltip title="TMDB rating">
                          <StarIcon sx={{ color: "#FFD700", mr: 0.5 }} />
                        </Tooltip>
                        <Typography variant="body2">
                          {item.tmdbRating.toFixed(1)}
                        </Typography>
                      </Box>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      Added on {item.dateAdded.toLocaleDateString()}
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
