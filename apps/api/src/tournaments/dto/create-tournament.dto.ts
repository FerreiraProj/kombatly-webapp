import {
  IsString, IsDateString, IsInt, Min, Max, IsEnum, IsBoolean,
  IsOptional, IsArray, Length, IsNumber,
} from 'class-validator';
import { DrawType, AthletesVisible } from '@taekwombats/database';

export class CreateTournamentDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsDateString()
  registrationDeadline: string;

  @IsInt()
  @Min(1)
  @Max(12)
  numAreas: number;

  @IsEnum(DrawType)
  drawType: DrawType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  numRounds?: number;

  @IsString()
  @Length(0, 100)
  country: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  venue?: string;

  @IsOptional()
  @IsBoolean()
  hasVestLimitation?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  vestQtyType1?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  vestQtyType2?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  vestQtyType3?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  vestQtyType4?: number;

  @IsOptional()
  @IsEnum(AthletesVisible)
  athletesVisible?: AthletesVisible;

  @IsOptional()
  @IsBoolean()
  drawVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  areasVisible?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
