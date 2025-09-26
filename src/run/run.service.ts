import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRunDto } from './dto/create-run.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RunModel } from './entity/run.entity';
import {
  Brackets,
  DataSource,
  FindOptionsWhere,
  LessThan,
  Repository,
} from 'typeorm';
import { parseHmsToSec, parseYmdHmToDate } from 'src/common/format/time-format';
import { ShoeMileageModel } from 'src/shoes/entity/shoe-mileage.entity';
import { ShoeModel } from 'src/shoes/entity/shoes.entity';
import { UpdateRunDto } from './dto/update-run.dto';
import { PaginateRunDto } from './dto/paginate-run.dto';
import { decodeRunCursor, encodeRunCursor, RunCursor } from './utils/cursor';

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

  // 기존 pagination
  async cursorPaginateRuns(query: PaginateRunDto, userId: string) {
    const take = query.take;
    const cursor: RunCursor | null = query.cursor
      ? decodeRunCursor(query.cursor)
      : null;
    let whereClause: FindOptionsWhere<RunModel> | FindOptionsWhere<RunModel>[];

    if (cursor) {
      whereClause = [
        { userId, runAt: LessThan(cursor.runAt) },
        { userId, runAt: cursor.runAt, id: LessThan(cursor.id) },
      ];
    } else {
      whereClause = { userId };
    }

    const rows = await this.runRepository.find({
      where: whereClause,
      order: { runAt: 'DESC', id: 'DESC' },
      relations: {
        mileage: {
          shoe: true,
        },
      },
      take: take + 1,
    });

    const hasNextPage = rows.length > take;
    const items = hasNextPage ? rows.slice(0, take) : rows;

    const nextCursor =
      hasNextPage && items.length > 0
        ? encodeRunCursor({
            runAt: items[items.length - 1].runAt,
            id: items[items.length - 1].id,
          })
        : null;

    // 합계는 QB로 안전하게(아래처럼 제네릭으로 raw 타입 고정)
    const raw = await this.runRepository
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.distance), 0)', 'sum')
      .where('r.userId = :userId', { userId })
      .getRawOne<{ sum: string }>();

    const totalDistance = Number(raw?.sum ?? 0);

    return {
      items,
      pageInfo: { hasNextPage, nextCursor, take },
      totalDistance,
    };
  }

  // run에 신발 정보 포함 cursor pagination
  async cursorPaginateRunsAndShoe(query: PaginateRunDto, userId: string) {
    const take = query.take;
    const cursor: RunCursor | null = query.cursor
      ? decodeRunCursor(query.cursor)
      : null;

    const qb = this.runRepository
      .createQueryBuilder('run')
      .where('run.userId = :userId', { userId })
      .leftJoin('run.mileages', 'm')
      // 🔴 핵심: ON 절로 매핑 대상 명시
      .leftJoinAndMapOne('run.shoe', ShoeModel, 'shoe', 'shoe.id = m.shoeId')
      // shoe는 조인 엔티티이므로 필요한 컬럼을 선택해 줍니다.
      .addSelect(['shoe.id', 'shoe.brand', 'shoe.model', 'shoe.nickname'])
      .orderBy({ 'run.runAt': 'DESC', 'run.id': 'DESC' })
      .take(take + 1);

    // 커서 조건: (runAt < cursor.runAt) OR (runAt = cursor.runAt AND id < cursor.id)
    if (cursor) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('run.runAt < :cursorRunAt', {
            cursorRunAt: cursor.runAt,
          }).orWhere(
            new Brackets((w2) => {
              w2.where('run.runAt = :cursorRunAt', {
                cursorRunAt: cursor.runAt,
              }).andWhere('run.id < :cursorId', { cursorId: cursor.id });
            }),
          );
        }),
      );
    }

    const rows = await qb.getMany();

    const hasNextPage = rows.length > take;
    const items = hasNextPage ? rows.slice(0, take) : rows;

    const nextCursor =
      hasNextPage && items.length > 0
        ? encodeRunCursor({
            runAt: items[items.length - 1].runAt,
            id: items[items.length - 1].id,
          })
        : null;

    // 합계 쿼리는 기존 그대로
    const raw = await this.runRepository
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.distance), 0)', 'sum')
      .where('r.userId = :userId', { userId })
      .getRawOne<{ sum: string }>();

    const totalDistance = Number(raw?.sum ?? 0);

    return {
      items, // 각 item: run + shoe(가상필드). mileages는 로드되지 않음
      pageInfo: { hasNextPage, nextCursor, take },
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
