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
  Link as MuiLink,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import HistoryIcon from "@mui/icons-material/History";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useTrackedShow } from "../hooks/useTrackedShow";
import { Link } from "react-router-dom";
import { useNotify } from "../components/NotificationsContext";

interface Props {
  entryId: number;
  showId: number;
  onViewHistory: (showId: number, showName: string) => void;
  paused?: boolean;
  onResume?: () => void;
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
  paused = false,
  onResume,
  onViewHistory,
  onRemoved,
  onMutate,
}: Props) {
  const notify = useNotify();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { show, loading, error, markWatched, undo, remove } = useTrackedShow(
    entryId,
    showId
  );

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

  const openMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleMarkWatched = async () => {
    try {
      await markWatched();
      onMutate({ entryId, season: nextSeason, episode: nextEpisode });
      notify({
        message: `Marked S${nextSeason}·E${nextEpisode} as watched`,
        severity: "success",
      });
    } catch (e) {
      notify({
        message: `Failed to mark watched: ${(e as Error).message}`,
        severity: "error",
      });
    }
  };

  const handleUndo = async () => {
    try {
      await undo();
      const prevSeason = lastSeason;
      const prevEpisode = lastEpisode;
      onMutate({ entryId, season: prevSeason, episode: prevEpisode });
      notify({
        message: `Reverted to S${prevSeason}·E${prevEpisode}`,
        severity: "info",
      });
    } catch (e) {
      notify({
        message: `Undo failed: ${(e as Error).message}`,
        severity: "error",
      });
    } finally {
      closeMenu();
    }
  };

  const handleRemove = async () => {
    try {
      await remove();
      onRemoved(entryId);
      notify({
        message: `"${showName}" removed from your list`,
        severity: "warning",
      });
    } catch (e) {
      notify({
        message: `Remove failed: ${(e as Error).message}`,
        severity: "error",
      });
    } finally {
      closeMenu();
    }
  };

  return (
    <Card
      sx={{
        bgcolor: "#1f1f1f",
        color: "#fff",
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <MuiLink component={Link} to={`/tv/${showId}`} underline="none">
        <Box
          sx={{
            height: 220,
            width: "100%",
            overflow: "hidden",
            position: "relative",
            bgcolor: "#000",
          }}
        >
          <CardMedia
            component="img"
            image={posterUrl}
            alt={showName}
            sx={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </Box>
      </MuiLink>

      <CardContent>
        <Typography variant="h6" noWrap>
          {showName}
        </Typography>
        {!paused && (
          <>
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
          </>
        )}
        {paused && (
          <Typography variant="caption" color="gray">
            Stopped at S{lastSeason}·E{lastEpisode}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1 }}>
        {!paused ? (
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
        ) : (
          <Button
            size="small"
            variant="contained"
            onClick={onResume}
            sx={{
              flexGrow: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Resume
          </Button>
        )}

        {!paused && (
          <>
            <IconButton color="inherit" onClick={openMenu}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
            >
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
              <MenuItem onClick={handleRemove} sx={{ color: "error.main" }}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Remove
              </MenuItem>
            </Menu>
          </>
        )}
      </CardActions>
    </Card>
  );
}
