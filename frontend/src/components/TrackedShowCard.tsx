import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Chip,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import HistoryIcon from "@mui/icons-material/History";
import PauseIcon from "@mui/icons-material/Pause";
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
  onPause: (entryId: number) => void;
  onMutate: (updated: {
    entryId: number;
    season: number;
    episode: number;
  }) => void;
  isNewest?: boolean;
}

export default function TrackedShowCard({
  entryId,
  showId,
  paused = false,
  onResume,
  onViewHistory,
  onPause,
  onMutate,
  isNewest = false,
}: Props) {
  const notify = useNotify();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { show, loading, error, markWatched, undo } = useTrackedShow(
    entryId,
    showId
  );

  useEffect(() => {
    // if the entry disappears (e.g. 404), treat as “paused/removed”
    if (!loading && show === null) {
      onPause(entryId);
    }
  }, [loading, show, entryId, onPause]);

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

  if (!show) return null;

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
      onMutate({ entryId, season: lastSeason, episode: lastEpisode });
      notify({
        message: `Reverted to S${lastSeason}·E${lastEpisode}`,
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

  const handlePause = async () => {
    try {
      await axios.patch(`/api/tracking/${entryId}`, { paused: true });
      onPause(entryId);
      notify({ message: `"${showName}" paused`, severity: "info" });
    } catch (e) {
      notify({
        message: `Pause failed: ${(e as Error).message}`,
        severity: "error",
      });
    } finally {
      closeMenu();
    }
  };

  return (
    <Card
      sx={{
        position: "relative",
        bgcolor: "#1f1f1f",
        color: "#fff",
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      {episodesLeft === 1 && (
        <Chip
          label="Newest"
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "#1976d2",
            color: "#fff",
            zIndex: 1,
          }}
        />
      )}

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
        {!paused ? (
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
            {episodesLeft > 1 ? (
              <Typography variant="caption" color="gray">
                {episodesLeft} episodes available
              </Typography>
            ) : (
              <Typography variant="caption" color="success.main">
                Last episode to air and watch
              </Typography>
            )}
          </>
        ) : (
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
              <MenuItem onClick={handlePause}>
                <PauseIcon fontSize="small" sx={{ mr: 1 }} /> Pause
              </MenuItem>
            </Menu>
          </>
        )}
      </CardActions>
    </Card>
  );
}
