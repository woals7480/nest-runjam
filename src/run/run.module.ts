import { Module } from '@nestjs/common';
import { RunService } from './run.service';
import { RunController } from './run.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunModel } from './entity/run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RunModel])],
  controllers: [RunController],
  providers: [RunService],
})
export class RunModule {}
