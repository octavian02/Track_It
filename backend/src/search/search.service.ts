// backend/src/search/search.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface TmdbResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  popularity: number;
  [key: string]: any;
}

@Injectable()
export class SearchService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: {
        api_key: process.env.TMDB_API_KEY,
        include_adult: false,
        language: 'en-US',
      },
    });
  }

  /**
   * Hits /search/multi, filters out people, returns top 10 movies/TV.
   */
  async search(query: string): Promise<{ results: TmdbResult[] }> {
    const { data } = await this.client.get('/search/multi', {
      params: { query, page: 1 },
    });

    const results: TmdbResult[] = (data.results as TmdbResult[])
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 10);

    return { results };
  }
}
