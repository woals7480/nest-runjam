import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRunDto } from './dto/create-run.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RunModel } from './entity/run.entity';
import { DataSource, Repository } from 'typeorm';
import { parseHmsToSec, parseYmdHmToDate } from 'src/common/format/time-format';
import { ShoeMileageModel } from 'src/shoes/entity/shoe-mileage.entity';
import { ShoeModel } from 'src/shoes/entity/shoes.entity';
import { UpdateRunDto } from './dto/update-run.dto';

@Injectable()
export class RunService {
  constructor(
    @InjectRepository(RunModel)
    private readonly runRepository: Repository<RunModel>,
    private readonly dataSource: DataSource,
  ) {}

  createRun(dto: CreateRunDto & { userId: string }) {
    const run = this.runRepository.create({
      userId: dto.userId,
      runAt: parseYmdHmToDate(dto.runAt),
      distance: dto.distance,
      durationSec: parseHmsToSec(dto.duration),
      note: dto.note,
    });

    return this.runRepository.save(run);
  }

  async findRuns(userId: string) {
    const runs = await this.runRepository.find({
      where: {
        userId,
      },
      relations: {
        mileages: true,
      },
    });

    const raw = await this.runRepository
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.distance), 0)', 'sum')
      .where('r.userId = :userId', { userId })
      .getRawOne<{ sum: string | null }>();

    const totalDistance = Number(raw?.sum ?? 0); // DECIMAL → number

    return {
      items: runs,
      totalDistance,
    };
  }

  updateRun(id: string, dto: UpdateRunDto) {
    return this.dataSource.transaction(async (m) => {
      const run = await m.findOne(RunModel, { where: { id } });
      if (!run) {
        throw new NotFoundException('달리기 기록을 찾을 수 없습니다.');
      }

      const prevDistance = run.distance;
      const prevDuration = run.durationSec;

      if (dto.runAt) {
        run.runAt = parseYmdHmToDate(dto.runAt);
      }

      if (dto.distance) {
        run.distance = dto.distance;
      }

      if (dto.duration) {
        run.durationSec = parseHmsToSec(dto.duration);
      }

      if (dto.note) {
        run.note = dto.note;
      }

      await m.save(run);

      if (dto.distance && dto.distance !== prevDistance) {
        const mileage = await m.findOne(ShoeMileageModel, {
          where: { runId: run.id },
        });

        if (mileage) {
          const delta = run.distance - prevDistance;

          if (delta !== 0) {
            await m.increment(
              ShoeModel,
              { id: mileage.shoeId },
              'totalMileage',
              delta,
            );
          }
        }
      }

      return run;
    });
  }

  deleteRun(id: string) {
    return this.dataSource.transaction(async (m) => {
      const run = await m.findOne(RunModel, { where: { id } });

      if (!run) {
        throw new NotFoundException('달리기 기록을 찾을 수 없습니다.');
      }

      const mileage = await m.findOne(ShoeMileageModel, {
        where: { runId: run.id },
      });

      if (mileage) {
        await m.decrement(
          ShoeModel,
          { id: mileage.shoeId },
          'totalMileage',
          run.distance,
        );

        // 링크 행 삭제 (Run 삭제 시 CASCADE여도, 명시적으로 지워도 OK)
        await m.delete(ShoeMileageModel, { id: mileage.id });
      }

      await m.delete(RunModel, { id: run.id });

      return { ok: true, removedId: id, shoeUpdated: !!mileage };
    });
  }
}
