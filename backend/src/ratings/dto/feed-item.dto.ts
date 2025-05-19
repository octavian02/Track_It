export class FeedItemDto {
  userId!: number;
  username!: string;
  displayName?: string;
  avatarUrl?: string;
  mediaId!: number;
  mediaName!: string;
  mediaType!: 'movie' | 'tv';
  score!: number;
  dateAdded!: string; // ISO
  posterUrl?: string;
}
