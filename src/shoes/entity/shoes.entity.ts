import { IsOptional, IsString, Length } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { UserModel } from 'src/users/entity/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

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

  @ManyToOne(() => UserModel, (user) => user.shoes, { onDelete: 'CASCADE' })
  user: UserModel;

  @Column()
  userId: string;
}
