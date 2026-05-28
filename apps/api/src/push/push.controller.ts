import { Controller, Post, Delete, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { PushService } from './push.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SubscribeDto {
  @IsObject() subscription: object;
}

@ApiTags('push')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller('push')
export class PushController {
  constructor(private service: PushService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for browser subscription' })
  getVapidKey() {
    return { publicKey: this.service.getVapidPublicKey() };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiBody({ type: SubscribeDto })
  @ApiResponse({ status: 201, description: 'Subscribed.' })
  async subscribe(
    @CurrentUser() user: { id: string },
    @Body() dto: SubscribeDto,
  ) {
    await this.service.subscribe(user.id, dto.subscription);
    return { message: 'Subscribed' };
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({ status: 200, description: 'Unsubscribed.' })
  async unsubscribe(@CurrentUser() user: { id: string }) {
    await this.service.unsubscribe(user.id);
    return { message: 'Unsubscribed' };
  }
}
