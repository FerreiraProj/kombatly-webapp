import { Module } from '@nestjs/common';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';
import { BracketGeneratorService } from './services/bracket-generator.service';
import { AreaDistributionService } from './services/area-distribution.service';
import { ScheduleService } from './services/schedule.service';

@Module({
  controllers: [BracketsController],
  providers: [BracketsService, BracketGeneratorService, AreaDistributionService, ScheduleService],
  exports: [BracketsService, ScheduleService],
})
export class BracketsModule {}
