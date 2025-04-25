import React from "react";
import { Box, Typography } from "@mui/material";

const HelpPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Help
    </Typography>
    <Typography>
      Need assistance? Here are some answers to frequently asked questions.
      {/* add FAQ or help content here */}
    </Typography>
  </Box>
);

export default HelpPage;
