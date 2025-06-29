// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './media.entity';
import { MediaService } from './media.service';
import { GenresModule } from 'src/genres/genre.module';
import { MoviesModule } from 'src/movies/movies.module';
import { ShowsModule } from 'src/shows/shows.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    GenresModule,
    MoviesModule,
    ShowsModule,
  ],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
