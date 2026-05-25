import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BracketsService } from './brackets.service';

@ApiTags('brackets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tournaments/:tournamentId/brackets')
export class BracketsController {
  constructor(private brackets: BracketsService) {}

  @Post('generate')
  generate(
    @Param('tournamentId') tournamentId: string,
    @Body('includeUnpaid') includeUnpaid: boolean = false,
    @CurrentUser() user: { id: string },
  ) {
    return this.brackets.generate(tournamentId, user.id, includeUnpaid);
  }

  @Get()
  getAll(
    @Param('tournamentId') tournamentId: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<any[]> {
    return this.brackets.getForTournament(tournamentId, categoryId);
  }
}
