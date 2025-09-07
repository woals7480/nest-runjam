import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UserModel } from 'src/users/entity/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { decimalTransformer } from './decimal.transformer';
import { numberValidationMessage } from 'src/common/validation-message/number-validation.message';

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
    transformer: decimalTransformer,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: numberValidationMessage })
  @Min(0.01)
  @Max(999.99)
  distance: number;

  // @Column({ default: 0 })
  // @IsInt({})
  // durationSec: number;

  // @Column({ nullable: true })
  // @IsOptional()
  // @IsString({ message: stringValidationMessage })
  // @Length(1, 100, { message: lengthValidationMessage })
  // note?: string;

  @ManyToOne(() => UserModel, (user) => user.runs, { onDelete: 'CASCADE' })
  user: UserModel;
}
