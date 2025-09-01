import { Exclude } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { Column, Entity, Index } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
export class UserModel extends BaseModel {
  @Column()
  @IsEmail({}, { message: emailValidationMessage })
  email: string;

  @Exclude()
  @Column({ select: false })
  @IsString({ message: stringValidationMessage })
  @MinLength(6, { message: lengthValidationMessage })
  password: string;

  @Column()
  @IsString({ message: stringValidationMessage })
  nickname: string;
}
