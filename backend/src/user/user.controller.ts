// src/user/user.controller.ts
import {
  Controller,
  Body,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ─── Signup / Login ────────────────────────────────────────────────────────
  @Post('signup')
  signup(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.userService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  // ─── Protected: Profile ────────────────────────────────────────────────────

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  getOwnProfile(@Request() req) {
    console.log('🛡 getOwnProfile called, req.user →', req.user);
    return this.userService.getProfile(req.user.id, req.user.id);
  }

  // in getByUsername
  @Get(':username/profile')
  @UseGuards(JwtAuthGuard)
  async getByUsername(@Request() req, @Param('username') username: string) {
    console.log('🛡 getByUsername called, params.username →', username);
    const target = await this.userService.findByUsername(username);
    console.log('   found target.id →', target.id);
    return this.userService.getProfile(req.user.id, target.id);
  }

  // ─── Protected: Update own profile ────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateOwnProfile(@Request() req, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  // ─── Follow / Unfollow ────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  followUser(@Request() req, @Param('id') id: string) {
    return this.userService.followUser(req.user.id, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  unfollowUser(@Request() req, @Param('id') id: string) {
    return this.userService.unfollowUser(req.user.id, +id);
  }

  // ─── Followers / Following Lists ──────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get(':id/followers')
  listFollowers(@Param('id') id: string) {
    return this.userService.listFollowers(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/following')
  listFollowing(@Param('id') id: string) {
    return this.userService.listFollowing(+id);
  }

  // ─── Search & List All (optional) ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query('search') q?: string) {
    return q?.trim() ? this.userService.searchUsers(q) : [];
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }
}
