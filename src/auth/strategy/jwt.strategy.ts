import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AccessPayload } from '../dto/jwt.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    const cookieExtractor = (req: Request) => {
      const name = config.get<string>('COOKIE_NAME_AT ') ?? 'access_token';
      return req?.cookies?.[name] ?? null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ACCESS_JWT_SECRET'),
    });

    if (!config.get<string>('ACCESS_JWT_SECRET')) {
      throw new Error('Missing ACCESS_JWT_SECRET environment variable');
    }
  }

  validate(payload: AccessPayload) {
    if (payload.type !== 'access') {
      return false;
    }
    return { id: payload.sub, email: payload.email };
  }
}
