import { Controller } from '@nestjs/common';
import { ShoesService } from './shoes.service';

@Controller('shoes')
export class ShoesController {
  constructor(private readonly shoesService: ShoesService) {}
}
