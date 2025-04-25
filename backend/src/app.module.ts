// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { MoviesModule } from './movies/movies.module';
import { RatingsModule } from './ratings/ratings.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { AuthModule } from 'auth/auth.module';
import { ShowsModule } from './shows/shows.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DATABASE: Joi.string().required(),
        RUN_MIGRATIONS: Joi.boolean().required(),
        DBLOGGING: Joi.boolean(),
        DBSYNC: Joi.boolean(),
      }),
    }),
    DatabaseModule,
    UserModule,
    MoviesModule,
    WatchlistModule,
    RatingsModule,
    AuthModule,
    ShowsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
