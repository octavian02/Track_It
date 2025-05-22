// src/components/UpcomingShowCard.tsx
import { Card, CardMedia, CardContent, Typography, Box } from "@mui/material";

export interface UpcomingShow {
  showId: number;
  showName: string;
  posterUrl: string;
  nextSeason: number;
  nextEpisode: number;
  nextEpisodeName: string;
  nextAirDate: string;
  isNewest: boolean;
}

interface Props {
  show: UpcomingShow;
  onClick: (showId: number) => void;
}

function UpcomingShowCard({ show, onClick }: Props) {
  return (
    <Card
      onClick={() => onClick(show.showId)}
      sx={{
        bgcolor: "#1f1f1f",
        color: "#fff",
        borderRadius: 2,
        boxShadow: 2,
        cursor: "pointer",
        "&:hover": { boxShadow: 4 },
      }}
    >
      <CardMedia
        component="img"
        height="220"
        image={show.posterUrl}
        alt={show.showName}
      />
      <CardContent>
        <Typography variant="h6" noWrap>
          {show.showName}
        </Typography>
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="body2">
            Next Up:{" "}
            <strong>
              S{show.nextSeason}·E{show.nextEpisode}
            </strong>
          </Typography>
          <Typography variant="caption" color="gray" noWrap>
            “{show.nextEpisodeName || "TBA"}”
          </Typography>
        </Box>
        <Typography variant="caption" color="primary">
          Airs: {new Date(show.nextAirDate).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default UpcomingShowCard;
