import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  tournamentId: string;

  @IsString()
  athleteId: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  clubId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ranking?: number;
}
