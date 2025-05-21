// src/history/history.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History, MediaType } from './history.entity';
import { User } from '../user/user.entity';
import { ShowsService } from 'src/shows/shows.service';
import { MoviesService } from 'src/movies/movies.service';
import { SummaryDto } from './dto/summary.dto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly repo: Repository<History>,
    private readonly showsSvc: ShowsService,
    private readonly moviesSvc: MoviesService,
  ) {}

  async markMovie(
    user: User,
    movieId: number,
    mediaName?: string,
  ): Promise<History> {
    let entry = await this.repo.findOne({
      where: {
        user: { id: user.id },
        mediaType: 'movie',
        mediaId: movieId,
      },
    });

    if (!entry) {
      // first watch
      const details = await this.moviesSvc.getDetails(movieId);
      entry = this.repo.create({
        user,
        mediaType: 'movie',
        mediaId: movieId,
        mediaName,
        runtimeMinutes: details.runtime || 0,
        watchCount: 1,
        firstWatchedAt: new Date(),
        lastWatchedAt: new Date(),
      });
    } else {
      // rewatch
      entry.watchCount++;
      entry.lastWatchedAt = new Date();
    }

    return this.repo.save(entry);
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
      order: { firstWatchedAt: 'DESC' },
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
    // 1) Backfill show title if needed
    if (!mediaName) {
      const show = await this.showsSvc.getDetails(showId);
      mediaName = show.name;
    }

    // 2) Fetch episode details (for runtime & title)
    const ep = await this.showsSvc.getEpisodeDetail(
      showId,
      seasonNumber,
      episodeNumber,
    );
    if (!episodeName) {
      episodeName = ep.name;
    }

    // 3) Try to find an existing history row
    let entry = await this.repo.findOne({
      where: {
        user: { id: user.id },
        mediaType: 'episode',
        mediaId: showId,
        seasonNumber,
        episodeNumber,
      },
    });

    if (!entry) {
      // first‐time watch
      entry = this.repo.create({
        user,
        mediaType: 'episode',
        mediaId: showId,
        mediaName,
        seasonNumber,
        episodeNumber,
        episodeName,
        runtimeMinutes: ep.runtime || 0,
        watchCount: 1, // start at 1
        firstWatchedAt: new Date(),
        lastWatchedAt: new Date(),
      });
    } else {
      // rewatch → bump the counter & update timestamp
      entry.watchCount = entry.watchCount + 1;
      entry.lastWatchedAt = new Date();
    }

    return this.repo.save(entry);
  }

  async unmarkEpisode(
    user: User,
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
  ): Promise<{ removed: boolean }> {
    // 1) load the existing history row
    const entry = await this.repo.findOne({
      where: {
        user: { id: user.id },
        mediaType: 'episode',
        mediaId: showId,
        seasonNumber,
        episodeNumber,
      },
    });

    if (!entry) {
      // nothing to remove
      return { removed: false };
    }

    if (entry.watchCount > 1) {
      // just decrement the counter
      entry.watchCount = entry.watchCount - 1;
      await this.repo.save(entry);
      return { removed: false }; // row still exists, just one removed
    } else {
      // last copy → delete the whole row
      await this.repo.delete({ id: entry.id });
      return { removed: true };
    }
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

  async getSummary(user: User): Promise<SummaryDto> {
    // 1) episodes stats
    const epRaw = await this.repo
      .createQueryBuilder('h')
      .select('SUM(h.runtimeMinutes * h.watchCount)', 'tvTime')
      .addSelect('SUM(h.watchCount)', 'episodesWatched')
      .where('h.userId = :uid', { uid: user.id })
      .andWhere("h.mediaType = 'episode'")
      .getRawOne<{ tvTime: string; episodesWatched: string }>();

    // 2) movies stats
    const mvRaw = await this.repo
      .createQueryBuilder('h')
      .select('SUM(h.runtimeMinutes * h.watchCount)', 'movieTime')
      .addSelect('SUM(h.watchCount)', 'moviesWatched')
      .where('h.userId = :uid', { uid: user.id })
      .andWhere("h.mediaType = 'movie'")
      .getRawOne<{ movieTime: string; moviesWatched: string }>();

    return {
      tvTime: Number(epRaw.tvTime) || 0,
      episodesWatched: Number(epRaw.episodesWatched) || 0,
      movieTime: Number(mvRaw.movieTime) || 0,
      moviesWatched: Number(mvRaw.moviesWatched) || 0,
    };
  }
}
