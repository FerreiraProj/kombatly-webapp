import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received by email' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
