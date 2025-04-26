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

export interface DiscoverFilters {
  genres?: string;
  releaseFrom?: string;
  releaseTo?: string;
  voteGte?: string;
  sortBy?: string;
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
  async getGenres(
    mediaType: 'movie' | 'tv',
  ): Promise<{ id: number; name: string }[]> {
    const path = mediaType === 'movie' ? '/genre/movie/list' : '/genre/tv/list';
    const { data } = await this.client.get(path);
    return data.genres;
  }

  /** advanced discover using TMDB discover endpoints */
  async discover(
    mediaType: 'movie' | 'tv',
    filters: DiscoverFilters,
  ): Promise<{ results: TmdbResult[] }> {
    const path = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
    const params: Record<string, any> = {
      page: 1,
      sort_by: filters.sortBy || 'popularity.desc',
    };
    if (filters.genres) params.with_genres = filters.genres;
    if (filters.releaseFrom) {
      const key =
        mediaType === 'movie'
          ? 'primary_release_date.gte'
          : 'first_air_date.gte';
      params[key] = filters.releaseFrom;
    }
    if (filters.releaseTo) {
      const key =
        mediaType === 'movie'
          ? 'primary_release_date.lte'
          : 'first_air_date.lte';
      params[key] = filters.releaseTo;
    }
    if (filters.voteGte) params['vote_average.gte'] = filters.voteGte;

    const { data } = await this.client.get(path, { params });
    const results: TmdbResult[] = (data.results as TmdbResult[]).slice(0, 50);
    return { results };
  }
}
