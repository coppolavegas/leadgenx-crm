import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateWorkflowPromptDto {
  @ApiProperty({
    description: 'Natural language description of the automation workflow',
    example: 'When a new lead comes in, wait 4 hours, then if they haven\'t replied, create a task and tag them as follow-up',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt: string;

  @ApiProperty({
    description: 'Optional user ID for audit trail',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
