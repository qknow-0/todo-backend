import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';
import { PrismaService } from './prisma/prisma.service';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<Response<T>>> {
    const req = context.switchToHttp().getRequest();

    const authPattern = /\/api\/auth/;
    if (authPattern.test(req.path))
      return next.handle().pipe(map((data) => ({ data, code: 200 })));

    // console.log('req.headers?.authorization', req.headers?.authorization);
    if (req.headers?.authorization) {
      const user = await this.auth.decoded(
        req.headers.authorization.split(' ')[1],
      );
      // console.log('user', user);
      req.user = user;
    }

    return next.handle().pipe(map((data) => ({ data, code: 200 })));
  }
}
