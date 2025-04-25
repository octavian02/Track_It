import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { Logger, ValidationPipe } from '@nestjs/common';

dotenv.config();

async function bootstrap() {
  const globalPrefix = '/api';
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;
  if (configService.get('GUIREDIRECT').indexOf('|') != -1) {
    const cors = {
      origin: configService.get('GUIREDIRECT').split('|'),
      credentials: true,
      methods: 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
    };
    app.enableCors(cors);
  } else {
    const cors = {
      origin: configService.get('GUIREDIRECT'),
      credentials: true,
      methods: 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
    };
    app.enableCors(cors);
  }

  app.use(helmet());
  app.use(cookieParser());

  app.use((req, res, next) => {
    res.setHeader(
      'Access-Control-Allow-Origin',
      req.headers.origin || configService.get('GUIREDIRECT'),
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PATCH,PUT,HEAD,DELETE,OPTIONS',
    );
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
  });
  app.setGlobalPrefix(globalPrefix);
  await app.listen(port);

  Logger.log(`Server started running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
