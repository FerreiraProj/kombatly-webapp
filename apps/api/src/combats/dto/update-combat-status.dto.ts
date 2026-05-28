import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CombatStatus } from '@taekwombats/database';

export class UpdateCombatStatusDto {
  @ApiProperty({ enum: CombatStatus })
  @IsEnum(CombatStatus)
  status: CombatStatus;

  @ApiPropertyOptional({ description: 'Registration ID of the winner (required when FINISHED)' })
  @IsOptional()
  @IsString()
  winnerId?: string;
}
