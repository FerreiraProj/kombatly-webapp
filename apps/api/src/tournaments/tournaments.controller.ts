import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentStatus } from '@taekwombats/database';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private service: TournamentsService) {}

  // ── Reference data (public) ───────────────────────────────────────────────
  @Get('reference/grades')
  getGrades(): Promise<any[]> {
    return this.service.getGrades();
  }

  @Get('reference/categories')
  getStandardCategories(): Promise<any[]> {
    return this.service.getStandardCategories();
  }

  // ── Tournament CRUD ───────────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTournamentDto): Promise<any> {
    return this.service.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: { id: string }, @Query('status') status?: TournamentStatus): Promise<any[]> {
    return this.service.findAll(user.id, status);
  }

  @Get()
  findPublic(): Promise<any[]> {
    return this.service.findAll();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string): Promise<any> {
    return this.service.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }): Promise<any> {
    return this.service.findOne(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
  ): Promise<any> {
    return this.service.update(user.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('status') status: TournamentStatus,
  ): Promise<any> {
    return this.service.setStatus(user.id, id, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.service.remove(user.id, id);
  }

  // ── Categories ────────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/categories')
  addCategories(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('weightCategoryIds') ids: string[],
  ): Promise<any> {
    return this.service.addCategories(id, ids);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/categories/:categoryId')
  removeCategory(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ): Promise<any> {
    return this.service.removeCategory(user.id, id, categoryId);
  }

  // ── Registrations ─────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/registrations')
  getRegistrations(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Query('categoryId') categoryId?: string,
    @Query('isPaid') isPaid?: string,
  ): Promise<any[]> {
    return this.service.getRegistrations(user.id, id, {
      categoryId,
      isPaid: isPaid !== undefined ? isPaid === 'true' : undefined,
    });
  }
}
