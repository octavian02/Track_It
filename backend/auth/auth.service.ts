/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: CreateUserDto) {
    const user = await this.users.createUser(dto);
    const payload = { sub: user.id, username: user.username };
    return {
      user: { id: user.id, username: user.username, email: user.email },
      access_token: this.jwt.sign(payload),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.validateUser(email, password);
    if (!user) return null;
    // strip out password
    const { password: _, ...result } = user;
    return result;
  }

  /** Issue a signed JWT for a valid user object */
  async login(user: { id: number; username: string }) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwt.sign(payload),
    };
  }
}
