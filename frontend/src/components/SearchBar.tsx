// frontend/src/components/SearchBar.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import {
  Autocomplete,
  TextField,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface RawTmdbResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  popularity: number;
}

interface SearchOption extends RawTmdbResult {
  actors: string[];
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Debounced TMDB multi-search + enrich with first 2 actors
  const fetchResults = useMemo(
    () =>
      debounce(async (q: string) => {
        setLoading(true);
        try {
          const { data } = await axios.get<{ results: RawTmdbResult[] }>(
            "/api/search",
            { params: { q } }
          );

          const slice = data.results.slice(0, 5);
          const enriched: SearchOption[] = await Promise.all(
            slice.map(async (r) => {
              const creditsUrl =
                r.media_type === "movie"
                  ? `/api/movies/${r.id}/credits`
                  : `/api/shows/${r.id}/credits`;
              const cred = await axios.get<{ cast: { name: string }[] }>(
                creditsUrl
              );
              return {
                ...r,
                actors: cred.data.cast.slice(0, 2).map((c) => c.name),
              } as SearchOption;
            })
          );

          setOptions(enriched);
        } catch (err) {
          console.error("Search failed:", err);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    if (query.length >= 2) {
      fetchResults(query);
    } else {
      setOptions([]);
    }
  }, [query, fetchResults]);

  return (
    <Autocomplete<SearchOption, false, false, true>
      freeSolo
      openOnFocus
      loading={loading}
      options={options}
      noOptionsText="No results"
      loadingText="Loading..."
      getOptionLabel={(opt) =>
        typeof opt === "string" ? opt : opt.title || opt.name || ""
      }
      filterOptions={(x) => x}
      onInputChange={(_, v) => setQuery(v)}
      onChange={(_, val) => {
        if (val && typeof val !== "string") {
          const path =
            val.media_type === "movie" ? `/movie/${val.id}` : `/tv/${val.id}`;
          navigate(path);
        }
      }}
      componentsProps={{
        paper: {
          sx: {
            bgcolor: "white",
            color: "black",
            boxShadow: 3,
          },
        },
        popper: {
          sx: {
            bgcolor: "white",
            color: "black",
            boxShadow: 3,
          },
        },
      }}
      sx={{
        width: 300,
        // white input against dark header
        "& .MuiOutlinedInput-root": {
          bgcolor: "white",
          color: "black",
        },
        // white dropdown items
        "& .MuiAutocomplete-listbox": {
          bgcolor: "white",
          color: "black",
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search movies & TV…"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={16} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, opt) => {
        const year = (opt.release_date || opt.first_air_date || "").slice(0, 4);
        return (
          <ListItem
            {...props}
            key={`${opt.media_type}-${opt.id}`}
            sx={{ alignItems: "center" }}
          >
            <ListItemAvatar>
              <Avatar
                variant="square"
                src={
                  opt.poster_path
                    ? `https://image.tmdb.org/t/p/w92${opt.poster_path}`
                    : "/default-movie-poster.png"
                }
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <Typography variant="subtitle1">
                    {opt.title || opt.name}
                  </Typography>
                  {year && (
                    <Typography
                      variant="body2"
                      sx={{ ml: 1 }}
                      color="text.secondary"
                    >
                      ({year})
                    </Typography>
                  )}
                  <Chip
                    label={opt.media_type.toUpperCase()}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
              secondary={opt.actors.join(", ")}
              sx={{ ml: 1 }}
            />
          </ListItem>
        );
      }}
    />
  );
}
