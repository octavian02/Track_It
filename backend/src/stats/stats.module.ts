// src/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from '../history/history.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([History]), // folosim entitatea existingă
  ],
  providers: [StatsService],
  controllers: [StatsController],
  exports: [StatsService], // dacă ai nevoie de el în altă parte
})
export class StatsModule {}
