import { PickType } from '@nestjs/mapped-types';
import { Matches } from 'class-validator';
import { HMS_RE, YMDHM_RE } from 'src/common/format/time-format';
import {
  hmsValidationMessage,
  ymdhmValidationMessage,
} from 'src/common/validation-message/dateFormat-validation.message';
import { RunModel } from '../entity/run.entity';

export class CreateRunDto extends PickType(RunModel, ['note', 'distance']) {
  @Matches(YMDHM_RE, { message: ymdhmValidationMessage })
  runAt: string;

  @Matches(HMS_RE, { message: hmsValidationMessage })
  duration: string;
}
