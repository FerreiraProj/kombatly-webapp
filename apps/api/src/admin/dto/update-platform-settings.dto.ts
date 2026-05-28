import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({ description: 'Platform name shown to users' })
  @IsOptional()
  @IsString()
  platformName?: string;

  @ApiPropertyOptional({ description: 'Cost per athlete (EUR)', example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPerAthlete?: number;

  @ApiPropertyOptional({ description: 'Platform contact email' })
  @IsOptional()
  @IsEmail()
  platformEmail?: string;
}
