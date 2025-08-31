import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategy/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ACCESS_JWT, REFRESH_JWT } from './const/auth.token';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => {
    //     const secret = config.get<string>('JWT_SECRET');
    //     if (!secret) throw new Error('Missing JWT_SECRET');
    //     return {
    //       secret, // HS256 기본
    //       signOptions: { expiresIn: config.get('JWT_EXPIRES') ?? '7d' },
    //     };
    //   },
    // }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: ACCESS_JWT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.get<string>('ACCESS_JWT_SECRET')!,
          signOptions: { expiresIn: config.get('ACCESS_TTL') ?? '15m' },
        }),
    },
    {
      provide: REFRESH_JWT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.get<string>('REFRESH_JWT_SECRET'),
          signOptions: { expiresIn: config.get('REFRESH_TTL') ?? '7d' },
        }),
    },
  ],
})
export class AuthModule {}
