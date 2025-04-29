// src/pages/SearchPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  TextField,
  Slider,
  Button,
  Grid,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

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
  release_date?: string; // ← new
  first_air_date?: string;
}

export default function SearchPage() {
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [releaseFrom, setReleaseFrom] = useState<Date | null>(null);
  const [releaseTo, setReleaseTo] = useState<Date | null>(null);
  const [voteGte, setVoteGte] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("popularity.desc");

  const [results, setResults] = useState<BannerMedia[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch genres when mediaType changes
  useEffect(() => {
    axios
      .get<Genre[]>("/api/search/genres", { params: { mediaType } })
      .then((res) => setGenres(res.data))
      .catch(() => setGenres([]));
  }, [mediaType]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = {
        mediaType,
        genres: selectedGenres.join(","),
        sortBy,
        voteGte,
      };
      if (releaseFrom)
        params.releaseFrom = releaseFrom.toISOString().slice(0, 10);
      if (releaseTo) params.releaseTo = releaseTo.toISOString().slice(0, 10);

      const { data } = await axios.get<{ results: any[] }>(
        "/api/search/discover",
        { params }
      );
      console.log("Discover response", data);
      const mapped = data.results.map((r) => ({
        id: r.id,
        title: r.title,
        name: r.name,
        overview: r.overview,
        backdrop_path: r.backdrop_path,
        poster_path: r.poster_path,
        vote_average: r.vote_average,
        resourceType: r.media_type,
        release_date: r.release_date, // ← new
        first_air_date: r.first_air_date,
      }));
      setResults(mapped);
    } catch (err) {
      console.error("Search discover failed", err);
      // optional: show a Snackbar or Notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Advanced Search & Filtering
      </Typography>

      <Grid container spacing={2} alignItems="center">
        {/* Media Type */}

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={mediaType}
              label="Type"
              onChange={(e) => setMediaType(e.target.value as any)}
            >
              <MenuItem value="movie">Movie</MenuItem>
              <MenuItem value="tv">TV Show</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Genres */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Genres</InputLabel>
            <Select
              multiple
              value={selectedGenres}
              onChange={(e) => setSelectedGenres(e.target.value as number[])}
              input={<OutlinedInput label="Genres" />}
              renderValue={(vals) =>
                genres
                  .filter((g) => vals.includes(g.id))
                  .map((g) => g.name)
                  .join(", ")
              }
            >
              {genres.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Release Date Range */}
        <Grid item xs={6} sm={3} md={2}>
          <DatePicker
            label="From"
            value={releaseFrom}
            onChange={(newVal) => setReleaseFrom(newVal)}
            slots={{
              textField: (params) => <TextField {...params} fullWidth />,
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <DatePicker
            label="To"
            value={releaseTo}
            onChange={(newVal) => setReleaseTo(newVal)}
            slots={{
              textField: (params) => <TextField {...params} fullWidth />,
            }}
          />
        </Grid>

        {/* Rating Slider */}
        <Grid item xs={12} sm={6} md={2}>
          <Typography gutterBottom>Rating ≥ {voteGte}</Typography>
          <Slider
            value={voteGte}
            onChange={(_, v) => setVoteGte(v as number)}
            min={0}
            max={10}
            step={0.5}
            valueLabelDisplay="auto"
          />
        </Grid>

        {/* Sort By */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="popularity.desc">Popularity ↓</MenuItem>
              <MenuItem value="popularity.asc">Popularity ↑</MenuItem>
              <MenuItem value="vote_average.desc">Rating ↓</MenuItem>
              <MenuItem value="vote_average.asc">Rating ↑</MenuItem>
              <MenuItem value="primary_release_date.desc">
                Release Date ↓
              </MenuItem>
              <MenuItem value="primary_release_date.asc">
                Release Date ↑
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Search Button */}
        <Grid item xs={12}>
          <Button variant="contained" size="large" onClick={handleSearch}>
            Search
          </Button>
        </Grid>
      </Grid>

      {/* Results */}
      <Box sx={{ mt: 4 }}>
        {loading ? (
          <CircularProgress />
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
    </Box>
  );
}
