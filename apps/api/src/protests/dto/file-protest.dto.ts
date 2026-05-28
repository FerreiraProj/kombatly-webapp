import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileProtestDto {
  @ApiProperty({ description: 'Reason for the protest' })
  @IsString()
  @MinLength(10)
  reason: string;
}
