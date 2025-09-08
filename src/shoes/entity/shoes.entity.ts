import { IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { UserModel } from 'src/users/entity/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { ShoeMileageModel } from './shoe-mileage.entity';
import { decimalTransformer } from 'src/common/tranformer/decimal.transformer';
import { decimalValidationMessage } from 'src/common/validation-message/decimal-validation.message';

@Entity('shoes')
@Index(['userId', 'nickname'], { unique: false })
export class ShoeModel extends BaseModel {
  @Column()
  @IsString()
  @Length(1, 50, { message: lengthValidationMessage })
  brand: string;

  @Column()
  @IsString()
  @Length(1, 50, { message: lengthValidationMessage })
  model: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: lengthValidationMessage })
  nickname?: string;

  @Column({
    type: 'decimal',
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: decimalValidationMessage })
  totalMileage: number;

  @ManyToOne(() => UserModel, (user) => user.shoes, { onDelete: 'CASCADE' })
  user: UserModel;

  @Column()
  userId: string;

  @OneToMany(() => ShoeMileageModel, (mileage) => mileage.shoe)
  mileages: ShoeMileageModel[];
}
