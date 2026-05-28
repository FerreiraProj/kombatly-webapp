import { Module } from '@nestjs/common';
import { RegulationsController } from './regulations.controller';
import { RegulationsService } from './regulations.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [RegulationsController],
  providers: [RegulationsService, RolesGuard],
})
export class RegulationsModule {}
