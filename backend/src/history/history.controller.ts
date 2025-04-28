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

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly svc: HistoryService) {}

  @Post('movie/:id')
  async markMovie(
    @Request() req,
    @Param('id') id: string,
    @Body('mediaName') mediaName: string,
  ) {
    return await this.svc.markMovie(req.user, +id, mediaName);
  }

  @Delete('movie/:id')
  async unmarkMovie(@Request() req, @Param('id') id: string) {
    return await this.svc.unmarkMovie(req.user, +id);
  }

  @Get('movie')
  async listMovies(@Request() req) {
    return await this.svc.listWatchedMovies(req.user);
  }

  // ─── Episodes ────────────────────────────────────────────

  @Post('show/:showId/season/:season/episode/:episode')
  async markEpisode(
    @Request() req,
    @Param('showId') showId: string,
    @Param('season') season: string,
    @Param('episode') episode: string,
    @Body('mediaName') showName: string,
    @Body('episodeName') episodeName: string,
  ) {
    return await this.svc.markEpisode(
      req.user,
      +showId,
      +season,
      +episode,
      showName,
      episodeName,
    );
  }

  @Delete('show/:showId/season/:season/episode/:episode')
  async unmarkEpisode(
    @Request() req,
    @Param('showId') showId: string,
    @Param('season') season: string,
    @Param('episode') episode: string,
  ) {
    return await this.svc.unmarkEpisode(req.user, +showId, +season, +episode);
  }

  @Get('show/:showId')
  async listEpisodes(@Request() req, @Param('showId') showId: string) {
    return await this.svc.listWatchedEpisodes(req.user, +showId);
  }
}
