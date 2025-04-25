// src/ratings/rating.entity.ts
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
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.ratings, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @Column({ nullable: true })
  mediaId: number;

  @Column()
  @Column({ nullable: true })
  mediaName: string;

  @Column({ type: 'enum', enum: ['movie', 'tv'], default: 'movie' })
  mediaType: MediaType;

  @Column('numeric', { precision: 3, scale: 1, default: 0 })
  score: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ratedAt: Date;
}
