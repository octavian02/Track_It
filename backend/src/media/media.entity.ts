// src/media/media.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Genre } from '../genres/genre.entity';

export enum MediaTypes {
  MOVIE = 'movie',
  TV = 'tv',
}

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tmdbId: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: MediaTypes })
  mediaType: MediaTypes;

  // timestamp pentru a ști când ai sincronizat genurile ultima oară
  @Column({ type: 'timestamp', nullable: true })
  genresLastSyncedAt: Date;

  @ManyToMany(() => Genre, (genre) => genre.media, { cascade: true })
  @JoinTable({
    name: 'media_genres',
    joinColumn: { name: 'media_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];
}
