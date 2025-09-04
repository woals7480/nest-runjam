import { Module } from '@nestjs/common';
import { ShoesService } from './shoes.service';
import { ShoesController } from './shoes.controller';

@Module({
  controllers: [ShoesController],
  providers: [ShoesService],
})
export class ShoesModule {}
