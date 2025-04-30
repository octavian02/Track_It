// src/ratings/dto/rating-item.dto.ts
import { MediaType } from '../rating.entity'; // ← import it here

export class RatingItemDto {
  mediaId: number;
  mediaName: string;
  mediaType: MediaType; // now resolves
  score: number;
  dateAdded: Date;
}
