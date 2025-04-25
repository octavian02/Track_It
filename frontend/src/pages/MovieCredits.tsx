// src/pages/MovieCredits.tsx
import React, { useState, useEffect, useMemo, SyntheticEvent } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PortraitPlaceholder from "../static/Portrait_Placeholder.png";
import "./MovieCredits.css";

interface CastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
}

interface CrewMember {
  id: number;
  name: string;
  profile_path: string | null;
  job: string;
  department: string;
}

function getProfileUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : PortraitPlaceholder;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function MovieCredits() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await axios.get<{
          cast: CastMember[];
          crew: CrewMember[];
        }>(`/api/movies/${id}/credits`);
        setCast(data.cast);
        setCrew(data.crew);
      } catch (err) {
        console.error("Error fetching credits:", err);
      }
    })();
  }, [id]);

  const crewByDept = useMemo(() => {
    return crew.reduce(
      (acc, member) => {
        const dept = member.department || "Other";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(member);
        return acc;
      },
      {} as Record<string, CrewMember[]>
    );
  }, [crew]);

  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ bgcolor: "#121212", color: "#fff", py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
          <Button
            component={Link}
            to={`/movie/${id}`}
            startIcon={<ArrowBackIcon htmlColor="#fff" />}
            size="small"
            sx={{ color: "#fff", textTransform: "none" }}
          >
            Back to Details
          </Button>
          <Typography variant="h4">Cast &amp; Crew</Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label="Cast" />
          <Tab label="Crew" />
        </Tabs>

        {/* Cast Panel */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            {cast.map((m) => (
              <Grid key={m.id} item xs={12} sm={6} md={4} lg={2}>
                <Card
                  sx={{
                    bgcolor: "#1e1e1e",
                    "&:hover": { boxShadow: 6 },
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={getProfileUrl(m.profile_path)}
                    alt={m.name}
                    sx={{ height: 260, objectFit: "cover" }}
                  />
                  <CardContent sx={{ p: 1, flexGrow: 1 }}>
                    <Tooltip title={m.name}>
                      <Typography
                        variant="subtitle1"
                        noWrap
                        sx={{ color: "#fff" }}
                      >
                        {m.name}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={m.character}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#bbb",
                          mt: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        as {m.character}
                      </Typography>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Crew Panel */}
        <TabPanel value={tab} index={1}>
          {Object.entries(crewByDept).map(([dept, members]) => (
            <Box key={dept} sx={{ mb: 3 }}>
              <Accordion
                defaultExpanded={dept === "Directing"}
                sx={{ bgcolor: "#1e1e1e" }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon htmlColor="#fff" />}
                  sx={{ bgcolor: "#1e1e1e" }}
                >
                  <Typography variant="h6" sx={{ color: "#fff" }}>
                    {dept}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#1e1e1e", p: 2 }}>
                  <Grid container spacing={2}>
                    {members.map((p) => (
                      <Grid key={p.id} item xs={12} sm={6} md={4} lg={2}>
                        <Card
                          sx={{
                            bgcolor: "#2a2a2a",
                            "&:hover": { boxShadow: 6 },
                            borderRadius: 2,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={getProfileUrl(p.profile_path)}
                            alt={p.name}
                            sx={{ height: 260, objectFit: "cover" }}
                          />
                          <CardContent sx={{ p: 1 }}>
                            <Tooltip title={p.name}>
                              <Typography
                                variant="subtitle1"
                                noWrap
                                sx={{ color: "#fff" }}
                              >
                                {p.name}
                              </Typography>
                            </Tooltip>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#bbb",
                                mt: 0.5,
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {p.job}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          ))}
        </TabPanel>
      </Container>
    </Box>
  );
}
