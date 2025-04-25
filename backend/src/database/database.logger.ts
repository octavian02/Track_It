// src/logging/database.logger.ts
import { Logger as TypeOrmLogger } from 'typeorm';
import { Logger as NestLogger } from '@nestjs/common';

export class DatabaseLogger implements TypeOrmLogger {
  private readonly logger = new NestLogger('SQL');

  logQuery(query: string, parameters?: any[]) {
    this.logger.log(
      `${query} -- Parameters: ${this.stringifyParameters(parameters)}`,
    );
  }

  logQueryError(error: string | Error, query: string, parameters?: any[]) {
    this.logger.error(
      `${query} -- Parameters: ${this.stringifyParameters(parameters)} -- ${error}`,
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn(
      `Time: ${time} -- Parameters: ${this.stringifyParameters(parameters)} -- ${query}`,
    );
  }

  logSchemaBuild(message: string) {
    this.logger.log(message);
  }

  logMigration(message: string) {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    if (level === 'log') {
      return this.logger.log(message);
    }
    if (level === 'info') {
      return this.logger.debug(message);
    }
    if (level === 'warn') {
      return this.logger.warn(message);
    }
  }

  private stringifyParameters(parameters?: unknown[]) {
    try {
      return JSON.stringify(parameters);
    } catch {
      return '';
    }
  }
}
