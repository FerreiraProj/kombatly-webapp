import { Module } from '@nestjs/common';
import { ProtestsController } from './protests.controller';
import { ProtestsService } from './protests.service';

@Module({
  controllers: [ProtestsController],
  providers: [ProtestsService],
})
export class ProtestsModule {}
