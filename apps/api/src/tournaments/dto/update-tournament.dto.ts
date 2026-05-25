import { PartialType } from '@nestjs/swagger';
import { CreateTournamentDto } from './create-tournament.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TournamentStatus } from '@taekwombats/database';

export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
