import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { RatingsModule } from 'src/ratings/ratings.module';
import { WatchlistModule } from 'src/watchlist/watchlist.module';

@Module({
  imports: [RatingsModule, WatchlistModule],
  providers: [RecommendationService],
  controllers: [RecommendationController],
})
export class RecommendationModule {}
