import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth.module';
import { ApiKeyGuard } from './api-key.guard';
import { JwtOrApiKeyGuard } from './jwt-or-api-key.guard';

@Global()
@Module({
  imports: [AuthModule],
  providers: [ApiKeyGuard, JwtOrApiKeyGuard],
  exports: [ApiKeyGuard, JwtOrApiKeyGuard, AuthModule],
})
export class GuardsModule {}
