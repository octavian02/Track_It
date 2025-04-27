import { Rating } from 'src/ratings/rating.entity';
import { TrackAppBaseEntity } from 'src/shared/entities/trackapp-base.entity';
import { WatchlistItem } from 'src/watchlist/watchlist.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { Follow } from './follow.entity';

@Entity()
export class User extends TrackAppBaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true, unique: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'bytea', nullable: true })
  avatar?: Buffer;

  @OneToMany(() => WatchlistItem, (item) => item.user)
  watchlist: WatchlistItem[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

  @OneToMany(() => Follow, (f) => f.follower)
  following: Follow[];

  @OneToMany(() => Follow, (f) => f.following)
  followers: Follow[];
}
