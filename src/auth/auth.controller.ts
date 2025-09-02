import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from 'src/users/users.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly config: ConfigService,
  ) {}

  // ⬇️ 필요하면 한번만 읽어 캐싱해도 됨
  private get isProd() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }
  private get AT() {
    return this.config.get<string>('COOKIE_NAME_AT') ?? 'access_token';
  }
  private get RT() {
    return this.config.get<string>('COOKIE_NAME_RT') ?? 'refresh_token';
  }
  private get cookieDomain() {
    // 서브도메인 공유가 필요할 때만 설정
    return this.config.get<string>('COOKIE_DOMAIN') || undefined;
  }

  // ⬇️ 전역 함수였던 것들을 인스턴스 메서드로 변경
  private setAccess(res: Response, token: string) {
    res.cookie(this.AT, token, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'none' : 'lax',
      path: '/',
      domain: this.cookieDomain,
      maxAge: 15 * 60 * 1000, // 15m
    });
  }
  private setRefresh(res: Response, token: string) {
    res.cookie(this.RT, token, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'none' : 'lax',
      path: '/',
      domain: this.cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
  }
  private clearCookies(res: Response) {
    const opt = {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'none' : 'lax',
      path: '/',
      domain: this.cookieDomain,
    } as const;
    res.clearCookie(this.AT, opt);
    res.clearCookie(this.RT, opt);
  }

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validate(dto);

    const accessToken = this.authService.signAccessToken(user.id, user.email);
    const refreshToken = this.authService.signRefreshToken(user.id);

    this.setAccess(res, accessToken);
    this.setRefresh(res, refreshToken);
    return this.userService.sanitize(user);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[this.RT];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const payload = this.authService.verifyRefresh(refreshToken as string);
    // 새 토큰들 발급(슬라이딩 만료)
    // 이메일은 DB조회로 보강(없으면 Access payload에 email 생략해도 무방)
    const user = await this.userService.findById(payload.sub);
    const newAccessToken = this.authService.signAccessToken(
      payload.sub,
      user?.email ?? '',
    );
    const newRefreshToken = this.authService.signRefreshToken(payload.sub);
    this.setAccess(res, newAccessToken);
    this.setRefresh(res, newRefreshToken);
    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearCookies(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user: { id: string } }) {
    const me = await this.userService.findById(req.user.id);
    return me;
  }
}
