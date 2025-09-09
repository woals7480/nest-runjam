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
import { ShoesService } from './shoes.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateShoeDto } from './dto/create-shoe.dto';
import { UpdateShoeDto } from './dto/update-shoe.dto';

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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteShoe(@Param('id') id: string) {
    return this.shoesService.deleteShoe(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  patchShoe(@Param('id') id: string, @Body() dto: UpdateShoeDto) {
    return this.shoesService.updateShoe(id, dto);
  }

  @Post(':id/mileages')
  postLinkRun(
    @Param('id') id: string,
    @Body()
    dto: {
      runId: string;
    },
  ) {
    return this.shoesService.linkRunToShoe(id, dto.runId);
  }

  @Post('mileages/:mileageId')
  postUnlinkRun(@Param('mileageId') mileageId: string) {
    return this.shoesService.unlinkRunFromShoe(mileageId);
  }
}
