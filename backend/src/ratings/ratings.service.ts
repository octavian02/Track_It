import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { User } from '../user/user.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private repo: Repository<Rating>,
  ) {}

  async setRating(user: User, movieId: number, score: number) {
    let rating = await this.repo.findOne({
      where: { user: { id: user.id }, movieId },
    });
    if (!rating) {
      rating = this.repo.create({ user, movieId, score });
    } else {
      rating.score = score;
      rating.ratedAt = new Date();
    }
    return this.repo.save(rating);
  }

  async getRating(user: User, movieId: number) {
    return this.repo.findOne({ where: { user: { id: user.id }, movieId } });
  }

  async getUserRatings(user: User) {
    return this.repo.find({ where: { user: { id: user.id } } });
  }
}
