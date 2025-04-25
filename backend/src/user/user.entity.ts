import { Rating } from 'src/ratings/rating.entity';
import { TrackAppBaseEntity } from 'src/shared/entities/trackapp-base.entity';
import { WatchlistItem } from 'src/watchlist/watchlist.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity()
export class User extends TrackAppBaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar' })
  username: string;

  @Column()
  password: string;

  @OneToMany(() => WatchlistItem, (item) => item.user)
  watchlist: WatchlistItem[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];
}
