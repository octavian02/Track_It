import {
  Controller,
  Post,
  Get,
  Request,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private svc: RatingsService) {}

  @Get()
  list(@Request() req) {
    return this.svc.getUserRatings(req.user);
  }

  @Get(':movieId')
  get(@Request() req, @Param('movieId') movieId: string) {
    return this.svc.getRating(req.user, +movieId);
  }

  @Post(':movieId')
  set(
    @Request() req,
    @Param('movieId') movieId: string,
    @Body('score') score: number,
  ) {
    return this.svc.setRating(req.user, +movieId, score);
  }
}
