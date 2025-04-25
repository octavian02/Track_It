import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/trending-movies')
  async getTrendingMovies() {
    return await this.appService.getTrendingMovies();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
