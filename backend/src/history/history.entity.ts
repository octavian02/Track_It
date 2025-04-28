// src/history/history.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

export type MediaType = 'movie' | 'episode';

@Entity()
@Unique(['user', 'mediaType', 'mediaId', 'seasonNumber', 'episodeNumber'])
export class History {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.history, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: ['movie', 'episode'] })
  mediaType: MediaType;

  /**
   * if mediaType = 'movie', this is movieId.
   * if mediaType = 'episode', this is showId.
   */
  @Column()
  mediaId: number;

  @Column({ nullable: true })
  mediaName?: string;

  @Column({ nullable: true })
  seasonNumber?: number;

  @Column({ nullable: true })
  episodeNumber?: number;

  // New: optionally store episode title when mediaType='episode'
  @Column({ nullable: true })
  episodeName?: string;

  @CreateDateColumn()
  watchedAt: Date;
}
