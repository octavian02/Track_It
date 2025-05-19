// src/components/UserRatingsList.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import axios from "axios";

interface RawRating {
  mediaId: number;
  mediaName: string;
  mediaType: "movie" | "tv";
  score: number;
  dateAdded: string; // ISO string
  posterUrl?: string; // injected by backend
}

interface Props {
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

function UserRatingsList({ userId, username, displayName, avatarUrl }: Props) {
  const [ratings, setRatings] = useState<RawRating[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    axios
      .get<RawRating[]>("/api/ratings", { params: { userId } })
      .then((res) => {
        if (!mounted) return;
        // sort descending by date and take top 3
        const top3 = res.data
          .map((r) => ({
            ...r,
            dateAdded: new Date(r.dateAdded).toISOString(),
          }))
          .sort(
            (a, b) =>
              new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          )
          .slice(0, 3);
        setRatings(top3);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <Box textAlign="center" mt={2}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (ratings.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        my: 2,
        p: 2,
        border: "1px solid",
        borderRadius: 2,
        borderColor: "divider",
      }}
    >
      <Box display="flex" alignItems="center" mb={1}>
        <Avatar src={avatarUrl} sx={{ width: 32, height: 32, mr: 1 }} />
        <Typography variant="subtitle2">
          {displayName || username}’s latest ratings
        </Typography>
      </Box>
      <Grid container spacing={1}>
        {ratings.map((r) => (
          <Grid key={r.mediaId} item xs={4}>
            <Card sx={{ height: "100%" }}>
              <CardActionArea href={`/${r.mediaType}/${r.mediaId}`}>
                <Box
                  component="img"
                  src={r.posterUrl || "/default-movie-poster.png"}
                  alt={r.mediaName}
                  sx={{ width: "100%", height: 120, objectFit: "cover" }}
                />
                <CardContent sx={{ py: 1, px: 1 }}>
                  <Typography variant="caption" noWrap>
                    {r.mediaName}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <StarIcon
                      sx={{ fontSize: 14, mr: 0.3, color: "warning.main" }}
                    />
                    <Typography variant="caption">{r.score}/10</Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default UserRatingsList;
