// src/components/TrailerDialog.tsx
import React from "react";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface TrailerDialogProps {
  open: boolean;
  videoKey: string | null;
  onClose: () => void;
}

const TrailerDialog: React.FC<TrailerDialogProps> = ({
  open,
  videoKey,
  onClose,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="md"
    PaperProps={{
      style: { backgroundColor: "transparent", boxShadow: "none" },
    }}
  >
    <DialogContent sx={{ position: "relative", p: 0, backgroundColor: "#000" }}>
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#fff",
          zIndex: 10,
        }}
      >
        <CloseIcon />
      </IconButton>
      {videoKey && (
        <iframe
          width="100%"
          height="480"
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
          title="Trailer"
          frameBorder="0"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      )}
    </DialogContent>
  </Dialog>
);

export default TrailerDialog;
