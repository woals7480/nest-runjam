import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { AccessPayload, RefreshPayload } from './dto/jwt.dto';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_JWT, REFRESH_JWT } from './const/auth.token';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(ACCESS_JWT) private readonly accessJwt: JwtService,
    @Inject(REFRESH_JWT) private readonly refreshJwt: JwtService,
  ) {}

  async register(user: RegisterUserDto) {
    const newUser = await this.usersService.create(user);
    return this.usersService.sanitize(newUser);
  }

  async validate(loginUser: LoginUserDto) {
    const user = await this.usersService.findByEmail(loginUser.email);
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 사용자압니다.');
    }

    const passOk = await bcrypt.compare(loginUser.password, user.password);
    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
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

  verifyRefresh(token: string): RefreshPayload {
    try {
      const p = this.refreshJwt.verify<RefreshPayload>(token);
      if (p.type !== 'refresh') throw new Error('잘못된 토큰 유형입니다.');
      return p;
    } catch {
      throw new UnauthorizedException(
        '리프레시 토큰이 만료되었거나 유효하지 않습니다.',
      );
    }
  }
}
