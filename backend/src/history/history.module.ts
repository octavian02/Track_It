// src/history/history.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from './history.entity';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { TrackingModule } from 'src/tracking/tracking.module';
import { ShowsModule } from 'src/shows/shows.module';
import { MoviesModule } from 'src/movies/movies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([History]),
    TrackingModule,
    ShowsModule,
    MoviesModule,
  ],
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}
