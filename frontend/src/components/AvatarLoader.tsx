// src/components/AvatarLoader.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Avatar } from "@mui/material";

interface AvatarLoaderProps {
  userId: number;
  size?: number;
  endpoint?: string;
}

const AvatarLoader: React.FC<AvatarLoaderProps> = ({
  userId,
  size = 96,
  endpoint = "/api/user",
}) => {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string;

    axios
      .get(`${endpoint}/${userId}/avatar`, {
        responseType: "blob",
      })
      .then((res) => {
        if (!isMounted) return;
        const blob =
          res.data instanceof Blob
            ? res.data
            : new Blob([res.data], { type: "image/png" });
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch((err) => {
        console.warn("Blob fetch failed, retrying as arraybuffer", err);
        return axios
          .get(`${endpoint}/${userId}/avatar`, {
            responseType: "arraybuffer",
          })
          .then((res2) => {
            if (!isMounted) return;
            const blob2 = new Blob([res2.data], { type: "image/png" });
            objectUrl = URL.createObjectURL(blob2);
            setSrc(objectUrl);
          })
          .catch((err2) => {
            console.error("Avatar load failed completely", err2);
          });
      });

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, endpoint]);

  return (
    <Avatar src={src || undefined} sx={{ width: size, height: size }}></Avatar>
  );
};

export default AvatarLoader;
