import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ShoesService } from './shoes.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateShoeDto } from './dto/create-shoe.dto';

@Controller('shoes')
export class ShoesController {
  constructor(private readonly shoesService: ShoesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getShoes(@Req() req: Request & { user: { id: string } }) {
    return this.shoesService.findShoes(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  postShoe(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateShoeDto,
  ) {
    return this.shoesService.createShoe(req.user.id, dto);
  }

  @Post(':shoeId/mileages')
  postLinkRun(
    @Param('shoeId') shoeId: string,
    @Body()
    dto: {
      runId: string;
    },
  ) {
    return this.shoesService.linkRunToShoe(shoeId, dto.runId);
  }

  @Post('mileages/:mileageId')
  postUnlinkRun(@Param('mileageId') mileageId: string) {
    return this.shoesService.unlinkRunFromShoe(mileageId);
  }
}
