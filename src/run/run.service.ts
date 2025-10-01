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
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  startOfWeek,
  addDays,
  startOfDay,
  format,
  startOfMonth,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  startOfYear,
  addYears,
} from 'date-fns';
import {
  BarRaw,
  MonthlyOpts,
  OverallOpts,
  WeeklyOpts,
  YearlyOpts,
} from './dto/stats-run.dto';

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
  private getWeekRange(date?: string, tz = 'Asia/Seoul') {
    const base = date ? new Date(date) : new Date();
    const local = toZonedTime(base, tz);
    const mondayLocal = startOfDay(startOfWeek(local, { weekStartsOn: 1 }));
    const nextMondayLocal = addDays(mondayLocal, 7);

    const startLocalStr = format(mondayLocal, 'yyyy-MM-dd');
    const endLocalStr = format(addDays(nextMondayLocal, -1), 'yyyy-MM-dd');

    const startUtc = fromZonedTime(mondayLocal, tz);
    const endUtc = fromZonedTime(nextMondayLocal, tz);

    return { tz, startUtc, endUtc, startLocalStr, endLocalStr };
  }

  private getMonthRange(year?: number, month1to12?: number, tz = 'Asia/Seoul') {
    const now = toZonedTime(new Date(), tz);
    const y = year ?? Number(format(now, 'yyyy'));
    const m = month1to12 ?? Number(format(now, 'M'));
    const startLocal = startOfDay(startOfMonth(new Date(y, m - 1, 1)));
    const nextMonthLocal = addMonths(startLocal, 1);
    const days =
      differenceInCalendarDays(endOfMonth(startLocal), startLocal) + 1;
    return {
      tz,
      year: y,
      month: m,
      days,
      startUtc: fromZonedTime(startLocal, tz),
      endUtc: fromZonedTime(nextMonthLocal, tz),
      startLocalStr: format(startLocal, 'yyyy-MM-dd'),
      endLocalStr: format(addDays(nextMonthLocal, -1), 'yyyy-MM-dd'),
    };
  }

  private getYearRange(year?: number, tz = 'Asia/Seoul') {
    const now = toZonedTime(new Date(), tz);
    const y = year ?? Number(format(now, 'yyyy'));
    const startLocal = startOfDay(startOfYear(new Date(y, 0, 1)));
    const nextYearLocal = addYears(startLocal, 1);
    return {
      tz,
      year: y,
      startUtc: fromZonedTime(startLocal, tz),
      endUtc: fromZonedTime(nextYearLocal, tz),
    };
  }

  async findWeeklyStats(userId: string, opts: WeeklyOpts = {}) {
    const {
      tz = 'Asia/Seoul',
      startUtc,
      endUtc,
      startLocalStr,
      endLocalStr,
    } = this.getWeekRange(opts.date, opts.tz ?? 'Asia/Seoul');

    // 1) 일별 합계 (현지 날짜 기준)
    const barsRaw = await this.runRepository
      .createQueryBuilder('r')
      .select(`((r."runAt" AT TIME ZONE :tz)::date)`, 'd')
      .addSelect(`COALESCE(SUM(r."distance"), 0)`, 'km')
      .addSelect(`COALESCE(SUM(r."durationSec"), 0)`, 'sec')
      .addSelect(`COUNT(*)`, 'cnt')
      .where(`r."userId" = :userId`, { userId })
      .andWhere(`r."runAt" >= :start AND r."runAt" < :end`, {
        start: startUtc,
        end: endUtc,
      })
      .setParameter('tz', tz)
      .groupBy('d')
      .orderBy('d', 'ASC')
      .getRawMany<BarRaw>();

    // 2) 전체 요약
    const sumRaw = await this.runRepository
      .createQueryBuilder('r')
      .select(`COALESCE(SUM(r."distance"), 0)`, 'total_km')
      .addSelect(`COALESCE(SUM(r."durationSec"), 0)`, 'total_sec')
      .addSelect(`COUNT(*)`, 'run_count')
      .where(`r."userId" = :userId`, { userId })
      .andWhere(`r."runAt" >= :start AND r."runAt" < :end`, {
        start: startUtc,
        end: endUtc,
      })
      .getRawOne<{ total_km: string; total_sec: string; run_count: string }>();

    // 3) 월~일 7칸 생성 + 0채우기
    const map = new Map<string, number>(); // key: yyyy-MM-dd, value: km
    for (const r of barsRaw) {
      // d는 드라이버 설정에 따라 'YYYY-MM-DD' 문자열로 옵니다.
      map.set(String(r.d), Number(r.km ?? 0));
    }

    const labelsKo = ['월', '화', '수', '목', '금', '토', '일'];
    const bars = Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(new Date(startLocalStr), i);
      const key = format(d, 'yyyy-MM-dd');
      const km = map.get(key) ?? 0;
      return { label: labelsKo[i], km };
    });

    const totalKm = Number(sumRaw?.total_km ?? 0);
    const durationSec = Number(sumRaw?.total_sec ?? 0);
    const runCount = Number(sumRaw?.run_count ?? 0);
    const avgPaceSecPerKm =
      totalKm > 0 ? Math.round(durationSec / totalKm) : null;

    return {
      range: { start: startLocalStr, end: endLocalStr },
      summary: { totalKm, durationSec, runCount, avgPaceSecPerKm },
      bars,
    };
  }

  async findMonthlyStats(userId: string, opts: MonthlyOpts = {}) {
    const { tz, year, month, days, startUtc, endUtc, startLocalStr } =
      this.getMonthRange(opts.year, opts.month, opts.tz ?? 'Asia/Seoul');

    // 일별 합계
    const barsRaw = await this.runRepository
      .createQueryBuilder('r')
      .select(`((r."runAt" AT TIME ZONE :tz)::date)`, 'd')
      .addSelect(`COALESCE(SUM(r."distance"), 0)`, 'km')
      .where(`r."userId" = :userId`, { userId })
      .andWhere(`r."runAt" >= :start AND r."runAt" < :end`, {
        start: startUtc,
        end: endUtc,
      })
      .setParameter('tz', tz)
      .groupBy('d')
      .orderBy('d', 'ASC')
      .getRawMany<{ d: string; km: string }>();

    const sumRaw = await this.runRepository
      .createQueryBuilder('r')
      .select(`COALESCE(SUM(r."distance"), 0)`, 'total_km')
      .addSelect(`COALESCE(SUM(r."durationSec"), 0)`, 'total_sec')
      .addSelect(`COUNT(*)`, 'run_count')
      .where(`r."userId" = :userId`, { userId })
      .andWhere(`r."runAt" >= :start AND r."runAt" < :end`, {
        start: startUtc,
        end: endUtc,
      })
      .getRawOne<{ total_km: string; total_sec: string; run_count: string }>();

    // 1..days 채우기
    const map = new Map<string, number>();
    for (const r of barsRaw)
      map.set(format(r.d as unknown as Date, 'yyyy-MM-dd'), Number(r.km ?? 0));
    const first = new Date(startLocalStr);
    const bars = Array.from({ length: days }).map((_, i) => {
      const d = addDays(first, i);
      const key = format(d, 'yyyy-MM-dd');
      return { label: String(i + 1), km: map.get(key) ?? 0 };
    });

    const totalKm = Number(sumRaw?.total_km ?? 0);
    const durationSec = Number(sumRaw?.total_sec ?? 0);
    const runCount = Number(sumRaw?.run_count ?? 0);
    const avgPaceSecPerKm =
      totalKm > 0 ? Math.round(durationSec / totalKm) : null;

    return {
      year,
      month,
      summary: { totalKm, durationSec, runCount, avgPaceSecPerKm },
      bars,
    };
  }

  // ───────────────────────── 연간 ─────────────────────────
  async findYearlyStats(userId: string, opts: YearlyOpts = {}) {
    const { tz, year, startUtc, endUtc } = this.getYearRange(
      opts.year,
      opts.tz ?? 'Asia/Seoul',
    );

    // 월별 합계 (1~12)
    const barsRaw = await this.runRepository
      .createQueryBuilder('r')
      .select(`EXTRACT(MONTH FROM (r."runAt" AT TIME ZONE :tz))`, 'm')
      .addSelect(`COALESCE(SUM(r."distance"), 0)`, 'km')
      .where(`r."userId" = :userId`, { userId })
      .andWhere(`r."runAt" >= :start AND r."runAt" < :end`, {
        start: startUtc,
        end: endUtc,
      })
      .setParameter('tz', tz)
      .groupBy('m')
      .orderBy('m', 'ASC')
      .getRawMany<{ m: string; km: string }>();

    const sumRaw = await this.runRepository
      .createQueryBuilder('r')
      .select(`COALESCE(SUM(r."distance"), 0)`, 'total_km')
      .addSelect(`COALESCE(SUM(r."durationSec"), 0)`, 'total_sec')
      .addSelect(`COUNT(*)`, 'run_count')
      .where(`r."userId" = :userId`, { userId })
      .andWhere(`r."runAt" >= :start AND r."runAt" < :end`, {
        start: startUtc,
        end: endUtc,
      })
      .getRawOne<{ total_km: string; total_sec: string; run_count: string }>();

    const map = new Map<number, number>();
    for (const r of barsRaw) map.set(Number(r.m), Number(r.km ?? 0));
    console.log(map);
    const bars = Array.from({ length: 12 }).map((_, i) => {
      const monthNum = i + 1;
      return { label: String(monthNum), km: map.get(monthNum) ?? 0 };
    });

    const totalKm = Number(sumRaw?.total_km ?? 0);
    const durationSec = Number(sumRaw?.total_sec ?? 0);
    const runCount = Number(sumRaw?.run_count ?? 0);
    const avgPaceSecPerKm =
      totalKm > 0 ? Math.round(durationSec / totalKm) : null;

    return {
      year,
      summary: { totalKm, durationSec, runCount, avgPaceSecPerKm },
      bars,
    };
  }

  // ───────────────────────── 전체 (연도별) ─────────────────────────
  async findOverallStats(userId: string, opts: OverallOpts = {}) {
    const tz = opts.tz ?? 'Asia/Seoul';

    // 사용자 데이터의 최솟값/최댓값 연도 구하기
    const bounds = await this.runRepository
      .createQueryBuilder('r')
      .select(`MIN(r."runAt")`, 'min_at')
      .addSelect(`MAX(r."runAt")`, 'max_at')
      .where(`r."userId" = :userId`, { userId })
      .getRawOne<{ min_at: Date | null; max_at: Date | null }>();

    if (!bounds?.min_at || !bounds?.max_at) {
      return {
        summary: {
          totalKm: 0,
          durationSec: 0,
          runCount: 0,
          avgPaceSecPerKm: null,
        },
        bars: [],
      };
    }

    const minYear = Number(format(toZonedTime(bounds.min_at, tz), 'yyyy'));
    const maxYear = Number(format(toZonedTime(bounds.max_at, tz), 'yyyy'));

    // 연도별 합계
    const rows = await this.runRepository
      .createQueryBuilder('r')
      .select(`EXTRACT(YEAR FROM (r."runAt" AT TIME ZONE :tz))`, 'y')
      .addSelect(`COALESCE(SUM(r."distance"), 0)`, 'km')
      .where(`r."userId" = :userId`, { userId })
      .setParameter('tz', tz)
      .groupBy('y')
      .orderBy('y', 'ASC')
      .getRawMany<{ y: string; km: string }>();

    const byYear = new Map<number, number>();
    for (const r of rows) byYear.set(Number(r.y), Number(r.km ?? 0));

    const bars: { year: number; km: number }[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      bars.push({ year: y, km: byYear.get(y) ?? 0 });
    }

    // 전체 요약
    const sumRaw = await this.runRepository
      .createQueryBuilder('r')
      .select(`COALESCE(SUM(r."distance"), 0)`, 'total_km')
      .addSelect(`COALESCE(SUM(r."durationSec"), 0)`, 'total_sec')
      .addSelect(`COUNT(*)`, 'run_count')
      .where(`r."userId" = :userId`, { userId })
      .getRawOne<{ total_km: string; total_sec: string; run_count: string }>();

    const totalKm = Number(sumRaw?.total_km ?? 0);
    const durationSec = Number(sumRaw?.total_sec ?? 0);
    const runCount = Number(sumRaw?.run_count ?? 0);
    const avgPaceSecPerKm =
      totalKm > 0 ? Math.round(durationSec / totalKm) : null;

    return {
      summary: { totalKm, durationSec, runCount, avgPaceSecPerKm },
      bars,
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
