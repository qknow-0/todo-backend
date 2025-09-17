import { Test, TestingModule } from '@nestjs/testing';
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
import { Response, Request } from 'express';

jest.setTimeout(500000000);

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRoot(),
        ConfigModule,
        RedisModule,
        PrismaModule,
        AuthModule,
        GoogleModule,
      ],
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });
});
