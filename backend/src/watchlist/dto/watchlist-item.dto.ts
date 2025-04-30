import { MediaType } from '../watchlist.entity';

export class WatchlistItemDto {
  mediaId: number;
  mediaName: string;
  mediaType: MediaType;
  dateAdded: Date; // from WatchlistItem.addedAt
}
