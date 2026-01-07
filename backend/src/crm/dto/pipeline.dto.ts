import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreatePipelineDto {
  @ApiProperty({ description: 'Pipeline name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Pipeline description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Is this the default pipeline?', required: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiProperty({ description: 'Display position', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdatePipelineDto {
  @ApiProperty({ description: 'Pipeline name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Pipeline description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Is this the default pipeline?', required: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiProperty({ description: 'Display position', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreateStageDto {
  @ApiProperty({ description: 'Stage name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display position' })
  @IsInt()
  @Min(0)
  position: number;

  @ApiProperty({ description: 'Stage color (hex)', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateStageDto {
  @ApiProperty({ description: 'Stage name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Display position', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiProperty({ description: 'Stage color (hex)', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}