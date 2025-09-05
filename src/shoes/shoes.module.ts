import { Module } from '@nestjs/common';
import { ShoesService } from './shoes.service';
import { ShoesController } from './shoes.controller';
import { ShoeModel } from './entity/shoes.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ShoeModel])],
  controllers: [ShoesController],
  providers: [ShoesService],
})
export class ShoesModule {}
