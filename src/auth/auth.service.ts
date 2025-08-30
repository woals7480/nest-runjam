import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './dto/jwt.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  signToken(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
