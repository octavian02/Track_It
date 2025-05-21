// src/pages/CommunityPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  List,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Avatar,
  Tooltip,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import axios from "axios";
import { Link } from "react-router-dom";
import UserListItem from "../components/UserListItem";
import { useAvatar } from "../hooks/useAvatar";

interface FeedItem {
  userId: number;
  username: string;
  displayName?: string;
  mediaId: number;
  mediaName: string;
  mediaType: "movie" | "tv";
  score: number;
  dateAdded: string;
  posterUrl?: string;
}

export default function CommunityPage() {
  // search state…
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // feed state…
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // 1) load followings' feed on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingFeed(true);
    axios
      .get<FeedItem[]>("/api/ratings/feed", { params: { limit: 8 } })
      .then((res) => {
        if (!cancelled) setFeed(res.data);
      })
      .finally(() => {
        if (!cancelled) setLoadingFeed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) user search effect…
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const { data } = await axios.get("/api/user/search", {
          params: { search: query },
        });
        setResults(data);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function UserAvatar({
    userId,
    size = 24,
  }: {
    userId: number;
    size?: number;
  }) {
    const { url, loading } = useAvatar(userId);
    if (loading) {
      return <Skeleton variant="circular" width={size} height={size} />;
    }
    return <Avatar src={url ?? undefined} sx={{ width: size, height: size }} />;
  }

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      {/* ─── User Search ─────────────────────────────────────────────── */}
      <Typography variant="h4" gutterBottom>
        Community
      </Typography>
      <TextField
        fullWidth
        label="Find users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username or name…"
        InputProps={{
          endAdornment: loadingSearch && <CircularProgress size={20} />,
        }}
      />
      <List>
        {results.map((u) => (
          <UserListItem key={u.id} user={u} />
        ))}
      </List>
      {/* ─── Followings' Recent Movies ─────────────────────────────── */}
      <Typography variant="h5" gutterBottom>
        What your friends are watching
      </Typography>
      {loadingFeed ? (
        <Box textAlign="center" my={2}>
          <CircularProgress size={24} />
        </Box>
      ) : feed.length === 0 ? (
        <Typography color="text.secondary" mb={3}>
          You’re not following anyone yet, or they haven’t rated recently.
        </Typography>
      ) : (
        <Grid container spacing={2} mb={4}>
          {feed.map((f) => (
            <Grid key={`${f.userId}-${f.mediaId}`} item xs={6} sm={4} md={3}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea
                  component={Link}
                  to={`/${f.mediaType}/${f.mediaId}`}
                >
                  <Box
                    component="img"
                    src={f.posterUrl || "/default-poster.png"}
                    alt={f.mediaName}
                    sx={{ width: "100%", height: 140, objectFit: "cover" }}
                  />
                  <CardContent sx={{ py: 1, px: 1 }}>
                    {/* avatar + name clickable */}
                    <Box
                      component={Link}
                      to={`/user/${f.username}/profile`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 0.5,
                        textDecoration: "none",
                        cursor: "pointer",
                        "&:hover .profileName": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      <UserAvatar userId={f.userId} size={32} />
                      <Typography
                        variant="subtitle2"
                        noWrap
                        className="profileName"
                        sx={{ ml: 1, color: "primary.main" }}
                      >
                        {f.displayName || f.username}
                      </Typography>
                    </Box>
                    <Tooltip title={f.mediaName}>
                      <Typography variant="subtitle2" noWrap>
                        {f.mediaName}
                      </Typography>
                    </Tooltip>
                    {/* golden star + score + date */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mt: 0.5 }}
                    >
                      <Box display="flex" alignItems="center">
                        <StarIcon
                          sx={{ fontSize: 16, color: "warning.main", mr: 0.5 }}
                        />
                        <Typography variant="caption">{f.score}/10</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(f.dateAdded).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
