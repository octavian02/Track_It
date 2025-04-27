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
  CardMedia,
  CardContent,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  useTheme,
  useMediaQuery,
  Fade,
  Skeleton,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNotify } from "../components/NotificationsContext";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import AvatarLoader from "../components/AvatarLoader";

// Interfaces
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
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const notify = useNotify();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isOwn = username === "me" || username === user?.username;

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs & media state
  const [tab, setTab] = useState(0);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    displayName: "",
    bio: "",
    avatarFile: null as File | null,
    avatarPreview: "",
  });
  const [saving, setSaving] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Fetch profile data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const profileUrl = isOwn
      ? "/api/user/me/profile"
      : `/api/user/${username}/profile`;

    axios
      .get<Profile>(profileUrl)
      .then((res) => mounted && setProfile(res.data))
      .catch(console.error)
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [username, isOwn]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    let url: string;

    axios
      .get(`/api/user/${profile.id}/avatar`, {
        responseType: "blob",
      })
      .then((res) => {
        if (!active) return;
        // create a browser‐readable URL for that blob
        url = URL.createObjectURL(res.data);
        setAvatarSrc(url);
      })
      .catch(console.error);

    return () => {
      active = false;
      // free the memory once unmounted
      if (url) URL.revokeObjectURL(url);
    };
  }, [profile]);

  useEffect(() => {
    if (!isOwn) return;

    let mounted = true;
    setTabLoading(true);

    const apiPath = tab === 0 ? "/api/watchlist" : "/api/ratings";
    axios
      .get<any[]>(apiPath)
      .then(async (res) => {
        if (!mounted) return;
        const enriched: MediaItem[] = await Promise.all(
          res.data.map(async (item: any) => {
            const userScore = item.score;
            const endpoint = item.mediaType === "movie" ? "movies" : "shows";
            const { data: details } = await axios.get<any>(
              `/api/${endpoint}/${item.mediaId}`
            );
            const posterPath = details.poster_path;
            const tmdbRating = details.vote_average;
            return {
              mediaId: item.mediaId,
              mediaName: item.mediaName,
              mediaType: item.mediaType,
              posterUrl: posterPath
                ? `https://image.tmdb.org/t/p/w300${posterPath}`
                : undefined,
              tmdbRating,
              userScore,
            };
          })
        );
        setMediaList(enriched);
      })
      .catch(console.error)
      .finally(() => mounted && setTabLoading(false));

    return () => {
      mounted = false;
    };
  }, [tab, isOwn]);

  // Handlers for edit dialog
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
    };
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
    setSaving(true);
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
    } catch (err) {
      console.error(err);
      notify({ message: "Failed to update profile", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* PROFILE HEADER */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
        flexDirection={isMobile ? "column" : "row"}
      >
        <Box display="flex" alignItems="center" mb={isMobile ? 2 : 0}>
          <AvatarLoader userId={profile.id} size={96} endpoint="/api/user" />
          <Box>
            <Typography variant="h4">{profile.displayName}</Typography>
            <Typography variant="subtitle2" color="text.secondary">
              @{profile.username}
            </Typography>
            {profile.bio && <Typography mt={1}>{profile.bio}</Typography>}
            <Box mt={2} display="flex" gap={4}>
              <Typography>
                <strong>{profile.followersCount}</strong> Followers
              </Typography>
              <Typography>
                <strong>{profile.followingCount}</strong> Following
              </Typography>
            </Box>
          </Box>
        </Box>
        {isOwn && (
          <Button variant="outlined" onClick={handleEditOpen}>
            Edit Profile
          </Button>
        )}
      </Box>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Button variant="outlined" component="label">
              Profile Image
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
                  height: 200,
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
          <Button onClick={handleEditClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TABS */}
      {isOwn && (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3 }}
        >
          <Tab label="Watchlist" />
          <Tab label="Ratings" />
        </Tabs>
      )}

      {/* MEDIA GRID */}
      {isOwn &&
        (tabLoading ? (
          <Grid container spacing={2}>
            {Array.from(new Array(12)).map((_, idx) => (
              <Grid key={idx} item xs={6} sm={4} md={3} lg={2}>
                <Card>
                  <Skeleton variant="rectangular" height={240} />
                  <CardContent>
                    <Skeleton width="80%" />
                    <Skeleton width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Fade in timeout={500} key={tab}>
            <Grid container spacing={2}>
              {mediaList.map((item) => (
                <Grid key={item.mediaId} item xs={6} sm={4} md={3} lg={2}>
                  <Card>
                    <CardActionArea
                      component={Link}
                      to={`/${item.mediaType}/${item.mediaId}`}
                    >
                      <CardMedia
                        component="img"
                        image={item.posterUrl || "/placeholder.png"}
                        alt={item.mediaName}
                        sx={{ height: 240, width: "100%", objectFit: "cover" }}
                      />
                      <CardContent>
                        <Typography variant="subtitle2" noWrap>
                          {item.mediaName}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          {item.tmdbRating != null && (
                            <Box display="flex" alignItems="center">
                              <StarIcon sx={{ color: "#FFD700", mr: 0.5 }} />
                              <Typography variant="body2">
                                {item.tmdbRating.toFixed(1)}
                              </Typography>
                            </Box>
                          )}
                          {item.userScore != null && (
                            <Box display="flex" alignItems="center" ml={2}>
                              <StarIcon sx={{ color: "#4caf50", mr: 0.5 }} />
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
        ))}
    </Container>
  );
}
