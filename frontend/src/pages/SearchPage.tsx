// src/pages/SearchPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Autocomplete,
  TextField,
  Slider,
  Button,
  Grid,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import MovieCard from "../components/MovieCard";
import ShowCard from "../components/ShowCard";

interface Genre {
  id: number;
  name: string;
}
interface BannerMedia {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string;
  poster_path?: string;
  vote_average?: number;
  resourceType: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
}

const SORT_FIELDS = [
  { label: "Popularity", value: "popularity" },
  { label: "Rating", value: "vote_average" },
  { label: "Release Date", value: "primary_release_date" },
  { label: "A–Z", value: "title" },
] as const;

export default function SearchPage() {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  // --- FILTER STATE ---
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [releaseFrom, setReleaseFrom] = useState<Date | null>(null);
  const [releaseTo, setReleaseTo] = useState<Date | null>(null);
  const [voteGte, setVoteGte] = useState<number>(0);

  // --- SORT STATE ---
  const [sortField, setSortField] = useState<
    (typeof SORT_FIELDS)[number]["value"]
  >(SORT_FIELDS[0].value);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // --- RESULTS / LOADING ---
  const [results, setResults] = useState<BannerMedia[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch genre list when mediaType changes
  useEffect(() => {
    axios
      .get<Genre[]>("/api/search/genres", { params: { mediaType } })
      .then((res) => setGenres(res.data))
      .catch(() => setGenres([]));
  }, [mediaType]);

  // the actual search call
  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        mediaType,
        genres: selectedGenres.map((g) => g.id).join(","),
        sortBy: `${sortField}.${sortDirection}`,
        voteGte,
      };
      if (releaseFrom)
        params.releaseFrom = releaseFrom.toISOString().slice(0, 10);
      if (releaseTo) params.releaseTo = releaseTo.toISOString().slice(0, 10);

      const { data } = await axios.get<{ results: any[] }>(
        "/api/search/discover",
        { params }
      );
      setResults(
        data.results.map((r) => ({
          id: r.id,
          title: r.title,
          name: r.name,
          overview: r.overview,
          backdrop_path: r.backdrop_path,
          poster_path: r.poster_path,
          vote_average: r.vote_average,
          resourceType: mediaType,
          release_date: r.release_date,
          first_air_date: r.first_air_date,
        }))
      );
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setLoading(false);
    }
  }, [
    mediaType,
    selectedGenres,
    releaseFrom,
    releaseTo,
    voteGte,
    sortField,
    sortDirection,
  ]);

  // debounce helper
  function useDebouncedEffect(fn: () => void, deps: any[], delay = 300) {
    useEffect(() => {
      const handle = window.setTimeout(fn, delay);
      return () => window.clearTimeout(handle);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps]);
  }

  // fire the search whenever any filter or sort changes
  useDebouncedEffect(doSearch, [
    mediaType,
    selectedGenres,
    releaseFrom,
    releaseTo,
    voteGte,
    sortField,
    sortDirection,
  ]);

  return (
    <Box sx={{ p: isSm ? 2 : 4 }}>
      <Typography variant="h4" mb={2}>
        Discover
      </Typography>

      <Paper
        elevation={2}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          p: 2,
          alignItems: "center",
          mb: 4,
          borderRadius: 3,
        }}
      >
        {/* === media type tabs === */}
        <Tabs
          value={mediaType}
          onChange={(_, v) => setMediaType(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ minWidth: 120 }}
        >
          <Tab value="movie" label="Movie" />
          <Tab value="tv" label="TV Show" />
        </Tabs>

        {/* === genres multi-select === */}
        <Autocomplete
          multiple
          options={genres}
          getOptionLabel={(g) => g.name}
          value={selectedGenres}
          onChange={(_, v) => setSelectedGenres(v)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                label={option.name}
                size="small"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Genres"
              placeholder="Select genres"
              sx={{ minWidth: 200 }}
            />
          )}
          sx={{ flex: 1, minWidth: 200 }}
        />

        {/* === date range pickers === */}
        <DesktopDatePicker
          label="From"
          format="yyyy-MM-dd"
          value={releaseFrom}
          onChange={setReleaseFrom}
          slots={{ textField: TextField }}
          slotProps={{ textField: { sx: { width: 120 } } }}
        />
        <DesktopDatePicker
          label="To"
          format="yyyy-MM-dd"
          value={releaseTo}
          onChange={setReleaseTo}
          slots={{ textField: TextField }}
          slotProps={{ textField: { sx: { width: 120 } } }}
        />

        {/* === rating slider === */}
        <Box sx={{ width: 200, px: 1 }}>
          <Typography variant="caption">Rating ≥ {voteGte}</Typography>
          <Slider
            value={voteGte}
            onChange={(_, v) => setVoteGte(v as number)}
            min={0}
            max={10}
            step={0.5}
            valueLabelDisplay="auto"
          />
        </Box>

        {/* === dynamic sort control === */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" mr={1}>
            Sort by
          </Typography>
          <Select
            size="small"
            value={sortField}
            onChange={(e) =>
              setSortField(
                e.target.value as (typeof SORT_FIELDS)[number]["value"]
              )
            }
            sx={{ mr: 0.5 }}
          >
            {SORT_FIELDS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </Select>
          <IconButton
            size="small"
            onClick={() =>
              setSortDirection((d) => (d === "desc" ? "asc" : "desc"))
            }
          >
            {sortDirection === "desc" ? (
              <ArrowDownwardIcon fontSize="small" />
            ) : (
              <ArrowUpwardIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Paper>

      {/* === results grid === */}
      {loading ? (
        <Box textAlign="center">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {results.map((item) => (
            <Grid key={item.id} item xs={6} sm={4} md={3} lg={2}>
              {item.resourceType === "movie" ? (
                <MovieCard movie={item as any} />
              ) : (
                <ShowCard show={item as any} />
              )}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
