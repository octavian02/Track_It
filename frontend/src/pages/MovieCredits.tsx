import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Button,
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

const getProfileUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w185${path}` : PortraitPlaceholder;

export default function MovieCredits() {
  const { id } = useParams<{ id: string }>();
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
        console.error(err);
      }
    })();
  }, [id]);

  const crewByDept = useMemo(() => {
    return crew.reduce(
      (acc, person) => {
        const dept = person.department || "Other";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(person);
        return acc;
      },
      {} as Record<string, CrewMember[]>
    );
  }, [crew]);

  return (
    <Box className="credits-page">
      <Container maxWidth="lg">
        <Box className="credits-header">
          <Button
            component={Link}
            to={`/movie/${id}`}
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            Back to Details
          </Button>
          <Typography variant="h4">Cast &amp; Crew</Typography>
        </Box>

        {/* Cast Section */}
        <Box className="section">
          <Typography variant="h5" className="section-title">
            Cast
          </Typography>
          <Grid container spacing={2}>
            {cast.map((m) => (
              <Grid item key={m.id} xs={6} sm={4} md={3} lg={2}>
                <Card className="profile-card">
                  <CardMedia
                    component="img"
                    image={getProfileUrl(m.profile_path)}
                    alt={m.name}
                    className="profile-photo"
                  />
                  <CardContent className="profile-content">
                    <Tooltip title={m.name}>
                      <Typography variant="subtitle1" className="profile-name">
                        {m.name}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={m.character}>
                      <Typography variant="caption" className="profile-job">
                        as {m.character}
                      </Typography>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Crew Sections */}
        {Object.entries(crewByDept).map(([dept, members]) => (
          <Box key={dept} className="section">
            <Accordion defaultExpanded={dept === "Directing"}>
              <AccordionSummary
                sx={{
                  backgroundColor: "#222",
                }}
                expandIcon={<ExpandMoreIcon />}
              >
                <Typography variant="h5">{dept}</Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  backgroundColor: "#222",
                }}
              >
                <Grid container spacing={2}>
                  {members.map((p) => (
                    <Grid item key={p.id} xs={6} sm={4} md={3} lg={2}>
                      <Card className="profile-card">
                        <CardMedia
                          component="img"
                          image={getProfileUrl(p.profile_path)}
                          alt={p.name}
                          className="profile-photo"
                        />
                        <CardContent className="profile-content">
                          <Tooltip title={p.name}>
                            <Typography
                              variant="subtitle1"
                              className="profile-name"
                            >
                              {p.name}
                            </Typography>
                          </Tooltip>
                          <Tooltip title={p.job}>
                            <Typography
                              variant="caption"
                              className="profile-job"
                            >
                              {p.job}
                            </Typography>
                          </Tooltip>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        ))}
      </Container>
    </Box>
  );
}
