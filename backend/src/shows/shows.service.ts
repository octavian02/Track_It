// src/shows/shows.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { randomInt } from 'crypto';

@Injectable()
export class ShowsService {
  private client: AxiosInstance;
  private readonly logger = new Logger(ShowsService.name);

  constructor() {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('TMDB_API_KEY not set');
    this.client = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: { api_key: apiKey },
    });
  }

  private handleError(method: string, err: any) {
    this.logger.error(`TMDB ${method} failed: ${err.message}`);
    throw new HttpException(
      `Failed to fetch ${method}`,
      HttpStatus.BAD_GATEWAY,
    );
  }

  async getTrending() {
    try {
      const { data } = await this.client.get('/trending/tv/week');
      return data;
    } catch (err) {
      this.handleError('getTrending', err);
    }
  }

  async getPopular() {
    try {
      const { data } = await this.client.get('/tv/popular');
      return data;
    } catch (err) {
      this.handleError('getPopular', err);
    }
  }

  async getTopRated() {
    try {
      const { data } = await this.client.get('/tv/top_rated');
      return data;
    } catch (err) {
      this.handleError('getTopRated', err);
    }
  }

  async getAiringToday() {
    try {
      const { data } = await this.client.get('/tv/airing_today');
      return data;
    } catch (err) {
      this.handleError('getAiringToday', err);
    }
  }

  async getDetails(id: number) {
    try {
      const { data } = await this.client.get(`/tv/${id}`);
      return data;
    } catch (err) {
      this.handleError('getDetails', err);
    }
  }

  async getCredits(id: number) {
    try {
      const { data } = await this.client.get(`/tv/${id}/credits`);
      return data;
    } catch (err) {
      this.handleError('getCredits', err);
    }
  }

  async getAggregateCredits(id: number) {
    try {
      const { data } = await this.client.get(`/tv/${id}/aggregate_credits`);
      return data;
    } catch (err) {
      this.handleError('getCredits', err);
    }
  }

  async getVideos(id: number) {
    try {
      const { data } = await this.client.get(`/tv/${id}/videos`);
      return data;
    } catch (err) {
      this.handleError('getVideos', err);
    }
  }

  async search(query: string) {
    try {
      const { data } = await this.client.get('/search/tv', {
        params: { query },
      });
      return data;
    } catch (err) {
      this.handleError('search', err);
    }
  }

  async getAverageEpisodeRuntime(tvId: number): Promise<number> {
    const { data: show } = await this.client.get(`/tv/${tvId}`);
    let total = 0;
    let count = 0;

    // 2) For each season, fetch its details
    for (const season of show.seasons || []) {
      // skip specials if desired:
      if (season.season_number === 0) continue;

      const { data: seasonData } = await this.client.get(
        `/tv/${tvId}/season/${season.season_number}`,
      );
      // 3) Sum up each episode’s runtime
      for (const ep of seasonData.episodes || []) {
        if (typeof ep.runtime === 'number') {
          total += ep.runtime;
          count += 1;
        }
      }
    }

    return count > 0 ? Math.round(total / count) : 0;
  }
  async getSeasonEpisodes(tvId: number, seasonNumber: number) {
    try {
      const { data } = await this.client.get(
        `/tv/${tvId}/season/${seasonNumber}`,
      );
      return data; // contains episodes[]
    } catch (err) {
      this.handleError('getSeasonEpisodes', err);
    }
  }
  async getRandom(): Promise<any> {
    try {
      // 1) First fetch page 1 to see how many total pages
      const first = await this.client.get('/tv/popular', {
        params: { page: 1 },
      });
      const totalPages = Math.min(first.data.total_pages, 500);

      // 2) Pick a random page between 1 and totalPages
      const page = randomInt(1, totalPages + 1);

      // 3) Fetch that page
      const { data } = await this.client.get('/tv/popular', {
        params: { page },
      });

      // 4) Pick a random result from that page
      const results = data.results as any[];
      if (!results.length) throw new Error('No shows on page');

      const idx = randomInt(0, results.length);
      return results[idx];
    } catch (err) {
      this.logger.error(`getRandom failed: ${err.message}`);
      throw new HttpException(
        'Failed to fetch random show',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
  async getEpisodeDetail(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    try {
      const { data } = await this.client.get(
        `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
      );
      return data;
    } catch (err) {
      this.handleError('getEpisodeDetail', err);
    }
  }
  async getSimilarShows(tvId: number) {
    try {
      const { data } = await this.client.get(`/tv/${tvId}/similar`);
      return data;
    } catch (err) {
      this.handleError('getSimilarShows', err);
    }
  }
}
