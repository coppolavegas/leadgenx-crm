import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateBookingLinkDto {
  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  appointmentTypeId?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class UpdateBookingLinkDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  appointmentTypeId?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
