// backend/src/search/dto/search-result.dto.ts
export interface TmdbResult {
  id: number;
  popularity: number;
  media_type: 'movie' | 'tv';
  // …other fields you care about
}

export class SearchResponseDto {
  results: TmdbResult[];
}
