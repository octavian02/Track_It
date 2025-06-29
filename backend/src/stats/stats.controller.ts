// src/stats/stats.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('genres')
  getGenres(@Query('userId') userId: string) {
    const uid = +userId;
    return this.statsService.getGenreStatsForUser(uid);
  }

  /** Episodes watched per day (last 7 days) */
  @Get('daily-episodes')
  getDailyEpisodes(@Query('userId') userId: string) {
    return this.statsService.getDailyEpisodes(+userId);
  }

  /** Movies watched per day (last 7 days) */
  @Get('daily-movies')
  getDailyMovies(@Query('userId') userId: string) {
    return this.statsService.getDailyMovies(+userId);
  }

  /** Total watch time by year */
  @Get('yearly-time')
  getYearlyTime(@Query('userId') userId: string) {
    return this.statsService.getYearlyTime(+userId);
  }

  /** Split between movies and shows */
  @Get('media-type')
  getMediaTypeSplit(@Query('userId') userId: string) {
    return this.statsService.getMediaTypeSplit(+userId);
  }
}
