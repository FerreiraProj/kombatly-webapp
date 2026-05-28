import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { CreateAthleteDto } from './dto/create-athlete.dto';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private service: ClubsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a club for the current user' })
  @ApiBody({ type: CreateClubDto })
  @ApiResponse({ status: 201, description: 'Club created.' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateClubDto) {
    return this.service.createClub(user.id, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Get my club' })
  @ApiResponse({ status: 200, description: 'Club detail.' })
  getMyClub(@CurrentUser() user: { id: string }) {
    return this.service.getMyClub(user.id);
  }

  @Get('me/athletes')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'List athletes of my club' })
  @ApiResponse({ status: 200, description: 'List of athletes.' })
  getAthletes(@CurrentUser() user: { id: string }) {
    return this.service.getAthletes(user.id);
  }

  @Post('me/athletes')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Add an athlete to my club' })
  @ApiBody({ type: CreateAthleteDto })
  @ApiResponse({ status: 201, description: 'Athlete created.' })
  createAthlete(@CurrentUser() user: { id: string }, @Body() dto: CreateAthleteDto) {
    return this.service.createAthlete(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clubs (public)' })
  @ApiQuery({ name: 'search', required: false, description: 'Filter by name' })
  @ApiResponse({ status: 200, description: 'List of clubs.' })
  list(@Query('search') search?: string) {
    return this.service.listPublicClubs(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a club by ID (public)' })
  @ApiResponse({ status: 200, description: 'Club detail.' })
  getOne(@Param('id') id: string) {
    return this.service.getClub(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get club statistics (public)' })
  @ApiResponse({ status: 200, description: 'Club stats.' })
  getStats(@Param('id') id: string): Promise<any> {
    return this.service.getClubStats(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiSecurity('apiKey')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiOperation({ summary: 'Update a club' })
  @ApiBody({ type: UpdateClubDto })
  @ApiResponse({ status: 200, description: 'Club updated.' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateClubDto,
  ) {
    return this.service.updateClub(user.id, id, dto);
  }
}
