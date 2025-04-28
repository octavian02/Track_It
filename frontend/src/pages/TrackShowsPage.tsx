// src/pages/TrackShowsPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface TrackingItem {
  id: number;
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  nextAirDate: string | null;
}

export default function TrackShowsPage() {
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [editItem, setEditItem] = useState<TrackingItem | null>(null);
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);

  // load all tracked shows
  const load = async () => {
    const res = await axios.get<TrackingItem[]>("/api/tracking");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // open the edit dialog
  const openEdit = (item: TrackingItem) => {
    setEditItem(item);
    setSeason(item.seasonNumber);
    setEpisode(item.episodeNumber);
  };
  const closeEdit = () => setEditItem(null);

  // save season/episode changes
  const saveEdit = async () => {
    if (!editItem) return;
    await axios.patch(`/api/tracking/${editItem.id}`, {
      seasonNumber: season,
      episodeNumber: episode,
    });
    await load();
    closeEdit();
  };

  // delete a tracking entry
  const deleteItem = async (id: number) => {
    await axios.delete(`/api/tracking/${id}`);
    await load();
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Tracked Shows
      </Typography>

      <List>
        {items.map((item) => (
          <ListItem key={item.id} divider>
            <ListItemText
              primary={item.showName}
              secondary={
                `S${item.seasonNumber} · E${item.episodeNumber}` +
                (item.nextAirDate
                  ? ` • Next: ${new Date(
                      item.nextAirDate
                    ).toLocaleDateString()}`
                  : "")
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => openEdit(item)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => deleteItem(item.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Edit Progress Dialog */}
      <Dialog open={!!editItem} onClose={closeEdit}>
        <DialogTitle>Edit Progress</DialogTitle>
        <DialogContent>
          <TextField
            label="Season"
            type="number"
            fullWidth
            margin="dense"
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
          />
          <TextField
            label="Episode"
            type="number"
            fullWidth
            margin="dense"
            value={episode}
            onChange={(e) => setEpisode(Number(e.target.value))}
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
