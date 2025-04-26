// src/layout/AppLayout.tsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AnimatePresence, motion } from "framer-motion";

const AppLayout: React.FC = () => {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header />

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          style={{ flex: 1, position: "relative" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />
    </Box>
  );
};

export default AppLayout;
