import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './genre.entity';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly repo: Repository<Genre>,
  ) {}

  async findOrCreate(tmdbGenreId: number, name: string): Promise<Genre> {
    let genre = await this.repo.findOne({ where: { tmdbGenreId } });
    if (!genre) {
      genre = this.repo.create({ tmdbGenreId, name });
      genre = await this.repo.save(genre);
    }
    return genre;
  }
}
