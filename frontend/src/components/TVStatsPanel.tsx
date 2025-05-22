// src/components/StatsPanel.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Grid,
  Box,
  Paper,
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
} from "@mui/material";
import { Link } from "react-router-dom";
import { TrackingItem } from "../hooks/useTracking";

type StatType = "all" | "watching" | "paused" | "completed";

interface StatsPanelProps {
  trackedShows: TrackingItem[];
  detailsMap: {
    [showId: number]: {
      lastEp: { season_number: number; episode_number: number } | null;
    };
  };
}

interface ShowInfo {
  showId: number;
  name: string;
  posterUrl: string;
}

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

export default function StatsPanel({
  trackedShows,
  detailsMap,
}: StatsPanelProps) {
  const [selected, setSelected] = useState<StatType>("all");
  const [items, setItems] = useState<ShowInfo[]>([]);

  // compute counts
  const counts: Record<StatType, number> = {
    all: trackedShows.length,
    watching: trackedShows.filter((t) => {
      if (t.paused) return false;
      const last = detailsMap[t.showId]?.lastEp;
      if (!last) return true;
      return (
        t.seasonNumber < last.season_number ||
        (t.seasonNumber === last.season_number &&
          t.episodeNumber < last.episode_number)
      );
    }).length,
    paused: trackedShows.filter((t) => t.paused).length,
    completed: trackedShows.filter((t) => {
      const last = detailsMap[t.showId]?.lastEp;
      if (!last) return false;
      return (
        t.seasonNumber > last.season_number ||
        (t.seasonNumber === last.season_number &&
          t.episodeNumber >= last.episode_number)
      );
    }).length,
  };

  // filter logic
  function filterShows(type: StatType) {
    if (type === "all") return trackedShows;
    if (type === "paused") return trackedShows.filter((t) => t.paused);
    if (type === "watching")
      return trackedShows.filter((t) => {
        if (t.paused) return false;
        const last = detailsMap[t.showId]?.lastEp;
        if (!last) return true;
        return (
          t.seasonNumber < last.season_number ||
          (t.seasonNumber === last.season_number &&
            t.episodeNumber < last.episode_number)
        );
      });
    // completed
    return trackedShows.filter((t) => {
      const last = detailsMap[t.showId]?.lastEp;
      if (!last) return false;
      return (
        t.seasonNumber > last.season_number ||
        (t.seasonNumber === last.season_number &&
          t.episodeNumber >= last.episode_number)
      );
    });
  }

  // whenever selection changes, re-fetch show details
  useEffect(() => {
    const subset = filterShows(selected);
    if (subset.length === 0) {
      setItems([]);
      return;
    }
    let mounted = true;
    Promise.all(
      subset.map((entry) =>
        axios
          .get<{
            id: number;
            name: string;
            poster_path: string | null;
          }>(`/api/shows/${entry.showId}`)
          .then((res) => ({
            showId: entry.showId,
            name: res.data.name,
            posterUrl: res.data.poster_path
              ? TMDB_IMG + res.data.poster_path
              : "/default-show-poster.png",
          }))
      )
    )
      .then((arr) => {
        if (mounted) setItems(arr);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, [selected, trackedShows, detailsMap]);

  // panel definitions
  const panels: Array<[label: string, key: StatType]> = [
    ["All", "all"],
    ["Watching", "watching"],
    ["Paused", "paused"],
    ["Completed", "completed"],
  ];

  return (
    <Box>
      {/* top buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {panels.map(([label, key]) => (
          <Grid key={key} item xs={12} sm={6} md={3}>
            <Paper
              onClick={() => setSelected(key)}
              sx={{
                p: 2,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: selected === key ? "primary.main" : "background.paper",
                color: selected === key ? "#fff" : "text.primary",
                "&:hover": {
                  bgcolor: selected === key ? "primary.dark" : "grey.100",
                },
              }}
            >
              <Typography variant="overline">{label}</Typography>
              <Typography variant="h4">{counts[key]}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* show grid */}
      {items.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">
            No shows under “{selected}.”
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((show) => (
            <Grid key={show.showId} item xs={6} sm={4} md={3} lg={2}>
              <Card>
                <CardActionArea component={Link} to={`/tv/${show.showId}`}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={show.posterUrl}
                    alt={show.name}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" noWrap>
                      {show.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
