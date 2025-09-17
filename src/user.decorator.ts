import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IUser {
  id: string;
  address?: string;
  github?: string;
  email?: string;
  name: string;
  description?: string;
  coupon: number;
  image?: string;
  expiry_at?: string;
  created_at: string;
  updated_at: string;
  ip?: string;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as IUser;
  },
);
