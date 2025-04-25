import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
@Unique(['user', 'movieId'])
export class WatchlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.watchlist, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  movieId: number;

  @Column()
  movieTitle: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;
}
