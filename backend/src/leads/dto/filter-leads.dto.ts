import { IsOptional, IsString, IsBoolean, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterLeadsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by source', enum: ['google', 'yelp'] })
  @IsOptional()
  @IsString()
  @IsIn(['google', 'yelp'])
  source?: string;

  @ApiPropertyOptional({ description: 'Filter by lead status (true = has contact info)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_lead?: boolean;

  @ApiPropertyOptional({ description: 'Filter by discovered after this date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  discovered_after?: string;

  @ApiPropertyOptional({ description: 'Filter by discovered before this date (ISO 8601)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  discovered_before?: string;

  @ApiPropertyOptional({ description: 'Search by business name' })
  @IsOptional()
  @IsString()
  search?: string;
}
