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

const isProd = process.env.NODE_ENV === 'production';
const AT = process.env.COOKIE_NAME_AT || 'access_token';
const RT = process.env.COOKIE_NAME_RT || 'refresh_token';

function setAccess(res: Response, token: string) {
  res.cookie(AT, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 15, // 15m
  });
}
function setRefresh(res: Response, token: string) {
  res.cookie(RT, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7d (예시)
  });
}
function clearCookies(res: Response) {
  const opt = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  } as const;
  res.clearCookie(AT, opt);
  res.clearCookie(RT, opt);
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto.email, dto.password, dto.nickname);
  }

  @Post('login')
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validate(dto.email, dto.password);
    // const token = this.authService.signToken(user.id, user.email);

    // const isProd = process.env.NODE_ENV === 'production';
    // const cookieName = process.env.COOKIE_NAME || 'access_token';

    // res.cookie(cookieName, token, {
    //   httpOnly: true,
    //   secure: isProd,
    //   sameSite: isProd ? 'none' : 'lax',
    //   path: '/',
    //   domain: process.env.COOKIE_DOMAIN || undefined,
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    const accessToken = this.authService.signAccessToken(user.id, user.email);
    const refreshToken = this.authService.signRefreshToken(user.id);

    setAccess(res, accessToken);
    setRefresh(res, refreshToken);
    return this.userService.sanitize(user);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const payload = await this.authService.verifyRefreshOrThrow(refreshToken);
    // 새 토큰들 발급(슬라이딩 만료)
    // 이메일은 DB조회로 보강(없으면 Access payload에 email 생략해도 무방)
    const user = await this.userService.findByEmail(
      (req as any).user?.email ?? '',
    );
    const newAccessToken = this.authService.signAccessToken(
      payload.sub,
      user?.email ?? '',
    );
    const newRefreshToken = this.authService.signRefreshToken(payload.sub);
    setAccess(res, newAccessToken);
    setRefresh(res, newRefreshToken);
    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearCookies(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: { id: string } }) {
    const me = this.userService.findById(req.user.id);
    return me;
  }
}
