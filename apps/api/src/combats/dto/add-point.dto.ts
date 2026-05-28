import { IsEnum, IsInt, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PointType } from '@taekwombats/database';
import { Type } from 'class-transformer';

export class AddPointDto {
  @ApiProperty({ description: 'Registration ID of the athlete scoring the point' })
  @IsString()
  athleteId: string;

  @ApiProperty({ enum: PointType, description: 'Type of scoring action' })
  @IsEnum(PointType)
  pointType: PointType;

  @ApiProperty({ description: 'Round number (1, 2, or 3)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  roundNumber: number;
}
