import { IsString, IsArray, IsInt, Min, Max } from 'class-validator';

export class CreateAvailabilityRuleDto {
  @IsString()
  timezone: string; // IANA timezone

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[]; // 0-6 (Sunday=0)

  @IsString()
  startTime: string; // "HH:MM" format

  @IsString()
  endTime: string; // "HH:MM" format
}

export class UpdateAvailabilityRuleDto {
  @IsString()
  timezone?: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @IsString()
  startTime?: string;

  @IsString()
  endTime?: string;
}
