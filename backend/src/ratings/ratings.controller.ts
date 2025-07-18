// src/ratings/ratings.controller.ts
import {
  Controller,
  Post,
  Get,
  Request,
  Param,
  Body,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { MediaType } from './rating.entity';
import { RatingItemDto } from './dto/rating-item.dto';
import { FeedItemDto } from './dto/feed-item.dto';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private svc: RatingsService) {}

  @Get()
  async list(
    @Request() req,
    @Query('userId') userId?: string,
  ): Promise<RatingItemDto[]> {
    const id = userId ? +userId : req.user.id;
    const raw = await this.svc.getRatingsForUser(id);
    return raw.map((r) => ({
      mediaId: r.mediaId,
      mediaName: r.mediaName,
      mediaType: r.mediaType,
      score: r.score,
      dateAdded: r.ratedAt, // map ratedAt → dateAdded
    }));
  }

  @Get('feed')
  async feed(
    @Request() req,
    @Query('limit', new DefaultValuePipe('8'), new ParseIntPipe()) take: number,
  ): Promise<FeedItemDto[]> {
    // at this point `take` is already a valid number
    return this.svc.getFeedForUser(req.user.id, take);
  }

  @Get(':mediaId')
  async get(@Request() req, @Param('mediaId') mediaId: string) {
    return await this.svc.getRating(req.user, +mediaId);
  }

  @Post(':mediaId')
  async set(
    @Request() req,
    @Param('mediaId') mediaId: string,
    @Body('mediaName') mediaName: string,
    @Body('mediaType') mediaType: MediaType,
    @Body('score') score: number,
  ) {
    return await this.svc.setRating(
      req.user,
      +mediaId,
      mediaName,
      mediaType,
      score,
    );
  }
}
