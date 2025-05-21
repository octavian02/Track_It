// src/history/history.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
  UpdateDateColumn,
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

  @Column()
  mediaId: number;

  @Column({ nullable: true })
  mediaName?: string;

  @Column({ nullable: true })
  seasonNumber?: number;

  @Column({ nullable: true })
  episodeNumber?: number;

  @Column({ nullable: true })
  episodeName?: string;

  @Column({ type: 'int', default: 0 })
  runtimeMinutes: number;

  @Column({ type: 'int', default: 1 })
  watchCount: number;

  @CreateDateColumn()
  firstWatchedAt: Date;

  @UpdateDateColumn()
  lastWatchedAt: Date;
}
