// src/pages/TrackShowsPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";

interface TrackingEntry {
  id: number;
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  totalEpisodes?: number;
  nextAirDate: string | null;
  updatedAt: string;
}

interface TMDBShowDetail {
  poster_path: string | null;
}

interface DisplayShow extends TrackingEntry {
  posterUrl: string;
}

export default function TrackShowsPage() {
  const [tab, setTab] = useState<0 | 1>(0);
  const [shows, setShows] = useState<DisplayShow[]>([]);

  const load = async () => {
    // 1) fetch your tracking entries
    const { data: entries } = await axios.get<TrackingEntry[]>("/api/tracking");

    // 2) for each entry, fetch TMDB details and build posterUrl
    const detailed = await Promise.all(
      entries.map(async (e) => {
        let posterUrl = PortraitPlaceholder;
        try {
          const { data: tmdb } = await axios.get<TMDBShowDetail>(
            `/api/shows/${e.showId}`
          );
          if (tmdb.poster_path) {
            posterUrl = `https://image.tmdb.org/t/p/w300/${tmdb.poster_path}`;
          }
        } catch {
          // if it fails, we just keep the placeholder
        }
        return { ...e, posterUrl };
      })
    );

    setShows(detailed);
  };

  useEffect(() => {
    load();
  }, []);

  const bump = async (s: DisplayShow) => {
    await axios.patch(`/api/tracking/${s.id}`, {
      seasonNumber: s.seasonNumber,
      episodeNumber: s.episodeNumber + 1,
    });
    await load();
  };

  const remove = async (id: number) => {
    await axios.delete(`/api/tracking/${id}`);
    await load();
  };

  const inProgress = shows.filter((s) => s.episodeNumber > 0);
  const notStarted = shows.filter((s) => s.episodeNumber === 0);

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
        >
          <Tab label="Shows" />
          <Tab label="Movies" disabled />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          {inProgress.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                In Progress
              </Typography>
              <Grid container spacing={2}>
                {inProgress.map((s) => (
                  <Grid key={s.id} item xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ bgcolor: "#121212", color: "#fff" }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={s.posterUrl}
                        alt={s.showName}
                      />
                      <CardContent>
                        <Typography variant="subtitle1" noWrap>
                          {s.showName}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          S{s.seasonNumber} • E{s.episodeNumber}
                          {s.totalEpisodes ? ` of ${s.totalEpisodes}` : ""}
                        </Typography>
                        {s.totalEpisodes != null && (
                          <Typography variant="caption" sx={{ color: "gray" }}>
                            {s.totalEpisodes - s.episodeNumber} epi left
                          </Typography>
                        )}
                      </CardContent>
                      <Divider sx={{ bgcolor: "#333" }} />
                      <CardActions sx={{ justifyContent: "space-between" }}>
                        <Button
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={() => bump(s)}
                        >
                          Watched
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => remove(s.id)}
                        >
                          Remove
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {notStarted.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Haven’t Started
              </Typography>
              <Grid container spacing={2}>
                {notStarted.map((s) => (
                  <Grid key={s.id} item xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ bgcolor: "#121212", color: "#fff" }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={s.posterUrl}
                        alt={s.showName}
                      />
                      <CardContent>
                        <Typography variant="subtitle1" noWrap>
                          {s.showName}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Not yet started
                        </Typography>
                      </CardContent>
                      <Divider sx={{ bgcolor: "#333" }} />
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={() => bump(s)}
                        >
                          Start Ep 1
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
      {tab === 1 && (
        <Typography sx={{ mt: 4, color: "gray" }}>
          Movies tracking coming soon…
        </Typography>
      )}
    </Container>
  );
}
