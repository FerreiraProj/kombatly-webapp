import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ProtestsService } from './protests.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileProtestDto } from './dto/file-protest.dto';
import { ResolveProtestDto } from './dto/resolve-protest.dto';

@ApiTags('protests')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller()
export class ProtestsController {
  constructor(private service: ProtestsService) {}

  @Post('combats/:combatId/protests')
  @ApiOperation({ summary: 'File a protest for a combat' })
  @ApiBody({ type: FileProtestDto })
  @ApiResponse({ status: 201, description: 'Protest filed.' })
  file(
    @Param('combatId') combatId: string,
    @Body() dto: FileProtestDto,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.file(combatId, user.id, dto.reason);
  }

  @Get('tournaments/:tournamentId/protests')
  @ApiOperation({ summary: 'List protests for a tournament' })
  list(@Param('tournamentId') tournamentId: string): Promise<any> {
    return this.service.listForTournament(tournamentId);
  }

  @Patch('protests/:id')
  @ApiOperation({ summary: 'Resolve a protest (accept or reject)' })
  @ApiBody({ type: ResolveProtestDto })
  @ApiResponse({ status: 200, description: 'Protest resolved.' })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveProtestDto,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.resolve(id, user.id, dto);
  }
}
