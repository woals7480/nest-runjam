import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { RunModel } from 'src/run/entity/run.entity';
import { ShoeModel } from 'src/shoes/entity/shoes.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
export class UserModel extends BaseModel {
  @Column()
  @IsEmail({}, { message: emailValidationMessage })
  email: string;

  @Column({ select: false })
  @IsString({ message: stringValidationMessage })
  @MinLength(6, { message: lengthValidationMessage })
  password: string;

  @Column()
  @IsString({ message: stringValidationMessage })
  @Length(2, 10, { message: lengthValidationMessage })
  nickname: string;

  @OneToMany(() => ShoeModel, (shoe) => shoe.user)
  shoes: ShoeModel[];

  @OneToMany(() => RunModel, (run) => run.user)
  runs: RunModel[];
}
