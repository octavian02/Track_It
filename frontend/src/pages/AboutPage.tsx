import React from "react";
import { Box, Typography } from "@mui/material";

const AboutPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      About
    </Typography>
    <Typography>
      TrackIt is a simple app for discovering and tracking your favorite movies
      and shows.
    </Typography>
  </Box>
);

export default AboutPage;
