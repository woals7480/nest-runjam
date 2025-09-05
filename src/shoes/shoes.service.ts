import { Injectable } from '@nestjs/common';
import { CreateShoeDto } from './dto/create-shoe.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShoeModel } from './entity/shoes.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ShoesService {
  constructor(
    @InjectRepository(ShoeModel)
    private readonly shoeRepository: Repository<ShoeModel>,
  ) {}

  createShoe(userId: string, dto: CreateShoeDto) {
    const shoe = this.shoeRepository.create({ ...dto, userId });
    return this.shoeRepository.save(shoe);
  }
}
