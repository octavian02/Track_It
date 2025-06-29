// src/pages/StatsPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";

interface GenreStat {
  genre: string;
  count: number;
}
interface DailyStat {
  date: string;
  count: number;
}
interface YearlyTimeStat {
  year: number;
  hours: number;
}
interface MediaTypeStat {
  type: string;
  count: number;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

export default function StatsPage() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOwn =
    !paramUsername ||
    paramUsername === "me" ||
    paramUsername === user?.username;
  const profilePath = isOwn
    ? "/user/me/profile"
    : `/user/${paramUsername}/profile`;

  // owner info
  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // stats data
  const [genres, setGenres] = useState<GenreStat[]>([]);
  const [episodesPerDay, setEpisodesPerDay] = useState<DailyStat[]>([]);
  const [moviesPerDay, setMoviesPerDay] = useState<DailyStat[]>([]);
  const [yearlyTime, setYearlyTime] = useState<YearlyTimeStat[]>([]);
  const [mediaSplit, setMediaSplit] = useState<MediaTypeStat[]>([]);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const profileUrl = isOwn
          ? "/api/user/me/profile"
          : `/api/user/${paramUsername}/profile`;
        const { data: prof } = await axios.get<{
          id: number;
          displayName: string;
        }>(profileUrl);
        if (!mounted) return;
        setOwnerName(prof.displayName);
        setOwnerId(prof.id);

        const qs = `?userId=${prof.id}`;
        const [
          { data: gData },
          { data: eData },
          { data: mData },
          { data: yData },
          { data: sData },
        ] = await Promise.all([
          axios.get<GenreStat[]>(`/api/stats/genres${qs}`),
          axios.get<DailyStat[]>(`/api/stats/daily-episodes${qs}`),
          axios.get<DailyStat[]>(`/api/stats/daily-movies${qs}`),
          axios.get<YearlyTimeStat[]>(`/api/stats/yearly-time${qs}`),
          axios.get<MediaTypeStat[]>(`/api/stats/media-type${qs}`),
        ]);
        if (!mounted) return;
        setGenres(gData);
        setEpisodesPerDay(eData);
        setMoviesPerDay(mData);
        setYearlyTime(yData);
        setMediaSplit(sData);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, [paramUsername, isOwn, user]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Back + Title */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton
          onClick={() => navigate(profilePath)}
          size="large"
          sx={{
            color: (t) => t.palette.text.primary,
            "&:hover": { bgcolor: "transparent" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" ml={1} fontWeight={600}>
          {isOwn ? "My Stats" : `${ownerName}'s Stats`}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Top Genres */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Genres
            </Typography>
            {genres.length ? (
              <PieChart width={240} height={240}>
                <Pie
                  data={genres}
                  dataKey="count"
                  nameKey="genre"
                  outerRadius={80}
                  label
                >
                  {genres.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            ) : (
              <Typography>No data</Typography>
            )}
          </Paper>
        </Grid>

        {/* Episodes per Day */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Episodes Watched (Last 7 Days)
            </Typography>
            {episodesPerDay.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={episodesPerDay}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="count" fill={COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography>No data</Typography>
            )}
          </Paper>
        </Grid>

        {/* Movies per Day */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Movies Watched (Last 7 Days)
            </Typography>
            {moviesPerDay.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={moviesPerDay}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="count" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography>No data</Typography>
            )}
          </Paper>
        </Grid>

        {/* Watch Time by Year */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Watch Time by Year
            </Typography>
            {yearlyTime.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={yearlyTime}>
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ReTooltip />
                  <Line type="monotone" dataKey="hours" stroke={COLORS[2]} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography>No data</Typography>
            )}
          </Paper>
        </Grid>

        {/* Media Type Split */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Movies vs Shows
            </Typography>
            {mediaSplit.length ? (
              <PieChart width={240} height={240}>
                <Pie
                  data={mediaSplit}
                  dataKey="count"
                  nameKey="type"
                  outerRadius={80}
                  label
                >
                  {mediaSplit.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            ) : (
              <Typography>No data</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
