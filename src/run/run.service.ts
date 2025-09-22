import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRunDto } from './dto/create-run.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RunModel } from './entity/run.entity';
import { DataSource, Repository } from 'typeorm';
import { parseHmsToSec, parseYmdHmToDate } from 'src/common/format/time-format';
import { ShoeMileageModel } from 'src/shoes/entity/shoe-mileage.entity';
import { ShoeModel } from 'src/shoes/entity/shoes.entity';
import { UpdateRunDto } from './dto/update-run.dto';
import { PaginateRunDto } from './dto/paginate-run.dto';
import { decodeRunCursor, encodeRunCursor } from './utils/cursor';

@Injectable()
export class RunService {
  constructor(
    @InjectRepository(RunModel)
    private readonly runRepository: Repository<RunModel>,
    private readonly dataSource: DataSource,
  ) {}

  // async generatePosts(userId: string) {
  //   for (let i = 0; i < 9; i++) {
  //     await this.createRun({
  //       userId,
  //       runAt: `2025-07-1${i + 1} 14:23`,
  //       distance: 10.12 + i,
  //       duration: `01:2${i}:12`,
  //       note: `달리기 7월 저장 ${i + 1}`,
  //     });
  //   }
  // }

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
      order: {
        runAt: 'DESC',
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

  async cursorPaginateRuns(query: PaginateRunDto, userId: string) {
    const take = query.take;

    // 커서 해석
    const cursor = query.cursor ? decodeRunCursor(query.cursor) : null;

    // 키셋 조건
    const qb = this.runRepository
      .createQueryBuilder('r')
      .where('r.userId = :userId', { userId })
      .orderBy('r.runAt', 'DESC')
      .addOrderBy('r.id', 'DESC') // 동률 깨기
      .take(take + 1); // 다음 페이지 여부 판별용으로 1개 더

    if (cursor) {
      // (runAt < cursor.runAt) OR (runAt = cursor.runAt AND id < cursor.id)
      qb.andWhere(
        '(r.runAt < :cRunAt OR (r.runAt = :cRunAt AND r.id < :cId))',
        {
          cRunAt: cursor.runAt.toISOString(),
          cId: cursor.id,
        },
      );
    }

    const raw = await this.runRepository
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.distance), 0)', 'sum')
      .where('r.userId = :userId', { userId })
      .getRawOne<{ sum: string | null }>();

    const totalDistance = Number(raw?.sum ?? 0); // DECIMAL → number

    const rows = await qb.getMany();

    // hasNext 판단 (limit+1 전략)
    const hasNextPage = rows.length > take;
    const items = hasNextPage ? rows.slice(0, take) : rows;

    // nextCursor 생성
    const nextCursor =
      hasNextPage && items.length > 0
        ? encodeRunCursor({
            runAt: items[items.length - 1].runAt,
            id: items[items.length - 1].id,
          })
        : null;

    return {
      items,
      pageInfo: {
        hasNextPage,
        nextCursor,
        take,
      },
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
