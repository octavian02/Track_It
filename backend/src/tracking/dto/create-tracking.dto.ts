// src/tracking/dto/create-tracking.dto.ts
import { IsInt, IsOptional, IsString } from 'class-validator';

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

  @IsString()
  @IsOptional()
  nextAirDate?: string;
}
