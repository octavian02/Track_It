/* eslint-disable @typescript-eslint/no-unused-vars */
// src/recommendations/content-recommendation.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CohereClient } from 'cohere-ai';
import axios, { AxiosInstance } from 'axios';
import cosineSimilarity = require('cosine-similarity');

interface RawItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  mediaType: 'movie' | 'tv';
  embedding: number[];
}

export interface RecommendationItem {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
}

@Injectable()
export class RecommendationService implements OnModuleInit {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly tmdb: AxiosInstance;
  private readonly cohere: CohereClient;
  private items: RawItem[] = [];

  constructor() {
    // 1) Cohere key
    const cohereApiKey = process.env.COHERE_API_KEY;
    if (!cohereApiKey) {
      throw new Error('COHERE_API_KEY not set');
    }
    this.cohere = new CohereClient({ token: cohereApiKey }); // instantiate with your key :contentReference[oaicite:1]{index=1}

    // 2) TMDB key
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      throw new Error('TMDB_API_KEY not set');
    }
    this.tmdb = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: { api_key: tmdbApiKey },
    });
  }

  async onModuleInit() {
    this.logger.log('Loading popular items from TMDB (pages 1–3)…');

    // Preload first 3 pages of both movies and TV
    const pages = [1, 2, 3];
    const movieFetches = pages.map((p) =>
      this.tmdb.get('/movie/popular', { params: { page: p } }),
    );
    const tvFetches = pages.map((p) =>
      this.tmdb.get('/tv/popular', { params: { page: p } }),
    );

    const moviePages = await Promise.all(movieFetches);
    const tvPages = await Promise.all(tvFetches);

    const movies = moviePages.flatMap((r) => r.data.results as any[]);
    const shows = tvPages.flatMap((r) => r.data.results as any[]);

    const pool: Omit<RawItem, 'embedding'>[] = [
      ...movies.map((m) => ({
        id: m.id,
        title: m.title,
        overview: m.overview || '',
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        mediaType: 'movie' as const,
      })),
      ...shows.map((t) => ({
        id: t.id,
        title: t.name,
        overview: t.overview || '',
        poster_path: t.poster_path,
        vote_average: t.vote_average,
        mediaType: 'tv' as const,
      })),
    ];

    this.logger.log(`Attempting to embed ${pool.length} items…`);

    try {
      const BATCH_SIZE = 96;
      const texts = pool.map((i) => i.overview || 'No description');
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batchTexts = texts.slice(i, i + BATCH_SIZE);
        const batchRes = await this.cohere.embed({
          model: 'embed-english-v2.0',
          texts: batchTexts,
          truncate: 'END',
        });
        const batchEmbeds: number[][] =
          (batchRes as any).body?.embeddings ?? (batchRes as any).embeddings;

        allEmbeddings.push(...batchEmbeds);
      }

      // NOW allEmbeddings.length === pool.length
      this.items = pool.map((item, idx) => ({
        ...item,
        embedding: allEmbeddings[idx],
      }));

      this.logger.log(`Embedded ${this.items.length} items successfully.`);
    } catch (err: any) {
      this.logger.warn(
        'Embedding failed—will fallback to TMDB endpoints only.',
        err.message || err,
      );
      // items[] stays empty → fallback path will be used on request
    }
  }

  async recommendFromLikes(
    type: 'movie' | 'tv',
    likedIds: number[],
    excludeIds: number[],
    count = 10,
  ): Promise<RecommendationItem[]> {
    //
    // Fallback helper: generic popular
    //
    const fallback = async (): Promise<RecommendationItem[]> => {
      // If we have at least one liked ID, try TMDB /{type}/{seedId}/recommendations
      if (likedIds.length > 0) {
        const seedId = likedIds[0]; // you could pick the highest-rated instead
        this.logger.warn(
          `Falling back to TMDB recommendations for ${type}/${seedId}`,
        );
        try {
          const path = `${type}/${seedId}/recommendations`;
          const { data } = await this.tmdb.get(path, { params: { page: 1 } });
          const recs = (data.results as any[])
            .filter((m) => !excludeIds.includes(m.id))
            .slice(0, count)
            .map((m) => ({
              id: m.id,
              title: type === 'tv' ? m.name : m.title,
              overview: m.overview,
              poster_path: m.poster_path,
              vote_average: m.vote_average,
            }));
          if (recs.length > 0) {
            return recs;
          }
        } catch (err: any) {
          this.logger.warn(
            `TMDB recommendations failed for ${type}/${seedId}:`,
            err.message,
          );
        }
      }

      // Otherwise or if recommendations were empty, use /{type}/top_rated
      this.logger.warn(`Falling back to TMDB top_rated for ${type}`);
      const topPath = type === 'tv' ? '/tv/top_rated' : '/movie/top_rated';
      const { data: topData } = await this.tmdb.get(topPath, {
        params: { page: 1 },
      });
      return (topData.results as any[])
        .filter((m) => !excludeIds.includes(m.id))
        .slice(0, count)
        .map((m) => ({
          id: m.id,
          title: type === 'tv' ? m.name : m.title,
          overview: m.overview,
          poster_path: m.poster_path,
          vote_average: m.vote_average,
        }));
    };

    // 1) No embeddings loaded at startup → fallback immediately
    if (this.items.length === 0) {
      return fallback();
    }

    // 2) On-demand embed any liked IDs not already in the pool
    const missing = likedIds.filter(
      (id) => !this.items.some((i) => i.id === id && i.mediaType === type),
    );
    if (missing.length > 0) {
      this.logger.log(
        `Embedding ${missing.length} liked ${type}(s) on demand…`,
      );
      const toEmbed: Omit<RawItem, 'embedding'>[] = [];

      for (const id of missing) {
        try {
          const { data } = await this.tmdb.get(
            type === 'tv' ? `/tv/${id}` : `/movie/${id}`,
          );
          toEmbed.push({
            id: data.id,
            title: type === 'tv' ? data.name : data.title,
            overview: data.overview || '',
            poster_path: data.poster_path,
            vote_average: data.vote_average,
            mediaType: type,
          });
        } catch (error: any) {
          this.logger.warn(
            `Skipping ${type}/${id}:`,
            error.response?.status,
            error.response?.statusText,
          );
        }
      }

      if (toEmbed.length) {
        try {
          const BATCH_SIZE = 96;
          const allNewEmbeddings: number[][] = [];
          const embedTexts = toEmbed.map((i) => i.overview || 'No description');

          for (let i = 0; i < embedTexts.length; i += BATCH_SIZE) {
            const batch = embedTexts.slice(i, i + BATCH_SIZE);
            const res = await this.cohere.embed({
              model: 'embed-english-v2.0',
              texts: batch,
              truncate: 'END',
            });
            const embs: number[][] =
              (res as any).body?.embeddings ?? (res as any).embeddings;
            allNewEmbeddings.push(...embs);
          }

          // attach them in order
          toEmbed.forEach((item, idx) => {
            this.items.push({ ...item, embedding: allNewEmbeddings[idx] });
          });
        } catch (err: any) {
          this.logger.warn('On-demand embedding failed:', err.message);
        }
      }
    }

    // 3) Gather the liked embeddings of the correct mediaType
    const liked = this.items.filter(
      (i) => i.mediaType === type && likedIds.includes(i.id),
    );
    if (liked.length === 0) {
      // no matched embeddings → fallback
      return fallback();
    }

    // 4) Compute centroid
    const dim = liked[0].embedding.length;
    const centroid = Array(dim).fill(0);
    liked.forEach((i) => i.embedding.forEach((v, j) => (centroid[j] += v)));
    centroid.forEach((sum, j) => (centroid[j] /= liked.length));

    // 5) Score, filter out excludeIds, sort, take top N
    const results = this.items
      .filter((i) => i.mediaType === type && !excludeIds.includes(i.id))
      .map((i) => ({
        item: i,
        score: cosineSimilarity(centroid, i.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map((s) => {
        const { embedding, mediaType, ...rest } = s.item;
        return rest;
      });

    return results;
  }
}
