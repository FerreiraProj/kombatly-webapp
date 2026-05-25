import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { CreateAthleteDto } from './dto/create-athlete.dto';

@ApiTags('clubs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private service: ClubsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateClubDto) {
    return this.service.createClub(user.id, dto);
  }

  // Static/specific routes must come before :id to avoid route shadowing
  @Get('me')
  getMyClub(@CurrentUser() user: { id: string }) {
    return this.service.getMyClub(user.id);
  }

  @Get('me/athletes')
  getAthletes(@CurrentUser() user: { id: string }) {
    return this.service.getAthletes(user.id);
  }

  @Post('me/athletes')
  createAthlete(@CurrentUser() user: { id: string }, @Body() dto: CreateAthleteDto) {
    return this.service.createAthlete(user.id, dto);
  }

  @Get()
  list(@Query('search') search?: string) {
    return this.service.listPublicClubs(search);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getClub(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateClubDto,
  ) {
    return this.service.updateClub(user.id, id, dto);
  }
}
