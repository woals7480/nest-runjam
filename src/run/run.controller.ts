import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RunService } from './run.service';
import { CreateRunDto } from './dto/create-run.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UpdateRunDto } from './dto/update-run.dto';

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

  @Get()
  @UseGuards(JwtAuthGuard)
  getRuns(@Req() req: Request & { user: { id: string } }) {
    return this.runService.findRuns(req.user.id);
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
