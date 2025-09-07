import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { RunService } from './run.service';
import { CreateRunDto } from './dto/create-run.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

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

    console.log(dto);
    return this.runService.createRun(dto);
  }
}
