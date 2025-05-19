// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Avatar,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Skeleton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNotify } from "../components/NotificationsContext";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import ImageWithFallback from "../components/ImageWithFallback";
import { useAvatar } from "../hooks/useAvatar";
import FollowListDialog from "../components/FollowListDialog";
import StatsPanel from "../components/StatsPanel";
import { TrackingItem } from "../hooks/useTracking";
import StatsSummary from "../components/StatsSummary";

interface Profile {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}
interface MediaItem {
  mediaId: number;
  mediaName: string;
  mediaType: "movie" | "tv";
  posterUrl?: string;
  tmdbRating?: number;
  userScore?: number;
  dateAdded: Date;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const notify = useNotify();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isOwn = username === "me" || username === user?.username;

  const PREVIEW_COUNT = 6;

  // — PROFILE & EDIT STATE —
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    displayName: "",
    bio: "",
    avatarFile: null as File | null,
    avatarPreview: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const { url: avatarUrl, loading: avatarLoading } = useAvatar(profile?.id);

  // — FOLLOWERS / FOLLOWING STATE —
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // — TABS STATE —
  const [tab, setTab] = useState<0 | 1 | 2>(0);

  // — WATCHLIST / RATINGS STATE —
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "tv">("all");

  // — TRACKED SHOWS & DETAILS FOR STATS —
  const [trackedShows, setTrackedShows] = useState<TrackingItem[]>([]);
  const [detailsMap, setDetailsMap] = useState<{
    [showId: number]: {
      lastEp: { season_number: number; episode_number: number } | null;
    };
  }>({});

  // Crop completion
  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // — Load Profile —
  useEffect(() => {
    let mounted = true;
    setLoadingProfile(true);
    const url = isOwn
      ? "/api/user/me/profile"
      : `/api/user/${username}/profile`;
    axios
      .get<Profile>(url)
      .then((res) => {
        if (mounted) setProfile(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoadingProfile(false);
      });
    return () => {
      mounted = false;
    };
  }, [username, isOwn]);

  // — Load Watchlist or Ratings on Tab Change —
  useEffect(() => {
    if (!profile || tab === 2) return;
    let mounted = true;
    setLoadingTab(true);
    const base = tab === 0 ? "watchlist" : "ratings";
    axios
      .get<any[]>(`/api/${base}?userId=${profile.id}`)
      .then(async (res) => {
        if (!mounted) return;
        const enriched = await Promise.all(
          res.data.map(async (item) => {
            const kind = item.mediaType === "movie" ? "movies" : "shows";
            const { data: details } = await axios.get<any>(
              `/api/${kind}/${item.mediaId}`
            );
            return {
              mediaId: item.mediaId,
              mediaName: item.mediaName,
              mediaType: item.mediaType,
              posterUrl: details.poster_path
                ? `https://image.tmdb.org/t/p/w300${details.poster_path}`
                : "/default-movie-poster.png",
              tmdbRating: details.vote_average,
              userScore: item.score,
              dateAdded: new Date(item.dateAdded),
            };
          })
        );
        setMediaList(enriched);
      })
      .catch(console.error)
      .finally(() => mounted && setLoadingTab(false));
    return () => {
      mounted = false;
    };
  }, [tab, profile]);

  // — Load Tracked Shows & Last-Ep Info for Stats —
  useEffect(() => {
    if (!profile) return;
    let mounted = true;
    (async () => {
      try {
        const { data: tracked } = await axios.get<TrackingItem[]>(
          `/api/tracking?userId=${profile.id}`
        );
        if (!mounted) return;
        setTrackedShows(tracked);

        const detailsArr = await Promise.all(
          tracked.map((e) =>
            axios.get<{
              id: number;
              last_episode_to_air: {
                season_number: number;
                episode_number: number;
              } | null;
            }>(`/api/shows/${e.showId}`)
          )
        );
        if (!mounted) return;
        const map: typeof detailsMap = {};
        detailsArr.forEach((r) => {
          map[r.data.id] = { lastEp: r.data.last_episode_to_air };
        });
        setDetailsMap(map);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [profile]);

  // — Handlers: Edit Profile —
  const handleEditOpen = () => {
    if (!profile) return;
    setFormValues({
      displayName: profile.displayName,
      bio: profile.bio || "",
      avatarFile: null,
      avatarPreview: profile.avatarUrl || "",
    });
    setEditOpen(true);
  };

  const handleEditClose = () => setEditOpen(false);
  const handleFormChange =
    (field: "displayName" | "bio") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormValues((prev) => ({
        ...prev,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("displayName", formValues.displayName);
      formData.append("bio", formValues.bio);
      if (formValues.avatarFile) {
        const blob = croppedAreaPixels
          ? await getCroppedImg(formValues.avatarPreview, croppedAreaPixels)
          : formValues.avatarFile;
        formData.append("avatar", blob, formValues.avatarFile.name);
      }
      const res = await axios.patch<Profile>("/api/user/me/profile", formData);
      setProfile(res.data);
      notify({ message: "Profile updated", severity: "success" });
      setEditOpen(false);
    } catch {
      notify({ message: "Failed to update profile", severity: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  // — Handlers: Follow / Unfollow —
  const loadFollowers = useCallback(async () => {
    if (!profile) return;
    setLoadingFollowers(true);
    try {
      const { data } = await axios.get<Profile[]>(
        `/api/user/${profile.id}/followers`
      );
      setFollowers(data);
    } catch {
      notify({ message: "Could not load followers", severity: "error" });
    } finally {
      setLoadingFollowers(false);
    }
  }, [profile, notify]);

  const loadFollowing = useCallback(async () => {
    if (!profile) return;
    setLoadingFollowing(true);
    try {
      const { data } = await axios.get<Profile[]>(
        `/api/user/${profile.id}/following`
      );
      setFollowing(data);
    } catch {
      notify({ message: "Could not load following", severity: "error" });
    } finally {
      setLoadingFollowing(false);
    }
  }, [profile, notify]);

  const handleFollowToggle = useCallback(async () => {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await axios.delete(`/api/user/${profile.id}/follow`);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: profile.followersCount - 1,
        });
        notify({ message: "Unfollowed", severity: "info" });
      } else {
        await axios.post(`/api/user/${profile.id}/follow`);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: profile.followersCount + 1,
        });
        notify({ message: "Now following", severity: "success" });
      }
    } catch {
      notify({ message: "Could not update follow status", severity: "error" });
    }
  }, [profile, notify]);

  if (loadingProfile || !profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Prepare watchlist/ratings preview
  const sorted = [...mediaList].sort(
    (a, b) => b.dateAdded.getTime() - a.dateAdded.getTime()
  );
  const filtered = sorted.filter(
    (m) => typeFilter === "all" || m.mediaType === typeFilter
  );
  const preview = filtered.slice(0, PREVIEW_COUNT);

  return (
    <Container sx={{ py: 4 }}>
      {/* PROFILE HEADER */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          gap: 2,
        }}
      >
        {avatarLoading ? (
          <Skeleton variant="circular" width={120} height={120} />
        ) : (
          <Avatar
            src={avatarUrl || undefined}
            alt={profile.displayName}
            sx={{
              width: 120,
              height: 120,
              boxShadow: 3,
              border: "4px solid white",
            }}
          >
            {profile.displayName.charAt(0)}
          </Avatar>
        )}
        <Box flexGrow={1} textAlign={isMobile ? "center" : "left"}>
          <Typography variant="h4">{profile.displayName}</Typography>
          <Typography color="text.secondary">@{profile.username}</Typography>
          {profile.bio && (
            <Typography sx={{ mt: 1, fontStyle: "italic" }}>
              "{profile.bio}"
            </Typography>
          )}
          <Box
            mt={2}
            display="flex"
            gap={4}
            justifyContent={isMobile ? "center" : "flex-start"}
          >
            <Typography
              sx={{ cursor: "pointer" }}
              onClick={() => {
                setFollowersOpen(true);
                loadFollowers();
              }}
            >
              <strong>{profile.followersCount}</strong> Followers
            </Typography>
            <Typography
              sx={{ cursor: "pointer" }}
              onClick={() => {
                setFollowingOpen(true);
                loadFollowing();
              }}
            >
              <strong>{profile.followingCount}</strong> Following
            </Typography>
          </Box>
        </Box>
        {isOwn ? (
          <Button
            variant="outlined"
            onClick={handleEditOpen}
            sx={{
              color: theme.palette.text.primary,
              borderColor: theme.palette.text.primary,
              backgroundColor: theme.palette.background.default,
              "&:hover": { backgroundColor: theme.palette.action.hover },
              alignSelf: isMobile ? "center" : "flex-start",
            }}
          >
            Edit Profile
          </Button>
        ) : (
          <Button variant="contained" onClick={handleFollowToggle}>
            {profile.isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </Paper>
      <StatsSummary />
      {/* EDIT PROFILE DIALOG */}
      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Button variant="outlined" component="label">
              Change Avatar
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {formValues.avatarPreview && (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: 240,
                  bgcolor: "#333",
                }}
              >
                <Cropper
                  image={formValues.avatarPreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
                <Box
                  sx={{ position: "absolute", bottom: 8, left: 8, right: 8 }}
                >
                  <Slider
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(_, v) => setZoom(v as number)}
                  />
                </Box>
              </Box>
            )}
            <TextField
              label="Display Name"
              value={formValues.displayName}
              onChange={handleFormChange("displayName")}
              fullWidth
            />
            <TextField
              label="Bio"
              value={formValues.bio}
              onChange={handleFormChange("bio")}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={savingProfile}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={savingProfile}
            variant="contained"
          >
            {savingProfile ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MAIN TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Watchlist" />
        <Tab label="Ratings" />
        {isOwn && <Tab label="Stats" />}
      </Tabs>

      {/* WATCHLIST & RATINGS */}
      {loadingTab && (
        <Box textAlign="center">
          <CircularProgress />
        </Box>
      )}
      {!loadingTab && tab < 2 && mediaList.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary">
            {tab === 0
              ? isOwn
                ? "Your watchlist is empty"
                : "This user's watchlist is empty"
              : isOwn
                ? "You haven't rated anything yet"
                : "This user hasn't rated anything yet"}
          </Typography>
        </Box>
      )}
      {!loadingTab && tab < 2 && mediaList.length > 0 && (
        <>
          <Box mb={2} display="flex" justifyContent="center">
            <ToggleButtonGroup
              value={typeFilter}
              exclusive
              onChange={(_, v) => v && setTypeFilter(v)}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="movie">Movies</ToggleButton>
              <ToggleButton value="tv">TV Shows</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Fade in>
            <Grid container spacing={2}>
              {preview.map((item) => (
                <Grid key={item.mediaId} item xs={6} sm={4} md={3} lg={2}>
                  <Card
                    sx={{
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.05)" },
                    }}
                  >
                    <CardActionArea
                      component={Link}
                      to={`/${item.mediaType}/${item.mediaId}`}
                    >
                      <ImageWithFallback
                        src={item.posterUrl || "/default-movie-poster.png"}
                        fallbackSrc="/default-movie-poster.png"
                        style={{
                          height: 240,
                          objectFit: "cover",
                          width: "100%",
                        }}
                      />
                      <CardContent>
                        <Typography variant="subtitle2" noWrap>
                          {item.mediaName}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          {item.tmdbRating != null && (
                            <Box display="flex" alignItems="center">
                              <Tooltip title="TMDB rating">
                                <StarIcon sx={{ color: "#FFD700", mr: 0.5 }} />
                              </Tooltip>
                              <Typography variant="body2">
                                {item.tmdbRating.toFixed(1)}
                              </Typography>
                            </Box>
                          )}
                          {item.userScore != null && (
                            <Box display="flex" alignItems="center" ml={2}>
                              <Tooltip title="Your rating">
                                <StarIcon sx={{ color: "#4caf50", mr: 0.5 }} />
                              </Tooltip>
                              <Typography variant="body2">
                                {item.userScore}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Fade>
          {mediaList.length > PREVIEW_COUNT && (
            <Box textAlign="center" mt={3}>
              <Button
                component={Link}
                variant="outlined"
                to={
                  tab === 0
                    ? isOwn
                      ? "/watchlist"
                      : `/user/${profile.username}/watchlist`
                    : isOwn
                      ? "/ratings"
                      : `/user/${profile.username}/ratings`
                }
              >
                See all {tab === 0 ? "watchlist" : "ratings"}
              </Button>
            </Box>
          )}
        </>
      )}

      {/* STATS */}
      {tab === 2 && (
        <StatsPanel trackedShows={trackedShows} detailsMap={detailsMap} />
      )}
      {/* FOLLOWERS / FOLLOWING DIALOGS */}
      <FollowListDialog
        open={followersOpen}
        title="Followers"
        loading={loadingFollowers}
        users={followers}
        onClose={() => setFollowersOpen(false)}
      />
      <FollowListDialog
        open={followingOpen}
        title="Following"
        loading={loadingFollowing}
        users={following}
        onClose={() => setFollowingOpen(false)}
      />
    </Container>
  );
}
