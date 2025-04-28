// src/pages/TrackShowsPage.tsx
import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tabs,
  Tab,
  Container,
} from "@mui/material";
import axios from "axios";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

interface TrackedShow {
  showId: number;
  title: string;
  poster_path: string;
  progress: { season: number; episode: number; totalEpisodes?: number };
  nextAir: string | null;
}

export default function TrackShowsPage() {
  const [shows, setShows] = useState<TrackedShow[]>([]);
  const [edit, setEdit] = useState<TrackedShow | null>(null);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  useEffect(() => {
    axios.get<TrackedShow[]>("/api/tracking").then((r) => setShows(r.data));
  }, []);

  const openEdit = (s: TrackedShow) => {
    setEdit(s);
    setSeason(s.progress.season);
    setEpisode(s.progress.episode);
  };
  const closeEdit = () => setEdit(null);

  const saveEdit = async () => {
    if (!edit) return;
    await axios.patch(
      `/api/tracking/${edit.showId}`, // ← here
      { season, episode }
    );
    const r = await axios.get<TrackedShow[]>("/api/tracking");
    setShows(r.data);
    closeEdit();
  };

  const removeShow = async (id: number) => {
    await axios.delete(`/api/tracking/${id}`); // ← here
    setShows(shows.filter((s) => s.showId !== id));
  };

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={0}>
          <Tab label="Shows" />
          <Tab label="Movies" disabled />
        </Tabs>
      </Box>

      <Grid container spacing={2}>
        {shows.map((s) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={s.showId}>
            <Card sx={{ position: "relative" }}>
              <CardMedia
                component="img"
                height="200"
                image={`https://image.tmdb.org/t/p/w300${s.poster_path}`}
                alt={s.title}
              />

              <CardContent>
                <Typography variant="h6" noWrap>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  S{s.progress.season}:E{s.progress.episode}
                  {s.progress.totalEpisodes
                    ? ` of ${s.progress.totalEpisodes}`
                    : ""}
                </Typography>
                {s.nextAir && (
                  <Typography variant="caption" color="primary">
                    Next: {new Date(s.nextAir).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", p: 1 }}
              >
                <Button size="small" onClick={() => openEdit(s)}>
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeShow(s.showId)}
                >
                  Remove
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={!!edit} onClose={closeEdit}>
        <DialogTitle>Edit Progress</DialogTitle>
        <DialogContent>
          <TextField
            label="Season"
            type="number"
            fullWidth
            margin="dense"
            value={season}
            onChange={(e) => setSeason(+e.target.value)}
          />
          <TextField
            label="Episode"
            type="number"
            fullWidth
            margin="dense"
            value={episode}
            onChange={(e) => setEpisode(+e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
