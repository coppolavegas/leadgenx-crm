import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateAppointmentDto {
  @IsString()
  @IsIn(['scheduled', 'canceled', 'completed', 'no_show'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  cancelReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AppointmentQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  leadId?: string;
}
