import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { AccessPayload, RefreshPayload } from './dto/jwt.dto';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_JWT, REFRESH_JWT } from './const/auth.token';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(ACCESS_JWT) private readonly accessJwt: JwtService,
    @Inject(REFRESH_JWT) private readonly refreshJwt: JwtService,
  ) {}

  async register(email: string, password: string, nickname: string) {
    const user = await this.usersService.create(email, password, nickname);
    return this.usersService.sanitize(user);
  }

  async validate(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일/비밀번호를 확인하세요.');
    }

    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) {
      throw new UnauthorizedException('이메일/비밀번호를 확인하세요.');
    }
    return user;
  }

  // signToken(userId: string, email: string) {
  //   const payload: JwtPayload = { sub: userId, email };
  //   return this.jwtService.sign(payload);
  // }

  signAccessToken(userId: string, email: string) {
    const payload: AccessPayload = { sub: userId, email, type: 'access' };
    return this.accessJwt.sign(payload);
  }

  signRefreshToken(userId: string) {
    const jwtid = crypto.randomUUID();
    const payload: RefreshPayload = { sub: userId, jwtid, type: 'refresh' };
    return this.refreshJwt.sign(payload);
  }

  async verifyRefreshOrThrow(token: string): Promise<RefreshPayload> {
    try {
      const p = await this.refreshJwt.verifyAsync<RefreshPayload>(token);
      if (p.type !== 'refresh') throw new Error('wrong type');
      return p;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
