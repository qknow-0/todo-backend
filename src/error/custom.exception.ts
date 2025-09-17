import { HttpException, HttpStatus } from '@nestjs/common';

const ErrorCode = {
  //common
  // auth
  1001: 'Jwt must be provided',
  1002: 'User already exists',
  1003: 'User not found',
  1004: 'Invalid password',
};

export class CustomException extends HttpException {
  constructor(public code: number, public errorMsg?: string) {
    if (!errorMsg) errorMsg = ErrorCode[code];
    super(errorMsg, HttpStatus.BAD_REQUEST);
  }
}
