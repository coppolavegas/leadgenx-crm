import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ description: 'User ID to add as member' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Member role', enum: ['owner', 'admin', 'member', 'viewer'] })
  @IsEnum(['owner', 'admin', 'member', 'viewer'])
  role: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ description: 'New member role', enum: ['owner', 'admin', 'member', 'viewer'] })
  @IsEnum(['owner', 'admin', 'member', 'viewer'])
  role: string;
}