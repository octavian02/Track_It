// src/components/SearchBar.tsx
import { useState, useEffect, useRef, useMemo } from "react";
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
  Chip,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
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

function SearchBar() {
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [value, setValue] = useState<RawTmdbResult | null>(null);
  const [options, setOptions] = useState<RawTmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Record<string, RawTmdbResult[]>>({});
  const navigate = useNavigate();

  // Debounced fetch + cache
  const fetchResults = useMemo(
    () =>
      debounce(async (q: string) => {
        if (cache.current[q]) {
          setOptions(cache.current[q]);
          return;
        }
        setLoading(true);
        try {
          const { data } = await axios.get<{ results: RawTmdbResult[] }>(
            "/api/search",
            { params: { q } }
          );
          const slice = data.results.slice(0, 5);
          cache.current[q] = slice;
          setOptions(slice);
        } catch {
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

  const handleSelect = (opt: RawTmdbResult) => {
    const path =
      opt.media_type === "movie" ? `/movie/${opt.id}` : `/tv/${opt.id}`;
    navigate(path);
    // Clear everything
    setInputValue("");
    setOptions([]);
    setValue(null);
  };

  return (
    <Autocomplete<RawTmdbResult, false, false, false>
      value={value}
      inputValue={inputValue}
      onChange={(_, val) => {
        if (val) handleSelect(val);
        else setValue(null);
      }}
      onInputChange={(_, v) => {
        setInputValue(v);
        setQuery(v);
      }}
      openOnFocus
      loading={loading}
      options={options}
      noOptionsText="No results"
      getOptionLabel={(opt) => opt.title || opt.name || ""}
      filterOptions={(x) => x}
      PaperComponent={(props) => (
        <Paper
          {...props}
          sx={{ bgcolor: "#1e1e1e", color: "#fff", boxShadow: 3, mt: 1 }}
        />
      )}
      popupIcon={null}
      clearOnBlur={false}
      sx={{
        width: 320,
        "& .MuiOutlinedInput-root": {
          bgcolor: "#333",
          color: "#fff",
          "& fieldset": { borderColor: "#555" },
          "&:hover fieldset": { borderColor: "#777" },
          "&.Mui-focused fieldset": { borderColor: "#aaa" },
        },
        "& .MuiAutocomplete-input": { color: "#fff" },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search movies & TV…"
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            startAdornment: <SearchIcon sx={{ color: "#aaa", mr: 1 }} />,
            endAdornment: (
              <>
                {loading && <CircularProgress size={16} color="inherit" />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, opt) => {
        const year = (opt.release_date || opt.first_air_date || "").slice(0, 4);
        const path =
          opt.media_type === "movie" ? `/movie/${opt.id}` : `/tv/${opt.id}`;
        return (
          <ListItem
            {...props}
            key={`${opt.media_type}-${opt.id}`}
            onAuxClick={(e) => {
              if (e.button === 1) {
                window.open(path, "_blank", "noopener");
              }
            }}
            sx={{
              bgcolor: "transparent",
              color: "#fff",
              "&:hover": { bgcolor: "#2a2a2a" },
            }}
          >
            <ListItemAvatar>
              <Avatar
                variant="square"
                src={
                  opt.poster_path
                    ? `https://image.tmdb.org/t/p/w92${opt.poster_path}`
                    : "/default-movie-poster.png"
                }
                sx={{ width: 40, height: 60, mr: 1 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body1" color="inherit" noWrap>
                  {opt.title || opt.name}{" "}
                  {year && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ color: "#aaa", ml: 0.5 }}
                    >
                      ({year})
                    </Typography>
                  )}
                </Typography>
              }
            />
            <Chip
              label={opt.media_type.toUpperCase()}
              size="small"
              sx={{ bgcolor: "#555", color: "#fff", ml: 1 }}
            />
          </ListItem>
        );
      }}
    />
  );
}

export default SearchBar;
