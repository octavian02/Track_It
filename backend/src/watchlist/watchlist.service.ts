// src/watchlist/watchlist.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItem, MediaType } from './watchlist.entity';
import { User } from '../user/user.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchlistItem)
    private repo: Repository<WatchlistItem>,
  ) {}

  async addToWatchlist(
    user: User,
    mediaId: number,
    mediaName: string,
    mediaType: MediaType,
  ) {
    const item = this.repo.create({ user, mediaId, mediaName, mediaType });
    const saved = await this.repo.save(item);

    return saved;
  }

  async removeFromWatchlist(user: User, mediaId: number) {
    await this.repo.delete({ user: { id: user.id }, mediaId });

    return { removed: true };
  }

  async getWatchlistForUser(userId: number, mediaType?: 'movie' | 'tv') {
    return this.repo.find({ where: { user: { id: userId }, mediaType } });
  }
}
