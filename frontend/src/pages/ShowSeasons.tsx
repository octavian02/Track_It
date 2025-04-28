import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  CardMedia,
  Divider,
} from "@mui/material";
import { format } from "date-fns";
import defaultShowImage from "../static/default-show-image.jpg";

interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}
interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
  air_date: string;
}

const ShowSeasons: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodesMap, setEpisodesMap] = useState<Record<number, Episode[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: showDetail } = await axios.get<{ seasons: Season[] }>(
          `/api/shows/${id}`
        );
        setSeasons(showDetail.seasons);
        if (showDetail.seasons.length) {
          setSelectedSeason(showDetail.seasons[0].season_number);
        }

        const calls = showDetail.seasons.map((s) =>
          axios
            .get<{
              episodes: Episode[];
            }>(`/api/shows/${id}/seasons/${s.season_number}`)
            .then((res) => ({
              season: s.season_number,
              episodes: res.data.episodes,
            }))
        );
        const results = await Promise.all(calls);
        const map: Record<number, Episode[]> = {};
        results.forEach(({ season, episodes }) => (map[season] = episodes));
        setEpisodesMap(map);
      } catch (err) {
        console.error("Failed loading seasons/episodes", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleChange = (_: React.SyntheticEvent, value: number) => {
    setSelectedSeason(value);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Episode Guide
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Season Tabs */}
      <Tabs
        value={selectedSeason}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {seasons.map((season) => (
          <Tab
            key={season.season_number}
            label={`Season ${season.season_number}`}
            value={season.season_number}
          />
        ))}
      </Tabs>

      {/* Episodes for selected season */}
      <Box>
        {episodesMap[selectedSeason]?.map((ep) => (
          <Box
            key={ep.id}
            sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}
          >
            <CardMedia
              component="img"
              image={
                ep.still_path
                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                  : defaultShowImage
              }
              alt={`Episode ${ep.episode_number}`}
              sx={{
                width: 150,
                height: 84,
                borderRadius: 1,
                objectFit: "cover",
                mr: 2,
              }}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {ep.episode_number}. {ep.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ep.air_date
                  ? format(new Date(ep.air_date), "MMM d, yyyy")
                  : "TBA"}{" "}
                • {ep.runtime != null ? `${ep.runtime} min` : "–"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, maxWidth: 600 }}>
                {ep.overview || "No synopsis available."}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default ShowSeasons;
