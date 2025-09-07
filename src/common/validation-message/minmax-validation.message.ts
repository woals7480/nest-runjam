import { ValidationArguments } from 'class-validator';

export const minValidationMessage = (args: ValidationArguments) => {
  return `최소 ${args.constraints[0]}부터 입력 가능합니다.`;
};

export const maxValidationMessage = (args: ValidationArguments) => {
  return `최대 ${args.constraints[0]}까지 입력 가능합니다.`;
};
