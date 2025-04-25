import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

const AppLayout: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}
  >
    <Header />

    <Box component="main" sx={{ flex: 1 }}>
      <Outlet />
    </Box>

    <Footer />
  </Box>
);

export default AppLayout;
