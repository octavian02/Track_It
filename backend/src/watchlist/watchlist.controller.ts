// src/watchlist/watchlist.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Request,
  UseGuards,
  Body,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { MediaType } from './watchlist.entity';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private svc: WatchlistService) {}

  @Get()
  list(@Request() req) {
    return this.svc.getWatchlist(req.user);
  }

  @Post(':mediaId')
  add(
    @Request() req,
    @Param('mediaId') mediaId: string,
    @Body('mediaName') mediaName: string,
    @Body('mediaType') mediaType: MediaType,
  ) {
    return this.svc.addToWatchlist(req.user, +mediaId, mediaName, mediaType);
  }

  @Delete(':mediaId')
  remove(@Request() req, @Param('mediaId') mediaId: string) {
    return this.svc.removeFromWatchlist(req.user, +mediaId);
  }
}
