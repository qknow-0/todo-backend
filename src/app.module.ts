import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomExceptionFilter } from './custom.filter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './transform.interceptor';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { AuthService } from './auth/auth.service';
import { ScheduleModule } from '@nestjs/schedule';
import { GoogleModule } from './google/google.module';
import { PrismaService } from './prisma/prisma.service';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    RedisModule,
    PrismaModule,
    AuthModule,
    GoogleModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },
  ],
})
export class AppModule {}
