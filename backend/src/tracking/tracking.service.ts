import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingItem } from './tracking.entity';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { User } from '../user/user.entity';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingItem)
    private repo: Repository<TrackingItem>,
  ) {}

  async list(user: User) {
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
    });
    return this.repo.save(item);
  }

  async update(user: User, id: number, dto: UpdateTrackingDto) {
    const item = await this.repo.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!item) throw new NotFoundException('Tracking entry not found');
    item.seasonNumber = dto.seasonNumber;
    item.episodeNumber = dto.episodeNumber;
    item.nextAirDate = dto.nextAirDate ? new Date(dto.nextAirDate) : null;
    return this.repo.save(item);
  }

  async remove(user: User, id: number) {
    await this.repo.delete({ id, user: { id: user.id } });
    return { success: true };
  }

  /**
   * Called from history: bump tracking when an episode is watched.
   */
  async bumpFromHistory(
    user: User,
    showId: number,
    showName: string,
    season: number,
    episode: number,
    nextAirDate?: Date,
  ) {
    let item = await this.repo.findOne({
      where: { user: { id: user.id }, showId },
    });
    if (!item) {
      // create new tracking if none exists
      item = this.repo.create({
        user,
        showId,
        showName,
        seasonNumber: season,
        episodeNumber: episode,
        nextAirDate,
      });
    } else {
      // only bump if this episode/season is ahead
      if (
        season > item.seasonNumber ||
        (season === item.seasonNumber && episode > item.episodeNumber)
      ) {
        item.seasonNumber = season;
        item.episodeNumber = episode;
        item.nextAirDate = nextAirDate || item.nextAirDate;
      }
    }
    return this.repo.save(item);
  }
}
