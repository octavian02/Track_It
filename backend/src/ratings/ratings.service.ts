// src/ratings/ratings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Rating, MediaType } from './rating.entity';
import { User } from '../user/user.entity';
import { MoviesService } from 'src/movies/movies.service';
import { FollowService } from 'src/user/follow.service';
import { FeedItemDto } from './dto/feed-item.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private repo: Repository<Rating>,
    private followService: FollowService,
    private moviesService: MoviesService,
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

  async getFeedForUser(meId: number, limit = 8): Promise<FeedItemDto[]> {
    // 1) find your followings
    const followingIds = await this.followService.getFollowingIds(meId);
    if (followingIds.length === 0) return [];

    // 2) load their most recent ratings
    const ratings = await this.repo.find({
      where: { user: { id: In(followingIds) }, mediaType: 'movie' },
      relations: ['user'],
      order: { ratedAt: 'DESC' },
      take: Math.min(limit, 20),
    });

    // 3) enrich with TMDB details, but don’t let a single 404 kill the feed
    const feed: FeedItemDto[] = [];
    for (const r of ratings) {
      let title = r.mediaName;
      let posterPath: string | undefined;
      try {
        const details = await this.moviesService.getDetails(r.mediaId);
        title = details.title;
        if (details.poster_path) {
          posterPath = `https://image.tmdb.org/t/p/w300${details.poster_path}`;
        }
      } catch (e) {
        // TMDB lookup failed (e.g. 404), so we fallback to stored mediaName and no poster
        console.warn(`TMDB lookup failed for mediaId=${r.mediaId}`, e.message);
      }

      feed.push({
        userId: r.user.id,
        username: r.user.username,
        displayName: r.user.displayName,
        avatarUrl: r.user.avatar && `/user/${r.user.id}/avatar`,
        mediaId: r.mediaId,
        mediaName: title,
        mediaType: r.mediaType,
        score: r.score,
        dateAdded: r.ratedAt.toISOString(),
        posterUrl: posterPath,
      });
    }

    return feed;
  }
}
