import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LeadInfoDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class BookAppointmentDto {
  @ValidateNested()
  @Type(() => LeadInfoDto)
  lead: LeadInfoDto;

  @IsString()
  appointmentTypeId: string;

  @IsDateString()
  startAt: string; // ISO 8601 timestamp

  @IsString()
  timezone: string; // IANA timezone

  @IsString()
  @IsOptional()
  locationType?: string; // "phone" | "zoom" | "in_person" | "custom"

  @IsString()
  @IsOptional()
  locationValue?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class GetSlotsQueryDto {
  @IsDateString()
  from: string; // YYYY-MM-DD

  @IsInt()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  days: number; // Number of days to fetch slots for (1-30)

  @IsString()
  appointmentTypeId: string;
}
