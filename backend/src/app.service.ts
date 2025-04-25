import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AppService {
  private readonly tmdbApiKey = process.env.TMDB_API_KEY;
  private readonly tmdbBaseUrl = 'https://api.themoviedb.org/3';

  async getTrendingMovies(): Promise<any> {
    const url = `${this.tmdbBaseUrl}/trending/movie/week?api_key=${this.tmdbApiKey}`;
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trending movies:', error);
      throw error;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
