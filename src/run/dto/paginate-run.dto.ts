import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class PaginateRunDto {
  @IsOptional()
  @IsString()
  // base64 형태(간단 검증). 엄격히 하려면 커스텀 validator로 파싱까지 검사해도 됨
  @Matches(/^[A-Za-z0-9+/=_-]+$/, { message: '잘못된 커서 형식입니다.' })
  cursor?: string;

  @IsNumber()
  @IsOptional()
  take: number = 10;
}
