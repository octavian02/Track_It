// src/shows/shows.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShowsService } from './shows.service';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get('trending')
  async getTrending() {
    return await this.showsService.getTrending();
  }

  @Get('popular')
  async getPopular() {
    return await this.showsService.getPopular();
  }

  @Get('top-rated')
  async getTopRated() {
    return await this.showsService.getTopRated();
  }

  @Get('airing-today')
  async getAiringToday() {
    return await this.showsService.getAiringToday();
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return await this.showsService.getDetails(+id);
  }

  @Get(':id/credits')
  async getCredits(@Param('id') id: string) {
    return await this.showsService.getCredits(+id);
  }

  @Get(':id/aggregate_credits')
  async getAggregateCredits(@Param('id') id: string) {
    return await this.showsService.getAggregateCredits(+id);
  }

  @Get(':id/videos')
  async getVideos(@Param('id') id: string) {
    return await this.showsService.getVideos(+id);
  }

  @Get()
  async search(@Query('q') q: string) {
    return await this.showsService.search(q);
  }
}
