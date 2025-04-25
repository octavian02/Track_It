import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItem } from './watchlist.entity';
import { User } from '../user/user.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchlistItem)
    private repo: Repository<WatchlistItem>,
  ) {}

  async addToWatchlist(user: User, movieId: number, movieTitle: string) {
    const item = this.repo.create({ user, movieId, movieTitle });
    return this.repo.save(item);
  }

  async removeFromWatchlist(user: User, movieId: number) {
    await this.repo.delete({ user: { id: user.id }, movieId });
    return { removed: true };
  }

  async getWatchlist(user: User) {
    return this.repo.find({ where: { user: { id: user.id } } });
  }
}
