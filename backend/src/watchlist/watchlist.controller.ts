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
  Query,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { MediaType } from './watchlist.entity';
import { WatchlistItemDto } from './dto/watchlist-item.dto';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private svc: WatchlistService) {}

  @Get()
  async list(
    @Request() req,
    @Query('userId') userId?: string,
  ): Promise<WatchlistItemDto[]> {
    const id = userId ? +userId : req.user.id;
    const raw = await this.svc.getWatchlistForUser(id);
    return raw.map((i) => ({
      mediaId: i.mediaId,
      mediaName: i.mediaName,
      mediaType: i.mediaType,
      dateAdded: i.addedAt, // map addedAt → dateAdded
    }));
  }

  @Post(':mediaId')
  async add(
    @Request() req,
    @Param('mediaId') mediaId: string,
    @Body('mediaName') mediaName: string,
    @Body('mediaType') mediaType: MediaType,
  ) {
    return await this.svc.addToWatchlist(
      req.user,
      +mediaId,
      mediaName,
      mediaType,
    );
  }

  @Delete(':mediaId')
  async remove(@Request() req, @Param('mediaId') mediaId: string) {
    return await this.svc.removeFromWatchlist(req.user, +mediaId);
  }
}
