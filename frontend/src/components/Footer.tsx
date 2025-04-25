import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Link } from "@mui/material";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        backgroundColor: "#000",
        color: "#888",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Typography variant="body2">
        &copy; {year} TrackIt. All rights reserved.
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        {["About", "Help", "Terms", "Privacy"].map((label) => (
          <Link
            key={label}
            component={RouterLink}
            to={`/${label.toLowerCase()}`}
            underline="hover"
            color="inherit"
            sx={{ fontSize: "0.875rem" }}
          >
            {label}
          </Link>
        ))}
      </Box>
    </Box>
  );
};

export default Footer;
