import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UserModel } from 'src/users/entity/user.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { decimalValidationMessage } from 'src/common/validation-message/decimal-validation.message';
import {
  maxValidationMessage,
  minValidationMessage,
} from 'src/common/validation-message/minmax-validation.message';
import { Exclude, Expose } from 'class-transformer';
import { formatSecToMs } from 'src/common/format/time-format';

@Entity('runs')
@Index(['userId', 'runAt'])
export class RunModel extends BaseModel {
  @Column()
  @IsString({ message: stringValidationMessage })
  userId: string;

  @Column({ type: 'timestamptz' })
  runAt: Date;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: decimalValidationMessage })
  @Min(0.01, { message: minValidationMessage })
  @Max(999.99, { message: maxValidationMessage })
  distance: number;

  @Exclude()
  @Column({ default: 0 })
  @IsInt()
  durationSec: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @Length(1, 100, { message: lengthValidationMessage })
  note?: string;

  @ManyToOne(() => UserModel, (user) => user.runs, { onDelete: 'CASCADE' })
  user: UserModel;

  // @Expose()
  // get runAtText(): string {
  //   const d = this.runAt instanceof Date ? this.runAt : new Date(this.runAt);
  //   const pad = (n: number) => String(n).padStart(2, '0');
  //   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  // }

  @Expose()
  get durationText(): string {
    const t = this.durationSec;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}시간`);
    if (m > 0) parts.push(`${m}분`);
    if (s > 0 || parts.length === 0) parts.push(`${s}초`);
    return parts.join(' ');
  }

  // 1km당 평균 페이스
  get pacePerKmSecRaw(): number | null {
    const dist = Number(this.distance ?? 0);
    if (!Number.isFinite(dist) || dist <= 0) return null;
    return Math.round(this.durationSec / dist);
  }

  @Expose()
  get pacePerKm(): string | null {
    const sec = this.pacePerKmSecRaw;
    if (sec == null) return null;
    return `${formatSecToMs(sec)}/km`;
  }
}
