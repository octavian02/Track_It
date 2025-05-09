// src/recommendations/recommendation.controller.ts
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { RatingsService } from '../ratings/ratings.service';
import { WatchlistService } from 'src/watchlist/watchlist.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(
    private rec: RecommendationService,
    private readonly ratingsService: RatingsService,
    private readonly watchlistService: WatchlistService,
  ) {}

  @Get()
  async list(
    @Request() req,
    @Query('type') type: 'movie' | 'tv',
    @Query('count') count = '10',
  ) {
    const userId = req.user.id;
    const take = parseInt(count, 10);

    // 1) Fetch ratings ≥7
    const ratings = await this.ratingsService.getRatingsForUser(userId, type);
    const likedIds = ratings.filter((r) => r.score >= 7).map((r) => r.mediaId);

    // 2) Fetch watchlist IDs
    const watchlist = await this.watchlistService.getWatchlistForUser(
      userId,
      type,
    );
    const watchlistIds = watchlist.map((w) => w.mediaId);

    // 3) Build an exclude list (already‐seen or saved)
    const excludeIds = Array.from(new Set([...likedIds, ...watchlistIds]));

    // 4) Delegate to service
    return this.rec.recommendFromLikes(type, likedIds, excludeIds, take);
  }
}
