// src/watchlist/watchlist.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItem, MediaType } from './watchlist.entity';
import { User } from '../user/user.entity';
import { ApiClient, requests } from 'recombee-api-client';

@Injectable()
export class WatchlistService {
  private recombee = new ApiClient(
    process.env.RECOMBEE_DB_ID!,
    process.env.RECOMBEE_TOKEN!,
  );

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

    // 2) record “added to watchlist” in Recombee
    await this.recombee.send(
      new requests.AddCartAddition(user.id.toString(), mediaId.toString(), {
        cascadeCreate: true,
      }),
    );

    return saved;
  }

  async removeFromWatchlist(user: User, mediaId: number) {
    await this.repo.delete({ user: { id: user.id }, mediaId });

    await this.recombee.send(
      new requests.DeleteCartAddition(user.id.toString(), mediaId.toString()),
    );

    return { removed: true };
  }

  async getWatchlistForUser(userId: number, mediaType?: 'movie' | 'tv') {
    return this.repo.find({ where: { user: { id: userId }, mediaType } });
  }
}
