// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseLogger } from '../database/database.logger';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DATABASE'),
        synchronize: configService.get<boolean>('DBSYNC'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        logger: new DatabaseLogger(),
        autoLoadEntities: true,
        dropSchema: false,
        keepConnectionAlive: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
