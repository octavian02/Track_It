// src/history/history.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { HistoryService } from './history.service';
import { TrackingService } from 'src/tracking/tracking.service';
import { ShowsService } from 'src/shows/shows.service';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(
    private readonly historySvc: HistoryService,
    private readonly trackingSvc: TrackingService,
    private readonly showsSvc: ShowsService,
  ) {}

  @Get('summary')
  async summary(@Request() req) {
    return this.historySvc.getSummary(req.user);
  }

  @Post('movie/:id')
  async markMovie(
    @Request() req,
    @Param('id') id: string,
    @Body('mediaName') mediaName: string,
  ) {
    return await this.historySvc.markMovie(req.user, +id, mediaName);
  }

  @Delete('movie/:id')
  async unmarkMovie(@Request() req, @Param('id') id: string) {
    return await this.historySvc.unmarkMovie(req.user, +id);
  }

  @Get('movie')
  async listMovies(@Request() req) {
    return await this.historySvc.listWatchedMovies(req.user);
  }

  @Post('episode/:showId/:season/:episode')
  async markEpisode(
    @Request() req,
    @Param('showId') showId: string,
    @Param('season') season: string,
    @Param('episode') episode: string,
    @Body('mediaName') showName?: string,
    @Body('episodeName') episodeName?: string,
  ) {
    // 1️⃣ mark in history
    const hist = await this.historySvc.markEpisode(
      req.user,
      +showId,
      +season,
      +episode,
      showName,
      episodeName,
    );

    // 2️⃣ bump tracking automatically
    await this.trackingSvc.bumpFromHistory(
      req.user,
      +showId,
      showName,
      +season,
      +episode,
    );

    return hist;
  }

  // Un‐mark a single episode
  // DELETE /history/episode/456/2/5
  @Delete('episode/:showId/:season/:episode')
  async unmarkEpisode(
    @Request() req,
    @Param('showId') showId: string,
    @Param('season') season: string,
    @Param('episode') episode: string,
  ) {
    // 1) remove from history
    await this.historySvc.unmarkEpisode(req.user, +showId, +season, +episode);

    // 2) compute rollback target
    let prevSeason = +season;
    let prevEpisode = +episode - 1;

    if (prevEpisode < 1 && prevSeason > 1) {
      // roll into previous season
      prevSeason--;
      const seasonData = await this.showsSvc.getSeasonEpisodes(
        +showId,
        prevSeason,
      );
      prevEpisode = seasonData.episodes.length;
    } else if (prevEpisode < 1) {
      // at S1E1 → go to “not started”
      prevEpisode = 0;
    }

    // 3) explicitly update the tracking row
    const tracks = await this.trackingSvc.list(req.user);
    const track = tracks.find((t) => t.showId === +showId);
    if (track) {
      await this.trackingSvc.update(req.user, track.id, {
        seasonNumber: prevSeason,
        episodeNumber: prevEpisode,
      });
    }

    return { removed: true };
  }

  @Get('show/:showId')
  async listEpisodes(@Request() req, @Param('showId') showId: string) {
    return await this.historySvc.listWatchedEpisodes(req.user, +showId);
  }
}
