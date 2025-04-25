import React, { createContext, useCallback, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

type Notification = {
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const NotificationContext = createContext<(notif: Notification) => void>(
  () => {}
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [notif, setNotif] = useState<Notification>({
    message: "",
    severity: "info",
  });

  const notify = useCallback((n: Notification) => {
    setNotif(n);
    setOpen(true);
  }, []);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={notif.severity}
          elevation={6}
          variant="filled"
        >
          {notif.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => useContext(NotificationContext);
