import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Follow)
    private followsRepo: Repository<Follow>,
  ) {}

  findAll() {
    return this.usersRepo.find();
  }

  findOne(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  async findOneById(id: number): Promise<User> {
    const u = await this.usersRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException(`User with id ${id} not found`);
    return u;
  }

  async createUser(dto: CreateUserDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const displayName = dto.displayName?.trim() || dto.username;
    const u = this.usersRepo.create({
      email: dto.email,
      username: dto.username,
      password: hash,
      displayName,
    });
    return this.usersRepo.save(u);
  }

  async validateUser(email: string, password: string) {
    const u = await this.usersRepo.findOne({ where: { email } });
    if (u && (await bcrypt.compare(password, u.password))) {
      return u;
    }
    return null;
  }

  async updateProfile(
    userId: number,
    dto: UpdateUserDto,
    avatarBuffer?: Buffer,
  ): Promise<User> {
    const user = await this.usersRepo.findOneByOrFail({ id: userId });

    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.bio !== undefined) user.bio = dto.bio;

    if (avatarBuffer) {
      user.avatar = avatarBuffer;
    }

    return this.usersRepo.save(user);
  }

  async findByUsername(username: string): Promise<User> {
    const u = await this.usersRepo.findOne({ where: { username } });
    if (!u) throw new NotFoundException(`User "${username}" not found`);
    return u;
  }

  searchUsers(q: string) {
    return this.usersRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.username', 'u.displayName', 'u.avatar'])
      .where('u.username ILIKE :q OR u.displayName ILIKE :q', { q: `%${q}%` })
      .limit(20)
      .getMany();
  }

  async getProfile(viewerId: number, userId: number) {
    const u = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'displayName', 'avatar', 'bio'],
    });
    if (!u) throw new NotFoundException('User not found');

    const [followersCount, followingCount] = await Promise.all([
      this.followsRepo.count({ where: { following: { id: userId } } }),
      this.followsRepo.count({ where: { follower: { id: userId } } }),
    ]);
    const isFollowing = !!(await this.followsRepo.findOne({
      where: { follower: { id: viewerId }, following: { id: userId } },
    }));

    return { ...u, followersCount, followingCount, isFollowing };
  }

  async followUser(followerId: number, targetId: number) {
    if (followerId === targetId) throw new Error("Can't follow yourself");
    const f = this.followsRepo.create({
      follower: { id: followerId },
      following: { id: targetId },
    });
    return this.followsRepo.save(f);
  }

  async unfollowUser(followerId: number, targetId: number) {
    await this.followsRepo.delete({
      follower: { id: followerId },
      following: { id: targetId },
    });
    return { success: true };
  }

  // NEW: list followers / following
  async listFollowers(userId: number) {
    const rels = await this.followsRepo.find({
      where: { following: { id: userId } },
      relations: ['follower'],
    });
    return rels.map((r) => r.follower);
  }
  async listFollowing(userId: number) {
    const rels = await this.followsRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
    return rels.map((r) => r.following);
  }

  async getAvatarBuffer(userId: number): Promise<Buffer | null> {
    const u = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['avatar'], // only select the BLOB column
    });
    return u?.avatar || null;
  }
}
