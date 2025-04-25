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

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private svc: WatchlistService) {}

  @Get()
  list(@Request() req) {
    return this.svc.getWatchlist(req.user);
  }

  @Post(':movieId')
  add(
    @Request() req,
    @Param('movieId') movieId: string,
    @Body('movieTitle') movieTitle: string,
  ) {
    return this.svc.addToWatchlist(req.user, +movieId, movieTitle);
  }

  @Delete(':movieId')
  remove(@Request() req, @Param('movieId') movieId: string) {
    return this.svc.removeFromWatchlist(req.user, +movieId);
  }
}
