// src/movies/movies.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MoviesService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: { api_key: process.env.TMDB_API_KEY },
    });
  }

  async getTrending(): Promise<any> {
    const { data } = await this.client.get('/trending/movie/week');
    return data;
  }

  async getPopular(): Promise<any> {
    const { data } = await this.client.get('/movie/popular');
    return data;
  }

  async getTopRated(): Promise<any> {
    const { data } = await this.client.get('/movie/top_rated');
    return data;
  }

  async getUpcoming(): Promise<any> {
    const { data } = await this.client.get('/movie/upcoming');
    return data;
  }

  async getDetails(id: number): Promise<any> {
    const { data } = await this.client.get(`/movie/${id}`);
    return data;
  }

  async search(query: string): Promise<any> {
    const { data } = await this.client.get('/search/movie', {
      params: { query },
    });
    return data;
  }

  async getCredits(id: number): Promise<any> {
    const { data } = await this.client.get(`/movie/${id}/credits`);
    return data;
  }

  async getMovieVideos(id: number): Promise<any> {
    const url = `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${process.env.TMDB_API_KEY}`;
    const { data } = await axios.get(url);
    return data;
  }
  c;
}
