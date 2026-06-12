import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
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
  @ApiOperation({ summary: 'List grades (public reference data)' })
  @ApiResponse({ status: 200, description: 'List of grades with weight categories.' })
  getGrades(): Promise<any[]> {
    return this.service.getGrades();
  }

  @Get('reference/categories')
  @ApiOperation({ summary: 'List standard categories (public reference data)' })
  @ApiResponse({ status: 200, description: 'List of standard categories.' })
  getStandardCategories(): Promise<any[]> {
    return this.service.getStandardCategories();
  }

  // ── Public events agenda ─────────────────────────────────────────────────

  @Get('events')
  @ApiOperation({ summary: 'List public tournament events (agenda)' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['upcoming', 'live', 'past', 'all'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of public tournaments.' })
  getPublicEvents(
    @Query('country') country?: string,
    @Query('status') status?: 'upcoming' | 'live' | 'past' | 'all',
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.service.findPublicEvents({
      country,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
    });
  }

  // ── Tournament CRUD ───────────────────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Create a tournament' })
  @ApiBody({ type: CreateTournamentDto })
  @ApiResponse({ status: 201, description: 'Tournament created.' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTournamentDto): Promise<any> {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'List my tournaments' })
  @ApiQuery({ name: 'status', enum: TournamentStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of tournaments.' })
  findMine(@CurrentUser() user: { id: string }, @Query('status') status?: TournamentStatus): Promise<any[]> {
    return this.service.findAll(user.id, status);
  }

  @Get()
  @ApiOperation({ summary: 'List public tournaments' })
  @ApiResponse({ status: 200, description: 'List of public tournaments.' })
  findPublic(): Promise<any[]> {
    return this.service.findAll();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tournament by slug (public)' })
  @ApiResponse({ status: 200, description: 'Tournament detail.' })
  findBySlug(@Param('slug') slug: string): Promise<any> {
    return this.service.findBySlug(slug);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Get tournament by ID' })
  @ApiResponse({ status: 200, description: 'Tournament detail.' })
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }): Promise<any> {
    return this.service.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Update a tournament' })
  @ApiBody({ type: UpdateTournamentDto })
  @ApiResponse({ status: 200, description: 'Tournament updated.' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
  ): Promise<any> {
    return this.service.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Change tournament status' })
  @ApiResponse({ status: 200, description: 'Status updated.' })
  setStatus(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('status') status: TournamentStatus,
  ): Promise<any> {
    return this.service.setStatus(user.id, id, status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tournament' })
  @ApiResponse({ status: 204, description: 'Tournament deleted.' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<any> {
    return this.service.remove(user.id, id);
  }

  // ── Categories ────────────────────────────────────────────────────────────

  @Post(':id/categories')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Add weight categories to a tournament' })
  @ApiResponse({ status: 201, description: 'Categories added.' })
  addCategories(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('weightCategoryIds') ids: string[],
  ): Promise<any> {
    return this.service.addCategories(id, ids);
  }

  @Delete(':id/categories/:categoryId')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a category from a tournament' })
  @ApiResponse({ status: 204, description: 'Category removed.' })
  removeCategory(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ): Promise<any> {
    return this.service.removeCategory(user.id, id, categoryId);
  }

  // ── Medalists ─────────────────────────────────────────────────────────────

  @Get(':id/medalists')
  @ApiOperation({ summary: 'Get medalists per category for a tournament' })
  @ApiResponse({ status: 200, description: 'Medalists by category.' })
  getMedalists(@Param('id') id: string): Promise<any[]> {
    return this.service.getMedalists(id);
  }

  // ── Registrations ─────────────────────────────────────────────────────────

  @Get(':id/registrations')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'List registrations for a tournament' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isPaid', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of registrations.' })
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
