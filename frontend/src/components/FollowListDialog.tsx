// src/components/FollowListDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
import UserListItem from "./UserListItem";

export interface FollowListDialogProps {
  open: boolean;
  title: string;
  loading: boolean;
  users: Array<{
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  }>;
  onClose: () => void;
}

export default function FollowListDialog({
  open,
  title,
  loading,
  users,
  onClose,
}: FollowListDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
          </Box>
        ) : users.length > 0 ? (
          users.map((u) => (
            <UserListItem key={u.id} user={u} onClick={onClose} />
          ))
        ) : (
          <Box textAlign="center" py={4}>
            <em>No one here yet.</em>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
