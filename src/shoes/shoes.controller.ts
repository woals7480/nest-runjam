import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ShoesService } from './shoes.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateShoeDto } from './dto/create-shoe.dto';

@Controller('shoes')
export class ShoesController {
  constructor(private readonly shoesService: ShoesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  postShoe(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateShoeDto,
  ) {
    return this.shoesService.createShoe(req.user.id, dto);
  }
}
