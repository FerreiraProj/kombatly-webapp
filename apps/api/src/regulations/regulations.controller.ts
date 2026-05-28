import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegulationsService } from './regulations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@taekwombats/database';

class CreateRegulationDto {
  @IsString() name: string;
  @IsString() language: string;
  @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() version?: string;
}

class UpdateRegulationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() version?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('regulations')
@Controller('regulations')
export class RegulationsController {
  constructor(private service: RegulationsService) {}

  @Get()
  @ApiOperation({ summary: 'List regulations (public)' })
  @ApiQuery({ name: 'language', required: false, description: 'Filter by language code (pt, en, es, fr, de, zh)' })
  list(@Query('language') language?: string) {
    return this.service.list(language);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get regulation content' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create regulation (admin only)' })
  @ApiBody({ type: CreateRegulationDto })
  @ApiResponse({ status: 201, description: 'Regulation created.' })
  create(@Body() dto: CreateRegulationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update regulation (admin only)' })
  @ApiBody({ type: UpdateRegulationDto })
  update(@Param('id') id: string, @Body() dto: UpdateRegulationDto) {
    return this.service.update(id, dto);
  }
}
