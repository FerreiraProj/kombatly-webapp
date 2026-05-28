import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse,
} from '@nestjs/swagger';
import { CombatsService } from './combats.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddPointDto } from './dto/add-point.dto';
import { UpdateCombatStatusDto } from './dto/update-combat-status.dto';

@ApiTags('combats')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller('combats')
export class CombatsController {
  constructor(private service: CombatsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get combat state with points' })
  @ApiResponse({ status: 200, description: 'Combat detail.' })
  getCombat(@Param('id') id: string): Promise<any> {
    return this.service.getCombat(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update combat status (start, finish, cancel)' })
  @ApiBody({ type: UpdateCombatStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated.' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCombatStatusDto): Promise<any> {
    return this.service.updateStatus(id, dto);
  }

  @Post(':id/points')
  @ApiOperation({ summary: 'Add a scoring point to a combat' })
  @ApiBody({ type: AddPointDto })
  @ApiResponse({ status: 201, description: 'Point added, updated scores returned.' })
  addPoint(
    @Param('id') id: string,
    @Body() dto: AddPointDto,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.addPoint(id, dto, user.id);
  }

  @Delete(':id/points/:pointId')
  @ApiOperation({ summary: 'Remove a point (correction)' })
  @ApiResponse({ status: 200, description: 'Point removed, updated scores returned.' })
  removePoint(
    @Param('id') id: string,
    @Param('pointId') pointId: string,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.removePoint(id, pointId, user.id);
  }
}
