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
    const existing = await this.repo.findOne({
      where: {
        user: { id: user.id },
        mediaType: 'movie' as MediaType,
        mediaId: movieId,
      },
    });
    if (existing) return existing;
    const details = await this.moviesSvc.getDetails(movieId);
    const runtime = details.runtime || 0;

    const item = this.repo.create({
      user,
      mediaType: 'movie' as MediaType,
      mediaId: movieId,
      mediaName,
      runtimeMinutes: runtime,
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

    const ep = await this.showsSvc.getEpisodeDetail(
      showId,
      seasonNumber,
      episodeNumber,
    );
    const runtime = ep.runtime || 0;

    const item = this.repo.create({
      user,
      mediaType: 'episode' as MediaType,
      mediaId: showId,
      seasonNumber,
      episodeNumber,
      mediaName,
      episodeName,
      runtimeMinutes: runtime,
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

  async getSummary(user: User): Promise<SummaryDto> {
    // 1) fetch all history for this user
    const all = await this.repo.find({ where: { user: { id: user.id } } });

    // 2) split into episodes vs movies
    const movies = all.filter((h) => h.mediaType === 'movie');
    const episodes = all.filter((h) => h.mediaType === 'episode');

    // 3) count how many
    const moviesWatched = movies.length;
    const episodesWatched = episodes.length;

    // 4) sum runtimes
    let movieTime = 0;
    for (const h of movies) {
      const details = await this.moviesSvc.getDetails(h.mediaId);
      // TMDB returns `runtime` in minutes
      movieTime += details.runtime ?? 0;
    }

    let tvTime = 0;
    for (const h of episodes) {
      const details = await this.showsSvc.getEpisodeDetail(
        h.mediaId,
        h.seasonNumber!,
        h.episodeNumber!,
      );
      // TMDB returns `runtime` in minutes
      tvTime += details.runtime ?? 0;
    }

    return {
      moviesWatched,
      episodesWatched,
      movieTime,
      tvTime,
    };
  }
}
