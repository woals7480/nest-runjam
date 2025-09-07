import { ValidationArguments } from 'class-validator';

export const decimalValidationMessage = (args: ValidationArguments) => {
  return `${args.property}는 소수점 ${args.constraints[0].maxDecimalPlaces ?? 0}자리까지 가능합니다.`;
};
