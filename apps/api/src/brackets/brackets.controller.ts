import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BracketsService } from './brackets.service';

@ApiTags('brackets')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller('tournaments/:tournamentId/brackets')
export class BracketsController {
  constructor(private brackets: BracketsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate brackets for a tournament' })
  @ApiResponse({ status: 201, description: 'Brackets generated.' })
  generate(
    @Param('tournamentId') tournamentId: string,
    @Body('includeUnpaid') includeUnpaid: boolean = false,
    @CurrentUser() user: { id: string },
  ) {
    return this.brackets.generate(tournamentId, user.id, includeUnpaid);
  }

  @Get()
  @ApiOperation({ summary: 'Get brackets for a tournament' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiResponse({ status: 200, description: 'List of brackets.' })
  getAll(
    @Param('tournamentId') tournamentId: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<any[]> {
    return this.brackets.getForTournament(tournamentId, categoryId);
  }
}
