// src/watchlist/watchlist.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistItem } from './watchlist.entity';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatchlistItem])],
  providers: [WatchlistService],
  controllers: [WatchlistController],
  exports: [WatchlistService],
})
export class WatchlistModule {}
