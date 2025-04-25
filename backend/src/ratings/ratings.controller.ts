// src/ratings/ratings.controller.ts
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
import { MediaType } from './rating.entity';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private svc: RatingsService) {}

  @Get()
  list(@Request() req) {
    return this.svc.getUserRatings(req.user);
  }

  @Get(':mediaId')
  get(@Request() req, @Param('mediaId') mediaId: string) {
    return this.svc.getRating(req.user, +mediaId);
  }

  @Post(':mediaId')
  set(
    @Request() req,
    @Param('mediaId') mediaId: string,
    @Body('mediaName') mediaName: string,
    @Body('mediaType') mediaType: MediaType,
    @Body('score') score: number,
  ) {
    return this.svc.setRating(req.user, +mediaId, mediaName, mediaType, score);
  }
}
