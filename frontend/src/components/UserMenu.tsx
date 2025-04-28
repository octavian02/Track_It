// src/components/UserMenu.tsx

import React from "react";
import { IconButton, Avatar, Menu, MenuItem, Skeleton } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { Link as RouterLink } from "react-router-dom";
import { useAvatar } from "../hooks/useAvatar";

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { url, loading } = useAvatar(user?.id);

  if (!user) {
    return null;
  }

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ p: 0, ml: 1 }}
        title={user.displayName}
      >
        {loading ? (
          <Skeleton variant="circular" width={40} height={40} />
        ) : (
          <Avatar src={url}>{user.username[0]}</Avatar>
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          component={RouterLink}
          to={`/user/me/profile`}
          onClick={handleClose}
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
