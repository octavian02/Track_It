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
  List,
  ListItemButton,
  ListItemText,
  Rating,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNotify } from "../components/NotificationsContext";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";

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

interface WatchlistItem {
  mediaId: number;
  mediaName: string;
  mediaType: "movie" | "tv";
}

interface RatingItem {
  mediaId: number;
  mediaName: string;
  mediaType: "movie" | "tv";
  score: number;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const notify = useNotify();

  const isOwn = username === "me" || username === user?.username;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const url = isOwn
      ? "/api/user/me/profile"
      : `/api/user/${username}/profile`;

    axios
      .get<Profile>(url)
      .then((res) => {
        if (mounted) setProfile(res.data);
      })
      .catch(console.error)
      .finally(() => mounted && setLoading(false));

    if (isOwn) {
      axios
        .get<WatchlistItem[]>("/api/watchlist")
        .then((res) => mounted && setWatchlist(res.data))
        .catch(console.error);
      axios
        .get<RatingItem[]>("/api/ratings")
        .then((res) => mounted && setRatings(res.data))
        .catch(console.error);
    }

    return () => {
      mounted = false;
    };
  }, [username, isOwn]);

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

  const handleEditClose = () => {
    setEditOpen(false);
  };

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
      let finalAvatarBlob: Blob | null = null;
      if (formValues.avatarFile && croppedAreaPixels) {
        finalAvatarBlob = await getCroppedImg(
          formValues.avatarPreview,
          croppedAreaPixels
        );
      }
      const formData = new FormData();
      formData.append("displayName", formValues.displayName);
      formData.append("bio", formValues.bio);
      if (finalAvatarBlob) {
        formData.append("avatar", finalAvatarBlob, "avatar.jpg");
      }
      const res = await axios.patch<Profile>("/api/user/me/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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

  const initial = (profile.displayName || profile.username)[0];

  return (
    <Container sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar src={profile.avatarUrl} sx={{ width: 80, height: 80, mr: 2 }}>
            {initial}
          </Avatar>
          <Box>
            <Typography variant="h4">{profile.displayName}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              @{profile.username}
            </Typography>
            {profile.bio && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {profile.bio}
              </Typography>
            )}
            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
              <Typography variant="body2">
                {profile.followersCount} Followers
              </Typography>
              <Typography variant="body2">
                {profile.followingCount} Following
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

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
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

      {isOwn && (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Watchlist" />
            <Tab label="Ratings" />
          </Tabs>
          {tab === 0 && (
            <List disablePadding>
              {watchlist.map((item) => (
                <ListItemButton
                  key={item.mediaId}
                  component={Link}
                  to={`/${item.mediaType}/${item.mediaId}`}
                >
                  <ListItemText primary={item.mediaName} />
                </ListItemButton>
              ))}
            </List>
          )}
          {tab === 1 && (
            <List disablePadding>
              {ratings.map((item) => (
                <ListItemButton
                  key={item.mediaId}
                  component={Link}
                  to={`/${item.mediaType}/${item.mediaId}`}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <ListItemText primary={item.mediaName} />
                  <Rating
                    value={item.score / 2}
                    precision={0.5}
                    readOnly
                    sx={{ ml: "auto" }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </>
      )}
    </Container>
  );
}
