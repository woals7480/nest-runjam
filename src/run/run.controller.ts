import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RunService } from './run.service';
import { CreateRunDto } from './dto/create-run.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UpdateRunDto } from './dto/update-run.dto';
import { PaginateRunDto } from './dto/paginate-run.dto';

@Controller('run')
export class RunController {
  constructor(private readonly runService: RunService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  postRun(
    @Req() req: Request & { user: { id: string } },
    @Body() body: CreateRunDto,
  ) {
    const dto = { ...body, userId: req.user.id };

    return this.runService.createRun(dto);
  }

  // @Get()
  // @UseGuards(JwtAuthGuard)
  // getRuns(@Req() req: Request & { user: { id: string } }) {
  //   return this.runService.findRuns(req.user.id);
  // }

  @Get()
  @UseGuards(JwtAuthGuard)
  getPaginateRuns(
    @Req() req: Request & { user: { id: string } },
    @Query() query: PaginateRunDto,
  ) {
    return this.runService.cursorPaginateRuns(query, req.user.id);
  }

  @Get('weekly')
  @UseGuards(JwtAuthGuard)
  getWeeklyRuns(
    @Req() req: Request & { user: { id: string } },
    @Query('date') date?: string, // 'YYYY-MM-DD' or ISO (기본: 오늘)
    @Query('tz') tz = 'Asia/Seoul', // 타임존 (기본 서울)
  ) {
    return this.runService.findWeeklyStats(req.user.id, { date, tz });
  }

  @Get('monthly')
  @UseGuards(JwtAuthGuard)
  monthly(
    @Req() req: Request & { user: { id: string } },
    @Query('year') year?: number,
    @Query('month') month?: number, // 1~12
    @Query('tz') tz = 'Asia/Seoul',
  ) {
    return this.runService.findMonthlyStats(req.user.id, {
      year,
      month,
      tz,
    });
  }

  @Get('yearly')
  @UseGuards(JwtAuthGuard)
  yearly(
    @Req() req: Request & { user: { id: string } },
    @Query('year') year?: number,
    @Query('tz') tz = 'Asia/Seoul',
  ) {
    console.log(year);
    return this.runService.findYearlyStats(req.user.id, {
      year,
      tz,
    });
  }

  @Get('overall')
  @UseGuards(JwtAuthGuard)
  overall(
    @Req() req: Request & { user: { id: string } },
    @Query('tz') tz = 'Asia/Seoul',
  ) {
    return this.runService.findOverallStats(req.user.id, { tz });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  patchRun(@Param('id') id: string, @Body() dto: UpdateRunDto) {
    return this.runService.updateRun(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteRun(@Param('id') id: string) {
    return this.runService.deleteRun(id);
  }
}
