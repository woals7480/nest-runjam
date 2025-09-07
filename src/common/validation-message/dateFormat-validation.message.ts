import { ValidationArguments } from 'class-validator';

export const ymdhmValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은 "YYYY-MM-DD HH:mm" 형식이어야 합니다.`;
};

export const hmsValidationMessage = (args: ValidationArguments) => {
  return `${args.property}은 "HH:mm:ss" 형식이어야 합니다.`;
};
