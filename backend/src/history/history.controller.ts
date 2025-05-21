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
  NotFoundException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { HistoryService } from './history.service';
import { TrackingService } from 'src/tracking/tracking.service';
import { ShowsService } from 'src/shows/shows.service';
import { UserService } from 'src/user/user.service';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(
    private readonly historySvc: HistoryService,
    private readonly trackingSvc: TrackingService,
    private readonly showsSvc: ShowsService,
    private readonly userSvc: UserService,
  ) {}

  @Get('summary')
  async summary(
    @Request() req,
    @Query('userId') userId?: string, // ← read query
  ) {
    // if no userId, fallback to the logged-in user
    if (!userId) {
      return this.historySvc.getSummary(req.user);
    }

    // otherwise, load that user
    const target = await this.userSvc.findOneById(+userId);
    if (!target) {
      // you can either throw a NotFoundException here or return empty
      throw new NotFoundException(`User ${userId} not found`);
    }
    return this.historySvc.getSummary(target);
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
  @UseGuards(JwtAuthGuard)
  async listMovies(@Request() req, @Query('userId') userId?: string) {
    // lookup userId or default to req.user.id
    const uid = userId ? +userId : req.user.id;
    const target = userId ? await this.userSvc.findOneById(uid) : req.user;
    return this.historySvc.listWatchedMovies(target);
  }

  @Post('episode/:showId/:season/:episode')
  async markEpisode(
    @Request() req,
    @Param('showId') showId: string,
    @Param('season') season: string,
    @Param('episode') episode: string,
  ) {
    // 1️⃣ mark in history
    const hist = await this.historySvc.markEpisode(
      req.user,
      +showId,
      +season,
      +episode,
    );

    // 2️⃣ bump tracking automatically
    await this.trackingSvc.bumpFromHistory(
      req.user,
      +showId,
      undefined,
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
    // 1) unmarkEpisode now returns { removed: boolean }
    const { removed } = await this.historySvc.unmarkEpisode(
      req.user,
      +showId,
      +season,
      +episode,
    );

    // 2) only if we actually removed the row do we roll back tracking
    if (removed) {
      // find your existing tracking entry
      const tracks = await this.trackingSvc.list(req.user);
      const track = tracks.find((t) => t.showId === +showId);
      if (track) {
        // same rollback logic as before
        let prevSeason = +season;
        let prevEpisode = +episode - 1;
        if (prevEpisode < 1 && prevSeason > 1) {
          prevSeason--;
          const seasonData = await this.showsSvc.getSeasonEpisodes(
            +showId,
            prevSeason,
          );
          prevEpisode = seasonData.episodes.length;
        } else if (prevEpisode < 1) {
          prevEpisode = 0;
        }

        await this.trackingSvc.update(req.user, track.id, {
          seasonNumber: prevSeason,
          episodeNumber: prevEpisode,
        });
      }
    }

    return { removed };
  }

  @Delete('season/:showId/:season')
  @UseGuards(JwtAuthGuard)
  async unwatchSeason(
    @Request() req,
    @Param('showId') showId: string,
    @Param('season') season: string,
  ) {
    const sid = +showId;
    const snum = +season;

    // 1) fetch and unmark one watch from each ep in that season
    const allRows = await this.historySvc.listWatchedEpisodes(req.user, sid);
    const rows = allRows.filter((r) => r.seasonNumber === snum);
    for (const r of rows) {
      await this.historySvc.unmarkEpisode(
        req.user,
        sid,
        snum,
        r.episodeNumber!,
      );
    }

    // 2) re-fetch remaining watched episodes in that season
    const remaining = (await this.historySvc.listWatchedEpisodes(req.user, sid))
      .filter((r) => r.seasonNumber === snum)
      .map((r) => r.episodeNumber!); // array of episodeNumbers still watched

    // 3) compute new pointer
    let newEpisode = 0;
    if (remaining.length) {
      newEpisode = Math.max(...remaining);
    }

    // 4) update tracking in one shot
    const tracks = await this.trackingSvc.list(req.user);
    const track = tracks.find((t) => t.showId === sid);
    if (track) {
      await this.trackingSvc.update(req.user, track.id, {
        seasonNumber: snum,
        episodeNumber: newEpisode,
      });
    }

    return { success: true };
  }

  @Get('show/:showId')
  async listEpisodes(@Request() req, @Param('showId') showId: string) {
    return await this.historySvc.listWatchedEpisodes(req.user, +showId);
  }
}
