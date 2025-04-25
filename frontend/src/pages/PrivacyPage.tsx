import React from "react";
import { Box, Typography } from "@mui/material";

const PrivacyPage: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Privacy Policy
    </Typography>
    <Typography>
      Your privacy is important to us. This policy explains how we collect, use,
      and protect your data.
      {/* add privacy policy here */}
    </Typography>
  </Box>
);

export default PrivacyPage;
