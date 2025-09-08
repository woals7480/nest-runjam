import { Module } from '@nestjs/common';
import { ShoesService } from './shoes.service';
import { ShoesController } from './shoes.controller';
import { ShoeModel } from './entity/shoes.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoeMileageModel } from './entity/shoe-mileage.entity';
import { RunModel } from 'src/run/entity/run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShoeModel, ShoeMileageModel, RunModel])],
  controllers: [ShoesController],
  providers: [ShoesService],
})
export class ShoesModule {}
