import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AccessPayload } from '../dto/jwt.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    const cookieExtractor = (req: Request) => {
      const name = config.get<string>('COOKIE_NAME_AT') ?? 'access_token';
      return req?.cookies?.[name] ?? null;
    };

    if (!config.get<string>('ACCESS_JWT_SECRET')) {
      throw new Error('ACCESS_JWT_SECRET 환경변수가 설정되지 않았습니다.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ACCESS_JWT_SECRET'),
    });
  }

  validate(payload: AccessPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Access 토큰이 아닙니다.');
    }

    return { id: payload.sub, email: payload.email };
  }
}
