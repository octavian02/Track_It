import React from "react";
import {
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Skeleton,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAvatar } from "../hooks/useAvatar";

interface UserSummary {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string; // server-provided fallback
}

interface UserListItemProps {
  user: UserSummary;
  onClick?: () => void;
}

function UserListItem({ user, onClick }: UserListItemProps) {
  const { url, loading } = useAvatar(user.id);

  return (
    <ListItemButton
      component={Link}
      to={`/user/${user.username}/profile`}
      onClick={onClick} // ← now closes dialog
    >
      <ListItemAvatar>
        {loading ? (
          <Skeleton variant="circular" width={40} height={40} />
        ) : (
          <Avatar src={url ?? user.avatarUrl}>
            {(user.displayName || user.username)[0]}
          </Avatar>
        )}
      </ListItemAvatar>
      <ListItemText
        primary={user.displayName || user.username}
        secondary={`@${user.username}`}
      />
    </ListItemButton>
  );
}

export default UserListItem;
