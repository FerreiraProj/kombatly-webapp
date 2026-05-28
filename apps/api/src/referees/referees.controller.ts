import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RefereesService } from './referees.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { AssignRefereeDto } from './dto/assign-referee.dto';

@ApiTags('referees')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller()
export class RefereesController {
  constructor(private service: RefereesService) {}

  @Get('referees')
  @ApiOperation({ summary: 'List available referee users' })
  @ApiQuery({ name: 'search', required: false })
  listReferees(@Query('search') search?: string) {
    return this.service.listRefereeUsers(search);
  }

  @Get('combats/:combatId/referees')
  @ApiOperation({ summary: 'List referees assigned to a combat' })
  getCombatReferees(@Param('combatId') combatId: string) {
    return this.service.getCombatReferees(combatId);
  }

  @Post('combats/:combatId/referees')
  @ApiOperation({ summary: 'Assign a referee to a combat' })
  @ApiBody({ type: AssignRefereeDto })
  @ApiResponse({ status: 201, description: 'Referee assigned.' })
  assignReferee(@Param('combatId') combatId: string, @Body() dto: AssignRefereeDto) {
    return this.service.assignToCombat(combatId, dto.refereeId, dto.role);
  }

  @Delete('combats/:combatId/referees/:refereeId')
  @ApiOperation({ summary: 'Remove a referee from a combat' })
  removeReferee(
    @Param('combatId') combatId: string,
    @Param('refereeId') refereeId: string,
  ) {
    return this.service.removeFromCombat(combatId, refereeId);
  }
}
