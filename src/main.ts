import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (
    process.env.NODE_ENV === 'local' ||
    process.env.NODE_ENV === 'development'
  ) {
    const config = new DocumentBuilder()
      .setTitle('TODO API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/api', app, document);
  }
  app.setGlobalPrefix('api/v1');
  // Set up body-parser
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
