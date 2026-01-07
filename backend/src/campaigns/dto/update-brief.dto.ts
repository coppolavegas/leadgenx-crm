import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateBriefDto {
  @ApiProperty({
    example: 'We need recording studios that do mixing/mastering, offer late-night sessions, and have online booking.',
    description: 'Natural language description of what the client is looking for'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  client_brief: string;
}
