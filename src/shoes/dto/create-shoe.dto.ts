import { PickType } from '@nestjs/mapped-types';
import { ShoeModel } from '../entity/shoes.entity';

export class CreateShoeDto extends PickType(ShoeModel, [
  'brand',
  'model',
  'nickname',
]) {}
