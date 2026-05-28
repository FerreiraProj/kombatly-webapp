import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiQuery, ApiResponse,
} from '@nestjs/swagger';
import { CheckinService } from './checkin.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@ApiTags('checkin')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller('tournaments/:tournamentId/checkin')
export class CheckinController {
  constructor(private service: CheckinService) {}

  @Get()
  @ApiOperation({ summary: 'List check-ins for a tournament' })
  @ApiQuery({ name: 'categoryId', required: false })
  list(
    @Param('tournamentId') tournamentId: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<any> {
    return this.service.listCheckins(tournamentId, categoryId);
  }

  @Post(':registrationId')
  @ApiOperation({ summary: 'Check in an athlete (create or update)' })
  @ApiBody({ type: CreateCheckinDto })
  @ApiResponse({ status: 201, description: 'Check-in recorded.' })
  checkin(
    @Param('tournamentId') tournamentId: string,
    @Param('registrationId') registrationId: string,
    @Body() dto: CreateCheckinDto,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.checkin(tournamentId, registrationId, user.id, dto);
  }

  @Patch(':checkinId/approve-weight')
  @ApiOperation({ summary: 'Approve athlete weight' })
  @ApiResponse({ status: 200, description: 'Weight approved.' })
  approveWeight(
    @Param('tournamentId') tournamentId: string,
    @Param('checkinId') checkinId: string,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.approveWeight(checkinId, tournamentId, user.id);
  }

  @Patch(':checkinId/verify-docs')
  @ApiOperation({ summary: 'Mark documents as verified' })
  @ApiResponse({ status: 200, description: 'Documents verified.' })
  verifyDocs(
    @Param('tournamentId') tournamentId: string,
    @Param('checkinId') checkinId: string,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.verifyDocuments(checkinId, tournamentId, user.id);
  }
}
