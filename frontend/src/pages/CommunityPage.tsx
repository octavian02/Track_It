import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { Link } from "react-router-dom";

interface UserSummary {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export default function CommunityPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get<UserSummary[]>("/api/user/search", {
          params: { search: query },
        });
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
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
          endAdornment: loading && <CircularProgress size={20} />,
        }}
      />
      <List>
        {results.map((u) => (
          <ListItemButton
            key={u.displayName}
            component={Link}
            to={`/user/${u.displayName}/profile`}
          >
            <ListItemAvatar>
              <Avatar src={u.avatarUrl}>
                {u.displayName?.[0] || u.username[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={u.displayName || u.username}
              secondary={`@${u.username}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
