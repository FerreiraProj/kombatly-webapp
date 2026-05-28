import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProtestStatus } from '@taekwombats/database';

export class ResolveProtestDto {
  @ApiProperty({ enum: [ProtestStatus.ACCEPTED, ProtestStatus.REJECTED, ProtestStatus.UNDER_REVIEW] })
  @IsEnum(ProtestStatus)
  status: ProtestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  decision?: string;
}
