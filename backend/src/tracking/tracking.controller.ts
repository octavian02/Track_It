import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { HistoryService } from 'src/history/history.service';
import { ShowsService } from 'src/shows/shows.service';
import { UserService } from 'src/user/user.service';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(
    private readonly svc: TrackingService,
    private readonly historySvc: HistoryService,
    private readonly showsSvc: ShowsService,
    private readonly userSvc: UserService,
  ) {}

  // List all tracking items for either the logged‐in user or another user
  @Get()
  async list(
    @Request() req,
    @Query('userId') userId?: string, // ← read query
  ) {
    // 1) Default to yourself
    let target = req.user;
    // 2) If userId is provided, look up that user
    if (userId) {
      target = await this.userSvc.findOneById(+userId);
      if (!target) {
        throw new NotFoundException(`User ${userId} not found`);
      }
    }
    // 3) Delegate to your service
    return this.svc.list(target);
  }

  @Get(':id')
  async getOne(@Request() req, @Param('id') id: string) {
    const item = await this.svc.getOne(req.user, +id);
    if (!item) throw new NotFoundException('Tracking entry not found');
    return item;
  }

  @Post()
  add(@Request() req, @Body() dto: CreateTrackingDto) {
    return this.svc.add(req.user, dto);
  }

  @Post('show/:showId/season/:seasonNumber/complete')
  async completeSeason(
    @Request() req,
    @Param('showId') showId: string,
    @Param('seasonNumber') seasonNumber: string,
  ) {
    const user = req.user;
    const tvId = +showId;
    const sn = +seasonNumber;

    // 1) Advance the tracking pointer
    await this.svc.completeSeason(user, tvId, sn);

    // 2) Fetch all episodes for that season
    const { episodes } = await this.showsSvc.getSeasonEpisodes(tvId, sn);

    // 3) Record each one in history
    await Promise.all(
      episodes.map((ep) =>
        this.historySvc.markEpisode(
          user,
          tvId,
          sn,
          ep.episode_number,
          undefined, // optional showName
          ep.name, // episodeName
        ),
      ),
    );

    return { success: true };
  }

  /** Mark entire show as watched */
  @Post('show/:showId/complete')
  async completeShow(@Request() req, @Param('showId') showId: string) {
    const user = req.user;
    const tvId = +showId;

    // 1) Advance the tracking pointer to last episode
    await this.svc.completeShow(user, tvId);

    // 2) Fetch all seasons and their episodes
    const showDetails = await this.showsSvc.getDetails(tvId);
    for (const season of showDetails.seasons || []) {
      // optionally skip specials:
      if (season.season_number === 0) continue;

      const { episodes } = await this.showsSvc.getSeasonEpisodes(
        tvId,
        season.season_number,
      );

      // 3) Record each in history
      await Promise.all(
        episodes.map((ep) =>
          this.historySvc.markEpisode(
            user,
            tvId,
            season.season_number,
            ep.episode_number,
            undefined,
            ep.name,
          ),
        ),
      );
    }

    return { success: true };
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    return this.svc.update(req.user, +id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.svc.remove(req.user, +id);
  }
}
