// src/history/history.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History, MediaType } from './history.entity';
import { User } from '../user/user.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly repo: Repository<History>,
  ) {}

  async markMovie(
    user: User,
    movieId: number,
    mediaName?: string,
  ): Promise<History> {
    const existing = await this.repo.findOne({
      where: {
        user: { id: user.id },
        mediaType: 'movie' as MediaType,
        mediaId: movieId,
      },
    });
    if (existing) return existing;

    const item = this.repo.create({
      user,
      mediaType: 'movie' as MediaType,
      mediaId: movieId,
      mediaName,
    });
    return this.repo.save(item);
  }

  async unmarkMovie(user: User, movieId: number) {
    await this.repo.delete({
      user: { id: user.id },
      mediaType: 'movie' as MediaType,
      mediaId: movieId,
    });
    return { removed: true };
  }

  /** List all watched movies for a user */
  async listWatchedMovies(user: User): Promise<History[]> {
    return this.repo.find({
      where: {
        user: { id: user.id },
        mediaType: 'movie' as MediaType,
      },
      order: { watchedAt: 'DESC' },
    });
  }

  /** Mark a specific episode as watched */
  async markEpisode(
    user: User,
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    mediaName?: string,
    episodeName?: string,
  ): Promise<History> {
    const existing = await this.repo.findOne({
      where: {
        user: { id: user.id },
        mediaType: 'episode' as MediaType,
        mediaId: showId,
        seasonNumber,
        episodeNumber,
      },
    });
    if (existing) return existing;

    const item = this.repo.create({
      user,
      mediaType: 'episode' as MediaType,
      mediaId: showId,
      seasonNumber,
      episodeNumber,
      mediaName,
      episodeName,
    });
    return this.repo.save(item);
  }

  /** Unmark an episode as watched */
  async unmarkEpisode(
    user: User,
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    await this.repo.delete({
      user: { id: user.id },
      mediaType: 'episode' as MediaType,
      mediaId: showId,
      seasonNumber,
      episodeNumber,
    });
    return { removed: true };
  }

  async listWatchedEpisodes(user: User, showId: number): Promise<History[]> {
    return this.repo.find({
      where: {
        user: { id: user.id },
        mediaType: 'episode' as MediaType,
        mediaId: showId,
      },
      order: {
        seasonNumber: 'ASC',
        episodeNumber: 'ASC',
      },
    });
  }
}
