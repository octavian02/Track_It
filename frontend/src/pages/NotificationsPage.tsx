// src/pages/NotificationsPage.tsx
import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import { useNotifications } from "../contexts/NotificationContext";

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead } = useNotifications();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>
      <Button onClick={markAllRead}>Mark all as read</Button>
      <List>
        {notifications.map((n) => (
          <ListItem
            key={n.id}
            button
            onClick={() => markRead(n.id)}
            sx={{ bgcolor: n.read ? "transparent" : "rgba(255,215,0,0.1)" }}
          >
            <ListItemText
              primary={n.message}
              secondary={n.date.toLocaleString()}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
