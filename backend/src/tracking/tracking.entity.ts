import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('tracking')
@Unique(['user', 'showId'])
export class TrackingItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.history, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  showId: number;

  @Column()
  showName: string;

  @Column({ default: 1 })
  seasonNumber: number;

  @Column({ default: 0 })
  episodeNumber: number;

  @Column({ type: 'timestamp', nullable: true })
  nextAirDate: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
