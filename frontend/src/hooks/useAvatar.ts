import { useState, useEffect } from "react";
import axios from "axios";

// In-memory caches to dedupe fetches and store blob URLs
const avatarCache: Map<number, string> = new Map();
const avatarPromises: Map<number, Promise<string>> = new Map();

export function useAvatar(userId?: number) {
  const [url, setUrl] = useState<string | undefined>(
    userId != null ? avatarCache.get(userId) : undefined
  );
  const [loading, setLoading] = useState<boolean>(
    userId != null && !avatarCache.has(userId)
  );
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (userId == null) {
      setLoading(false);
      return;
    }

    if (avatarCache.has(userId)) {
      setUrl(avatarCache.get(userId));
      setLoading(false);
      return;
    }

    let cancelled = false;

    let promise = avatarPromises.get(userId);
    if (!promise) {
      promise = axios
        .get(`/api/user/${userId}/avatar`, { responseType: "blob" })
        .then((res) => {
          const blobUrl = URL.createObjectURL(res.data);
          avatarCache.set(userId, blobUrl);
          return blobUrl;
        })
        .catch((err) => {
          avatarPromises.delete(userId);
          throw err;
        });
      avatarPromises.set(userId, promise);
    }

    setLoading(true);
    promise
      .then((blobUrl) => {
        if (!cancelled) {
          setUrl(blobUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { url, loading, error };
}
