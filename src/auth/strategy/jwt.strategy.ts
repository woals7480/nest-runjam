import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { JwtPayload } from '../dto/jwt.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    const cookieExtractor = (req: Request) => {
      const name = config.get<string>('COOKIE_NAME') ?? 'access_token';
      return req?.cookies?.[name] ?? null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });

    if (!config.get<string>('JWT_SECRET')) {
      throw new Error('Missing JWT_SECRET environment variable');
    }
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
