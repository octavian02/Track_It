// src/components/TrackedShowCard.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  CircularProgress,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import HistoryIcon from "@mui/icons-material/History";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useTrackedShow } from "../hooks/useTrackedShow";

interface Props {
  entryId: number;
  showId: number;
  onViewHistory: (showId: number, showName: string) => void;
  onRemoved: (entryId: number) => void;
  onMutate: (updated: {
    entryId: number;
    season: number;
    episode: number;
  }) => void;
}

export default function TrackedShowCard({
  entryId,
  showId,
  onViewHistory,
  onRemoved,
  onMutate,
}: Props) {
  // 1) Hooks at the top
  const { show, loading, error, markWatched, undo, remove } = useTrackedShow(
    entryId,
    showId
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!loading && show === null) {
      onRemoved(entryId);
    }
  }, [loading, show, entryId, onRemoved]);

  if (loading) {
    return (
      <Card
        sx={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="inherit" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Card>
    );
  }

  if (!show) {
    return null;
  }

  // 4) Destructure once we know `show` is non-null
  const {
    showName,
    posterUrl,
    nextSeason,
    nextEpisode,
    nextEpisodeName,
    lastEpisode,
    lastSeason,
    episodesLeft,
  } = show;

  // Menu handlers
  const openMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleMarkWatched = async () => {
    await markWatched();
    onMutate({ entryId, season: show.nextSeason, episode: show.nextEpisode });
  };

  const handleUndo = async () => {
    await undo();
    const prevSeason = lastSeason;
    const prevEpisode = lastEpisode;
    await undo();
    // now notify parent which values to revert to
    onMutate({ entryId, season: prevSeason, episode: prevEpisode });
    closeMenu();
  };

  return (
    <Card
      sx={{ bgcolor: "#1f1f1f", color: "#fff", borderRadius: 2, boxShadow: 2 }}
    >
      <CardMedia
        component="img"
        height="220"
        image={posterUrl}
        alt={showName}
      />

      <CardContent>
        <Typography variant="h6" noWrap>
          {showName}
        </Typography>
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="body2">
            Next Up:{" "}
            <strong>
              S{nextSeason}·E{nextEpisode}
            </strong>
          </Typography>
          <Typography variant="caption" color="gray">
            “{nextEpisodeName || "TBA"}”
          </Typography>
        </Box>
        <Typography variant="caption" color="gray">
          {episodesLeft} left in series
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={handleMarkWatched}
          sx={{
            flexGrow: 1,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          {`Mark S${nextSeason}·E${nextEpisode} Watched`}
        </Button>

        <IconButton color="inherit" onClick={openMenu}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
          {lastEpisode > 0 && (
            <MenuItem onClick={handleUndo}>
              <UndoIcon fontSize="small" sx={{ mr: 1 }} /> Undo
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              onViewHistory(showId, showName);
              closeMenu();
            }}
          >
            <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> History
          </MenuItem>
          <MenuItem
            onClick={() => {
              remove();
              closeMenu();
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Remove
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
}
