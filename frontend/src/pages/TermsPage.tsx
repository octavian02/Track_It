import React from "react";
import { Box, Typography } from "@mui/material";

const TermsPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Terms of Service
    </Typography>
    <Typography>
      Please read these Terms of Service (“Terms”, “Terms of Service”) carefully
      before using TrackIt.
      {/* add terms text here */}
    </Typography>
  </Box>
);

export default TermsPage;
