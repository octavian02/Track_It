// src/tracking/dto/update-tracking.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateTrackingDto {
  @IsInt()
  seasonNumber?: number;

  @IsInt()
  episodeNumber?: number;

  @IsString()
  @IsOptional()
  nextAirDate?: string;

  @IsOptional()
  @IsBoolean()
  paused?: boolean;
}
