import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSummaryDto } from './dto/user-summary.dto';
import { Follow } from './follow.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
  ) {}

  async getFollowingIds(userId: number): Promise<number[]> {
    const rels = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
    return rels.map((r) => r.following.id);
  }

  async listFollowing(userId: number): Promise<UserSummaryDto[]> {
    const rels = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
    return rels.map((r) => {
      const u = r.following;
      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatar && `/user/${u.id}/avatar`,
      };
    });
  }
}
