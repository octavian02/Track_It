// src/genres/genre.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Media } from '../media/media.entity';

@Entity()
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tmdbGenreId: number;

  @Column()
  name: string;

  @ManyToMany(() => Media, (media) => media.genres)
  media: Media[];
}
