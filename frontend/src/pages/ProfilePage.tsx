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
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNotify } from "../components/NotificationsContext";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import ImageWithFallback from "../components/ImageWithFallback";
import { useAvatar } from "../hooks/useAvatar";

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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
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
  const { url: avatarUrl, loading: avatarLoading } = useAvatar(user?.id);

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

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
                : "/default-movie-poster.png",
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
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          flexDirection: isMobile ? "column" : "row",
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
          <Typography variant="h4" component="h1">
            {profile.displayName}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            @{profile.username}
          </Typography>
          {profile.bio && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
              "{profile.bio}"
            </Typography>
          )}
          <Box
            mt={2}
            display="flex"
            justifyContent={isMobile ? "center" : "flex-start"}
            gap={4}
          >
            <Typography>
              <strong>{profile.followersCount}</strong> Followers
            </Typography>
            <Typography>
              <strong>{profile.followingCount}</strong> Following
            </Typography>
          </Box>
        </Box>
        {isOwn && (
          <Button
            variant="outlined" // was "contained"
            onClick={handleEditOpen}
            sx={{
              color: theme.palette.text.primary, // ensures dark text
              borderColor: theme.palette.text.primary, // dark border
              backgroundColor: theme.palette.background.default, // light BG
              "&:hover": {
                backgroundColor: theme.palette.action.hover, // subtle gray on hover
              },
              alignSelf: isMobile ? "center" : "flex-start",
            }}
          >
            Edit Profile
          </Button>
        )}
      </Paper>

      {/* EDIT DIALOG */}
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
          <Button onClick={handleEditClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TABS & MEDIA GRID */}
      {isOwn && (
        <>
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

          {tabLoading ? (
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
                          className="movie-poster"
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
                                  <StarIcon
                                    sx={{ color: "#FFD700", mr: 0.5 }}
                                  />
                                </Tooltip>
                                <Typography variant="body2">
                                  {item.tmdbRating.toFixed(1)}
                                </Typography>
                              </Box>
                            )}
                            {item.userScore != null && (
                              <Box display="flex" alignItems="center" ml={2}>
                                <Tooltip title="User Rating">
                                  <StarIcon
                                    sx={{ color: "#4caf50", mr: 0.5 }}
                                  />
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
          )}
        </>
      )}
    </Container>
  );
}
