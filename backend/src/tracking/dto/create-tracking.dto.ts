// src/tracking/dto/create-tracking.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTrackingDto {
  @IsInt()
  showId: number;

  @IsString()
  showName: string;

  @IsInt()
  @IsOptional()
  seasonNumber?: number;

  @IsInt()
  @IsOptional()
  episodeNumber?: number;

  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @IsString()
  @IsOptional()
  nextAirDate?: string;
}
