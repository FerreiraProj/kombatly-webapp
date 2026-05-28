import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCheckinDto {
  @ApiPropertyOptional({ description: 'Actual weight in kg', example: 58.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actualWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  athleteCardNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  medicalCertificate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
