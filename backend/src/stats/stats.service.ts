// src/stats/stats.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from '../history/history.entity';
import { subDays } from 'date-fns';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepo: Repository<History>,
  ) {}

  async getGenreStatsForUser(userId: number) {
    const raw = await this.historyRepo
      .createQueryBuilder('h')
      .where('h.userId = :uid', { uid: userId })
      .innerJoin('media', 'm', 'm.tmdbId = h.mediaId')
      .innerJoin('media_genres', 'mg', 'mg.media_id = m.id')
      .innerJoin('genre', 'g', 'g.id = mg.genre_id')
      .select('g.name', 'genre')
      .addSelect('SUM(h.watchCount)', 'count')
      .groupBy('g.name')
      .orderBy('count', 'DESC')
      .getRawMany<{ genre: string; count: string }>();

    return raw.map((r) => ({
      genre: r.genre,
      count: Number(r.count),
    }));
  }

  async getDailyEpisodes(userId: number) {
    const since = subDays(new Date(), 6);
    const raw = await this.historyRepo
      .createQueryBuilder('h')
      .select(`TO_CHAR(h.lastWatchedAt, 'YYYY-MM-DD')`, 'date')
      .addSelect('SUM(h.watchCount)', 'count')
      .where('h.userId = :uid', { uid: userId })
      .andWhere("h.mediaType = 'episode'")
      .andWhere('h.lastWatchedAt >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return raw.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  async getDailyMovies(userId: number) {
    const since = subDays(new Date(), 6);
    const raw = await this.historyRepo
      .createQueryBuilder('h')
      .select(`TO_CHAR(h.lastWatchedAt, 'YYYY-MM-DD')`, 'date')
      .addSelect('SUM(h.watchCount)', 'count')
      .where('h.userId = :uid', { uid: userId })
      .andWhere("h.mediaType = 'movie'")
      .andWhere('h.lastWatchedAt >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return raw.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  async getYearlyTime(userId: number) {
    const raw = await this.historyRepo
      .createQueryBuilder('h')
      .select(`EXTRACT(YEAR FROM h.lastWatchedAt)`, 'year')
      .addSelect('SUM(h.runtimeMinutes * h.watchCount) / 60', 'hours')
      .where('h.userId = :uid', { uid: userId })
      .groupBy('year')
      .orderBy('year', 'ASC')
      .getRawMany<{ year: string; hours: string }>();

    return raw.map((r) => ({
      year: parseInt(r.year, 10),
      hours: parseFloat(r.hours),
    }));
  }

  /** Filme vs. seriale */
  async getMediaTypeSplit(userId: number) {
    const raw = await this.historyRepo
      .createQueryBuilder('h')
      .select('h.mediaType', 'type')
      .addSelect('SUM(h.watchCount)', 'count')
      .where('h.userId = :uid', { uid: userId })
      .groupBy('h.mediaType')
      .getRawMany<{ type: string; count: string }>();

    return raw.map((r) => ({ type: r.type, count: Number(r.count) }));
  }
}
