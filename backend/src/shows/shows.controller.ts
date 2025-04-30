// src/shows/shows.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShowsService } from './shows.service';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get('random')
  async getRandom() {
    return await this.showsService.getRandom();
  }

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

  @Get(':id/similar')
  async getSimilar(@Param('id') id: string) {
    return this.showsService.getSimilarShows(+id);
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

  @Get(':id/avg-runtime')
  async avgRuntime(@Param('id') id: string) {
    const avg = await this.showsService.getAverageEpisodeRuntime(+id);
    return { averageRuntime: avg };
  }

  @Get()
  async search(@Query('q') q: string) {
    return await this.showsService.search(q);
  }

  @Get(':id/seasons/:seasonNumber')
  async getSeasonEpisodes(
    @Param('id') id: string,
    @Param('seasonNumber') seasonNumber: string,
  ) {
    return this.showsService.getSeasonEpisodes(+id, +seasonNumber);
  }
  /** New: get a single episode’s details */
  @Get(':id/seasons/:seasonNumber/episodes/:episodeNumber')
  async getEpisodeDetail(
    @Param('id') id: string,
    @Param('seasonNumber') seasonNumber: string,
    @Param('episodeNumber') episodeNumber: string,
  ) {
    return this.showsService.getEpisodeDetail(
      +id,
      +seasonNumber,
      +episodeNumber,
    );
  }
}
