import { Injectable } from '@nestjs/common';
import { CreateRunDto } from './dto/create-run.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RunModel } from './entity/run.entity';
import { Repository } from 'typeorm';
import { parseHmsToSec, parseYmdHmToDate } from 'src/common/format/time-format';

@Injectable()
export class RunService {
  constructor(
    @InjectRepository(RunModel)
    private readonly runRepository: Repository<RunModel>,
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
    });

    return runs;
  }
}
