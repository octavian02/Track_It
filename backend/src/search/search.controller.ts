// backend/src/search/search.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, TmdbResult } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q: string): Promise<{ results: TmdbResult[] }> {
    return await this.searchService.search(q);
  }
}
