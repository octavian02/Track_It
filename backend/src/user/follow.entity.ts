// src/user/follow.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Column,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
@Unique(['follower', 'following'])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.following, { onDelete: 'CASCADE' })
  follower: User;

  @ManyToOne(() => User, (u) => u.followers, { onDelete: 'CASCADE' })
  following: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
