import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingItem } from './tracking.entity';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { User } from '../user/user.entity';
import { ShowsService } from 'src/shows/shows.service';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingItem)
    private repo: Repository<TrackingItem>,
    private shows: ShowsService,
  ) {}

  async list(user: User): Promise<TrackingItem[]> {
    return this.repo.find({ where: { user: { id: user.id } } });
  }

  async add(user: User, dto: CreateTrackingDto) {
    const item = this.repo.create({
      user,
      showId: dto.showId,
      showName: dto.showName,
      seasonNumber: dto.seasonNumber || 1,
      episodeNumber: dto.episodeNumber || 0,
      nextAirDate: dto.nextAirDate ? new Date(dto.nextAirDate) : null,
      paused: dto.paused ?? false,
    });
    return this.repo.save(item);
  }

  async update(user: User, id: number, dto: UpdateTrackingDto) {
    const item = await this.repo.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!item) throw new NotFoundException('Tracking entry not found');
    Object.assign(item, {
      seasonNumber: dto.seasonNumber ?? item.seasonNumber,
      episodeNumber: dto.episodeNumber ?? item.episodeNumber,
      nextAirDate: dto.nextAirDate
        ? new Date(dto.nextAirDate)
        : item.nextAirDate,
      paused: dto.paused ?? item.paused,
    });
    return this.repo.save(item);
  }

  async remove(user: User, id: number) {
    await this.repo.delete({ id, user: { id: user.id } });
    return { success: true };
  }

  async getOne(user: User, id: number) {
    const item = await this.repo.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!item) throw new NotFoundException('Tracking entry not found');
    return item;
  }

  async bumpFromHistory(
    user: User,
    showId: number,
    showName: string,
    season: number,
    episode: number,
    nextAirDate?: Date,
  ) {
    if (!showName) {
      const details = await this.shows.getDetails(showId);
      showName = details.name;
    }

    let item = await this.repo.findOne({
      where: { user: { id: user.id }, showId },
    });
    if (!item) {
      item = this.repo.create({
        user,
        showId,
        showName,
        seasonNumber: season,
        episodeNumber: episode,
        nextAirDate,
      });
    } else {
      if (
        season > item.seasonNumber ||
        (season === item.seasonNumber && episode > item.episodeNumber)
      ) {
        item.seasonNumber = season;
        item.episodeNumber = episode;
        item.nextAirDate = nextAirDate || item.nextAirDate;
      }
      if (!item.showName) {
        item.showName = showName;
      }
    }
    return this.repo.save(item);
  }
  async completeSeason(
    user: User,
    showId: number,
    seasonNumber: number,
  ): Promise<TrackingItem> {
    // 1) fetch the season’s episodes
    const seasonData = await this.shows.getSeasonEpisodes(showId, seasonNumber);
    const episodes = seasonData.episodes;
    if (!episodes?.length) {
      throw new NotFoundException('Season not found or empty');
    }

    // 2) find the highest episode number
    const maxEp = Math.max(...episodes.map((e) => e.episode_number));
    const lastAir = episodes.find((e) => e.episode_number === maxEp)!.air_date;

    // 3) bump pointer
    return this.bumpFromHistory(
      user,
      showId,
      seasonData.name || `Season ${seasonNumber}`,
      seasonNumber,
      maxEp,
      new Date(lastAir),
    );
  }

  async completeShow(user: User, showId: number): Promise<TrackingItem> {
    // 1) fetch show metadata (to get all seasons)
    const showDetails = await this.shows.getDetails(showId);
    if (!showDetails?.seasons?.length) {
      throw new NotFoundException('Show not found or has no seasons');
    }

    let finalSeason = 0;
    let finalEpisode = 0;
    let finalAirDate: Date | null = null;

    // 2) for each season, fetch its episodes and track the very last one
    for (const s of showDetails.seasons) {
      if (s.season_number === 0) continue; // skip specials if you like

      const sd = await this.shows.getSeasonEpisodes(showId, s.season_number);
      const eps = sd.episodes || [];
      if (!eps.length) continue;

      const maxEp = Math.max(...eps.map((e) => e.episode_number));
      const aired = new Date(
        eps.find((e) => e.episode_number === maxEp)!.air_date,
      );

      // choose the overall latest
      if (
        s.season_number > finalSeason ||
        (s.season_number === finalSeason && maxEp > finalEpisode)
      ) {
        finalSeason = s.season_number;
        finalEpisode = maxEp;
        finalAirDate = aired;
      }
    }

    if (finalSeason === 0) {
      throw new NotFoundException('No episodes found to complete');
    }

    // 3) bump pointer
    return this.bumpFromHistory(
      user,
      showId,
      showDetails.name,
      finalSeason,
      finalEpisode,
      finalAirDate!,
    );
  }
}
