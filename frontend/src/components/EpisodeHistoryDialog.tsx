// src/components/EpisodeHistoryDialog.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

interface HistoryRecord {
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: string;
}

interface EnrichedRecord extends HistoryRecord {
  name: string;
  totalEpisodesInSeason: number;
}

interface Props {
  open: boolean;
  showId: number;
  showName: string;
  onClose: () => void;
}

function EpisodeHistoryDialog({ open, showId, showName, onClose }: Props) {
  const [records, setRecords] = useState<EnrichedRecord[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      // 1) load raw history
      const { data: hist } = await axios.get<HistoryRecord[]>(
        `/api/history/show/${showId}`
      );

      // 2) for each history entry, fetch the season data
      const enriched = await Promise.all(
        hist.map(async (r) => {
          const { data: seasonData } = await axios.get<{
            episodes: { episode_number: number; name: string }[];
          }>(`/api/shows/${showId}/seasons/${r.seasonNumber}`);

          // find that episode to get its name
          const ep = seasonData.episodes.find(
            (e) => e.episode_number === r.episodeNumber
          );

          return {
            ...r,
            name: ep?.name ?? `Episode ${r.episodeNumber}`,
            totalEpisodesInSeason: seasonData.episodes.length,
          };
        })
      );

      setRecords(enriched);
    })();
  }, [open, showId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {showName} — Watched Episodes
        <IconButton
          sx={{ position: "absolute", right: 8, top: 8 }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {records.length === 0 ? (
          <Typography>No watched episodes yet.</Typography>
        ) : (
          <List dense>
            {records.map((r) => (
              <ListItem key={`${r.seasonNumber}-${r.episodeNumber}`}>
                <ListItemText
                  primary={`S${r.seasonNumber}·E${r.episodeNumber}: ${r.name}`}
                  secondary={`Watched ${new Date(r.watchedAt).toLocaleString()} • ${r.episodeNumber}/${r.totalEpisodesInSeason}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EpisodeHistoryDialog;
