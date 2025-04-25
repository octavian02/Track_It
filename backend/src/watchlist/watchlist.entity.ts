// src/watchlist/watchlist.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

export type MediaType = 'movie' | 'tv';

@Entity()
@Unique(['user', 'mediaId'])
export class WatchlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.watchlist, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @Column({ nullable: true })
  mediaId: number;

  @Column()
  @Column({ nullable: true })
  mediaName: string;

  @Column({ type: 'enum', enum: ['movie', 'tv'], default: 'movie' })
  mediaType: MediaType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;
}
