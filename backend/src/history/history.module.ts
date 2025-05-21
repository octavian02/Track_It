// src/history/history.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from './history.entity';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { TrackingModule } from 'src/tracking/tracking.module';
import { ShowsModule } from 'src/shows/shows.module';
import { MoviesModule } from 'src/movies/movies.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([History]),
    forwardRef(() => TrackingModule),
    ShowsModule,
    MoviesModule,
    UserModule,
  ],
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}
