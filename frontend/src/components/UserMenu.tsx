// src/components/UserMenu.tsx

import React from "react";
import { IconButton, Avatar, Menu, MenuItem } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { Link as RouterLink } from "react-router-dom";
import { AccountCircle as AccountCircleIcon } from "@mui/icons-material";

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!user) {
    // You could render a Login button here instead
    return null;
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: "#fff" }}
      >
        <AccountCircleIcon></AccountCircleIcon>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          component={RouterLink}
          to="/profile"
          onClick={() => setAnchorEl(null)}
        >
          Profile
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to="/watchlist"
          onClick={() => setAnchorEl(null)}
        >
          My Watchlist
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to="/ratings"
          onClick={() => setAnchorEl(null)}
        >
          My Ratings
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            logout();
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
