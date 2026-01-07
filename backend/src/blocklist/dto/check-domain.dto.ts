import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckDomainDto {
  @ApiProperty({ description: 'Domain to check', example: 'example.com' })
  @IsString()
  domain: string;
}
