import { IsString, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateAppointmentTypeDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  bufferMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class UpdateAppointmentTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  bufferMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
