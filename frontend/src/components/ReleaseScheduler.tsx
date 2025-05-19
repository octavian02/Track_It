// src/components/ReleaseScheduler.tsx
import React, { useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useNotifications } from "../contexts/NotificationContext";
import { UpcomingShow } from "../components/UpcomingShowCard"; // wherever your UpcomingShow type lives

interface Props {
  upcoming: UpcomingShow[];
}

export default function ReleaseScheduler({ upcoming }: Props) {
  const { push } = useNotifications();

  // track which ones we've already alerted on
  const alerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    function checkReleases() {
      const now = dayjs();
      upcoming.forEach((show) => {
        const airTime = dayjs(show.nextAirDate);
        const hoursUntil = airTime.diff(now, "hour", true);
        // if within next 3 hours, and not already alerted:
        if (hoursUntil > 0 && hoursUntil <= 90) {
          const key = `${show.showId}-${show.nextSeason}-${show.nextEpisode}`;
          if (!alerted.current.has(key)) {
            alerted.current.add(key);
            push(
              `"${show.showName}" S${show.nextSeason}·E${show.nextEpisode} airs at ${airTime.format(
                "MMM D, h:mm A"
              )}`
            );
          }
        }
      });
    }

    // run on mount + whenever `upcoming` changes
    checkReleases();
    // then re-check every hour
    const timer = setInterval(checkReleases, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [upcoming, push]);

  return null;
}
