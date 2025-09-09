import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateShoeDto } from './dto/create-shoe.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShoeModel } from './entity/shoes.entity';
import { DataSource, Repository } from 'typeorm';
import { RunModel } from 'src/run/entity/run.entity';
import { ShoeMileageModel } from './entity/shoe-mileage.entity';
import { UpdateShoeDto } from './dto/update-shoe.dto';

@Injectable()
export class ShoesService {
  constructor(
    @InjectRepository(ShoeModel)
    private readonly shoeRepository: Repository<ShoeModel>,
    @InjectRepository(RunModel)
    private readonly runRepository: Repository<RunModel>,
    @InjectRepository(ShoeMileageModel)
    private readonly mileageRepository: Repository<ShoeMileageModel>,
    private readonly datasource: DataSource,
  ) {}

  async findShoes(userId: string) {
    const shoes = await this.shoeRepository.find({
      where: {
        userId,
      },
    });

    return shoes;
  }

  createShoe(userId: string, dto: CreateShoeDto) {
    const shoe = this.shoeRepository.create({ ...dto, userId });
    return this.shoeRepository.save(shoe);
  }

  async deleteShoe(shoeId: string) {
    const shoe = await this.shoeRepository.findOne({
      where: {
        id: shoeId,
      },
    });

    if (!shoe) {
      throw new NotFoundException('신발을 찾을 수 없습니다.');
    }

    await this.shoeRepository.delete(shoeId);

    return { deletedId: shoeId };
  }

  /** Run을 Shoe에 연결: totalMileageKm += run.distanceKm */
  async linkRunToShoe(shoeId: string, runId: string) {
    return this.datasource.transaction(async (m) => {
      const shoe = await m.findOne(ShoeModel, { where: { id: shoeId } });
      if (!shoe) {
        throw new NotFoundException('신발을 찾을 수 없습니다.');
      }

      const run = await m.findOne(RunModel, { where: { id: runId } });
      if (!run) {
        throw new NotFoundException('러닝기록(Run)을 찾을 수 없습니다.');
      }

      // 소유자 일치(옵션)
      if (shoe.userId !== run.userId) {
        throw new ForbiddenException('Run과 Shoe의 userId가 일치해야 합니다.');
      }

      // 이미 연결되어 있나?
      const existing = await m.findOne(ShoeMileageModel, {
        where: { runId: run.id },
      });
      if (existing) {
        if (existing.shoeId === shoe.id) {
          return { shoe, mileage: existing, moved: false };
        }
        // 다른 신발에 연결되어 있으면 "이동" 케이스 처리
        await m.decrement(
          ShoeModel,
          { id: existing.shoeId },
          'totalMileage',
          run.distance,
        );
        existing.shoeId = shoe.id;
        await m.save(existing);
        await m.increment(
          ShoeModel,
          { id: shoe.id },
          'totalMileage',
          run.distance,
        );
        const updatedShoe = await m.findOneByOrFail(ShoeModel, { id: shoe.id });
        return { shoe: updatedShoe, mileage: existing, moved: true };
      }

      // 신규 연결
      const mileage = m.create(ShoeMileageModel, {
        shoeId: shoe.id,
        runId: run.id,
      });
      await m.save(mileage);
      await m.increment(
        ShoeModel,
        { id: shoe.id },
        'totalMileage',
        run.distance,
      );
      const updated = await m.findOneByOrFail(ShoeModel, { id: shoe.id });
      return { shoe: updated, mileage, moved: false };
    });
  }

  async unlinkRunFromShoe(mileageId: string) {
    return this.datasource.transaction(async (m) => {
      const mileage = await m.findOne(ShoeMileageModel, {
        where: { id: mileageId },
        relations: { run: true },
      });
      if (!mileage) throw new NotFoundException('마일리지을 찾을 수 없습니다.');

      await m.remove(mileage);
      await m.decrement(
        ShoeModel,
        { id: mileage.shoeId },
        'totalMileage',
        mileage.run.distance,
      );
      const updated = await m.findOneByOrFail(ShoeModel, {
        id: mileage.shoeId,
      });
      return { shoe: updated, removedId: mileageId };
    });
  }

  async updateShoe(shoeId: string, dto: UpdateShoeDto) {
    const shoe = await this.shoeRepository.findOne({ where: { id: shoeId } });

    if (!shoe) {
      throw new NotFoundException('신발을 찾을 수 없습니다.');
    }

    if (dto.brand) shoe.brand = dto.brand;
    if (dto.model) shoe.model = dto.model;
    if (dto.nickname) shoe.nickname = dto.nickname;

    return this.shoeRepository.save(shoe);
  }
}
