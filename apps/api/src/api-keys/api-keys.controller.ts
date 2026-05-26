import {
  Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private apiKeys: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create an API key', description: 'Returns the full key only once. Store it securely.' })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({ status: 201, description: 'Key created. The `key` field is only returned here — store it.' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateApiKeyDto) {
    return this.apiKeys.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List your API keys' })
  @ApiResponse({ status: 200, description: 'List of keys (prefix only, not full key).' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.apiKeys.findAll(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 204, description: 'Key revoked.' })
  revoke(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.apiKeys.revoke(user.id, id);
  }
}
