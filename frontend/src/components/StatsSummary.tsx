// src/components/StatsSummary.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import TvIcon from "@mui/icons-material/Tv";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import MovieIcon from "@mui/icons-material/Movie";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";

interface StatsSummaryProps {
  userId?: number;
}

// turn minutes into [ { count, unit }, ... ]
function formatMinutes(totalMinutes: number) {
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const totalDays = Math.floor(totalHours / 24);
  const days = totalDays % 30;
  const months = Math.floor(totalDays / 30);
  return [
    { count: months, unit: "MONTHS" },
    { count: days, unit: "DAYS" },
    { count: hours, unit: "HOURS" },
  ].filter((x) => x.count > 0);
}

export default function StatsSummary({ userId }: StatsSummaryProps) {
  const theme = useTheme();
  const [summary, setSummary] = useState<null | {
    tvTime: number;
    episodesWatched: number;
    movieTime: number;
    moviesWatched: number;
  }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = userId
      ? `/api/history/summary?userId=${userId}`
      : "/api/history/summary";
    axios
      .get<{
        tvTime: number;
        episodesWatched: number;
        movieTime: number;
        moviesWatched: number;
      }>(url)
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }
  if (!summary) return null;

  const tvParts = formatMinutes(summary.tvTime);
  const movieParts = formatMinutes(summary.movieTime);

  const cards = [
    {
      label: "TV time",
      icon: <TvIcon fontSize="small" />,
      parts: tvParts,
      isCount: false,
    },
    {
      label: "Episodes watched",
      icon: <OndemandVideoIcon fontSize="small" />,
      count: summary.episodesWatched,
      isCount: true,
    },
    {
      label: "Movie time",
      icon: <MovieIcon fontSize="small" />,
      parts: movieParts,
      isCount: false,
    },
    {
      label: "Movies watched",
      icon: <CollectionsBookmarkIcon fontSize="small" />,
      count: summary.moviesWatched,
      isCount: true,
    },
  ];

  return (
    <Box mb={4}>
      <Typography variant="h6" color="text.primary" gutterBottom>
        Stats
      </Typography>
      <Grid container spacing={2} alignItems="stretch">
        {cards.map(({ label, icon, parts, count, isCount }: any) => (
          <Grid item xs={12} sm={6} md={3} key={label} sx={{ display: "flex" }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                textAlign: "center",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={1}
              >
                {icon}
                <Typography variant="subtitle2" sx={{ ml: 0.5 }}>
                  {label}
                </Typography>
              </Box>

              {isCount ? (
                <Typography variant="h4">{count}</Typography>
              ) : parts.length > 0 ? (
                <Box display="flex" justifyContent="space-around">
                  {parts.map((p: any) => (
                    <Box key={p.unit}>
                      <Typography variant="h6">{p.count}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.unit}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                // fallback if zero
                <Typography variant="h6">0 HOURS</Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
