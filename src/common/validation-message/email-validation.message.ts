import { ValidationArguments } from 'class-validator';

export const emailValidationMessage = (args: ValidationArguments) => {
  return `${args.property}에 정확한 이메일 형식을 입력해주세요.`;
};
