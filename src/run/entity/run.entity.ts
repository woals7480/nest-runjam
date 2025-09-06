import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsTimeZone,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { YMDHM_RE } from 'src/common/format/time-format';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UserModel } from 'src/users/entity/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('run')
@Index(['userId', 'runAt'])
export class RunModel extends BaseModel {
  @Column()
  userId: string;

  @Column()
  @IsString()
  @Matches(YMDHM_RE, {})
  runAt: string;

  @Column({ type: 'decimal', scale: 2, precision: 6 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'aa' })
  @Min(0.01)
  @Max(999.99)
  distance: number;

  @Column({ default: 0 })
  @IsInt()
  durationSec: number;

  @Column()
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @Length(1, 500, { message: lengthValidationMessage })
  note?: string;

  @ManyToOne(() => UserModel, (user) => user.runs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserModel;
}
