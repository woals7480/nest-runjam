import { ValidationArguments } from 'class-validator';

export const numberValidationMessage = (args: ValidationArguments) => {
  return `${args.property}에 Number를 입력해주세요.`;
};
