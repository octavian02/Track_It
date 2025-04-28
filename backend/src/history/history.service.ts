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
    private repo: Repository<History>,
  ) {}

  async markMovie(user: User, movieId: number, mediaName?: string) {
    const existing = await this.repo.findOne({
      where: { user: { id: user.id }, mediaType: 'movie', mediaId: movieId },
    });
    if (existing) return existing;
    const item = this.repo.create({
      user,
      mediaType: 'movie' as MediaType,
      mediaId: movieId,
      mediaName: mediaName,
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

  async listWatchedMovies(user: User) {
    return this.repo.find({
      where: { user: { id: user.id }, mediaType: 'movie' as MediaType },
    });
  }

  async markEpisode(
    user: User,
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    mediaName?: string,
    episodeName?: string,
  ) {
    const existing = await this.repo.findOne({
      where: {
        user: { id: user.id },
        mediaType: 'episode' as MediaType,
        mediaId: showId,
        seasonNumber,
        episodeNumber,
        mediaName,
        episodeName,
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

  async listWatchedEpisodes(user: User, showId: number) {
    return this.repo.find({
      where: {
        user: { id: user.id },
        mediaType: 'episode' as MediaType,
        mediaId: showId,
      },
      order: { seasonNumber: 'ASC', episodeNumber: 'ASC' },
    });
  }
}
