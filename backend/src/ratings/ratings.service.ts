// src/ratings/ratings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating, MediaType } from './rating.entity';
import { User } from '../user/user.entity';

@Injectable()
export class RatingsService {
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

    return this.repo.save(rating);
  }

  async getRating(user: User, mediaId: number) {
    return this.repo.findOne({
      where: { user: { id: user.id }, mediaId },
    });
  }

  async getUserRatings(user: User) {
    return this.repo.find({ where: { user: { id: user.id } } });
  }
}
