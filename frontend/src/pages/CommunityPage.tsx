import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  List,
  Typography,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import UserListItem from "../components/UserListItem";

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
          <UserListItem key={u.id} user={u} />
        ))}
      </List>
    </Box>
  );
}
