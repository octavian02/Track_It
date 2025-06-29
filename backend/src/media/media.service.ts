import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaTypes } from './media.entity';
import { GenresService } from '../genres/genres.service';
import { MoviesService } from '../movies/movies.service';
import { ShowsService } from '../shows/shows.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly genresService: GenresService,
    private readonly moviesSvc: MoviesService,
    private readonly showsSvc: ShowsService,
  ) {}

  /** Asigură existența în DB și sincronizează genurile */
  async upsertWithGenres(
    tmdbId: number,
    mediaType: MediaTypes,
  ): Promise<Media> {
    // 1) Caută (sau creează) media
    let media = await this.mediaRepo.findOne({
      where: { tmdbId },
      relations: ['genres'],
    });
    if (!media) {
      // preia metadata de bază din API
      const details =
        mediaType === MediaTypes.MOVIE
          ? await this.moviesSvc.getDetails(tmdbId)
          : await this.showsSvc.getDetails(tmdbId);

      media = this.mediaRepo.create({
        tmdbId,
        title: mediaType === MediaTypes.MOVIE ? details.title : details.name,
        mediaType,
      });
    }

    // 2) Sincronizează genurile (lazy sau forțat)
    if (
      !media.genresLastSyncedAt ||
      Date.now() - media.genresLastSyncedAt.getTime() > 1000 * 60 * 60 * 24
    ) {
      const details =
        mediaType === MediaTypes.MOVIE
          ? await this.moviesSvc.getDetails(tmdbId)
          : await this.showsSvc.getDetails(tmdbId);

      const genreEntities = [];
      for (const g of details.genres) {
        const genre = await this.genresService.findOrCreate(g.id, g.name);
        genreEntities.push(genre);
      }
      media.genres = genreEntities;
      media.genresLastSyncedAt = new Date();
    }

    return this.mediaRepo.save(media);
  }

  /** Pentru rapoarte: obține top după genuri */
  async getUserGenreStats(userId: number) {
    return this.mediaRepo
      .createQueryBuilder('m')
      .innerJoin('m.genres', 'g')
      .innerJoin('history', 'h', 'h.media_id = m.id AND h.user_id = :uid', {
        uid: userId,
      })
      .select('g.name', 'genre')
      .addSelect('COUNT(h.id)', 'count')
      .groupBy('g.name')
      .orderBy('count', 'DESC')
      .getRawMany();
  }
}
