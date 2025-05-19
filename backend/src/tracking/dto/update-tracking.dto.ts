// src/tracking/dto/update-tracking.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateTrackingDto {
  @IsOptional()
  @IsInt()
  seasonNumber?: number;

  @IsOptional()
  @IsInt()
  episodeNumber?: number;

  @IsString()
  @IsOptional()
  nextAirDate?: string;

  @IsOptional()
  @IsBoolean()
  paused?: boolean;
}
