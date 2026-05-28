import { Module } from '@nestjs/common';
import { CombatsController } from './combats.controller';
import { CombatsService } from './combats.service';
import { BracketsModule } from '../brackets/brackets.module';

@Module({
  imports: [BracketsModule],
  controllers: [CombatsController],
  providers: [CombatsService],
  exports: [CombatsService],
})
export class CombatsModule {}
