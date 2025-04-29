import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, TmdbResult, DiscoverFilters } from './search.service';

export interface Genre {
  id: number;
  name: string;
}

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** Simple “type-ahead” search box (optional) */
  @Get()
  async search(@Query('q') q: string): Promise<{ results: TmdbResult[] }> {
    return this.searchService.search(q);
  }

  /** Fetch genres for the dropdown */
  @Get('genres')
  async getGenres(
    @Query('mediaType') mediaType: 'movie' | 'tv',
  ): Promise<Genre[]> {
    return this.searchService.getGenres(mediaType);
  }

  /** Advanced filters → TMDb Discover */
  @Get('discover')
  async discover(
    @Query('mediaType') mediaType: 'movie' | 'tv',
    @Query('genres') genres?: string,
    @Query('releaseFrom') releaseFrom?: string,
    @Query('releaseTo') releaseTo?: string,
    @Query('voteGte') voteGte?: string,
    @Query('sortBy') sortBy?: string,
  ): Promise<{ results: TmdbResult[] }> {
    const filters: DiscoverFilters = {
      genres,
      releaseFrom,
      releaseTo,
      voteGte,
      sortBy,
    };
    return this.searchService.discover(mediaType, filters);
  }
}
