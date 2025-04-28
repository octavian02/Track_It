// src/movies/movies.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('trending')
  async getTrending() {
    return await this.moviesService.getTrending();
  }

  @Get('popular')
  async getPopular() {
    return await this.moviesService.getPopular();
  }

  @Get('top-rated')
  async getTopRated() {
    return await this.moviesService.getTopRated();
  }

  @Get('upcoming')
  async getUpcoming() {
    return await this.moviesService.getUpcoming();
  }

  @Get(':id/videos')
  async getVideos(@Param('id') id: string) {
    return await this.moviesService.getMovieVideos(+id);
  }

  @Get(':id/credits')
  async getCredits(@Param('id') id: string) {
    return await this.moviesService.getCredits(+id);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return await this.moviesService.getDetails(+id);
  }

  @Get()
  async search(@Query('q') q: string) {
    return await this.moviesService.search(q);
  }
}
