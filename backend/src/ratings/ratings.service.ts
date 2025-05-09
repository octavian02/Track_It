// src/ratings/ratings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating, MediaType } from './rating.entity';
import { User } from '../user/user.entity';
import { ApiClient, requests } from 'recombee-api-client';

@Injectable()
export class RatingsService {
  private recombee = new ApiClient(
    process.env.RECOMBEE_DB_ID!,
    process.env.RECOMBEE_TOKEN!,
  );
  constructor(
    @InjectRepository(Rating)
    private repo: Repository<Rating>,
  ) {}

  async setRating(
    user: User,
    mediaId: number,
    mediaName: string,
    mediaType: MediaType,
    score: number,
  ) {
    let rating = await this.repo.findOne({
      where: { user: { id: user.id }, mediaId },
    });

    if (!rating) {
      rating = this.repo.create({ user, mediaId, mediaName, mediaType, score });
    } else {
      rating.score = score;
      rating.ratedAt = new Date();
    }

    const saved = await this.repo.save(rating);
    const normalized = score / 10;
    // Record the rating in Recombee
    await this.recombee.send(
      new requests.AddRating(
        user.id.toString(),
        mediaId.toString(),
        normalized,
        {
          cascadeCreate: true,
        },
      ),
    );

    return saved;
  }

  async getRating(user: User, mediaId: number) {
    return this.repo.findOne({
      where: { user: { id: user.id }, mediaId },
    });
  }

  async getRatingsForUser(userId: number, mediaType?: 'movie' | 'tv') {
    return this.repo.find({ where: { user: { id: userId }, mediaType } });
  }
}
