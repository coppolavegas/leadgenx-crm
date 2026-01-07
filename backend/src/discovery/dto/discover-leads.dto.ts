import { IsString, IsArray, IsOptional, IsNumber, Min, Max, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LocationDto {
  @ApiPropertyOptional({ description: 'City name', example: 'San Francisco' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State or province', example: 'CA' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Latitude', example: 37.7749 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: -122.4194 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Radius in meters (for lat/lng searches)', example: 5000, minimum: 100, maximum: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  radius?: number;
}

export class DiscoverLeadsDto {
  @ApiProperty({ description: 'Industry or business type', example: 'restaurants' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiPropertyOptional({ description: 'Additional keywords to refine search', example: ['italian', 'fine dining'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiProperty({ description: 'Location parameters', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Maximum number of leads to discover', example: 50, minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxLeads?: number = 50;
}
