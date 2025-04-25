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
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.ratings, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  movieId: number;

  @Column('numeric', { precision: 3, scale: 1, default: 0 })
  score: number; // between 1.0 and 10.0

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ratedAt: Date;
}
