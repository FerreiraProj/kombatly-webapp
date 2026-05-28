import {
  Controller, Get, Patch, Param, Body, Query, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody, ApiResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UserRole } from '@taekwombats/database';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform stats overview' })
  @ApiResponse({ status: 200, description: 'Aggregate counts.' })
  getStats(): Promise<any> {
    return this.service.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ): Promise<any> {
    return this.service.getUsers(Number(page) || 1, Number(limit) || 20, search, role);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Activate/deactivate user or change role' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated.' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<any> {
    return this.service.updateUser(id, dto);
  }

  @Get('tournaments')
  @ApiOperation({ summary: 'List all tournaments (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTournaments(@Query('page') page?: string, @Query('limit') limit?: string): Promise<any> {
    return this.service.getTournaments(Number(page) || 1, Number(limit) || 20);
  }

  @Get('platform-payments')
  @ApiOperation({ summary: 'Platform revenue payments' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  getPlatformPayments(@Query('from') from?: string, @Query('to') to?: string): Promise<any> {
    return this.service.getPlatformPayments(from, to);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get platform settings' })
  getSettings(): Promise<any> {
    return this.service.getPlatformSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update platform settings' })
  @ApiBody({ type: UpdatePlatformSettingsDto })
  @ApiResponse({ status: 200, description: 'Settings updated.' })
  updateSettings(@Body() dto: UpdatePlatformSettingsDto): Promise<any> {
    return this.service.updatePlatformSettings(dto);
  }

  @Get('reports/financial')
  @ApiOperation({ summary: 'Financial report with monthly breakdown' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  getFinancialReport(@Query('from') from?: string, @Query('to') to?: string): Promise<any> {
    return this.service.getFinancialReport(from, to);
  }

  @Get('reports/export')
  @ApiOperation({ summary: 'Export financial data as CSV' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  async exportCsv(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportFinancialCsv(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="financial-report.csv"');
    res.send(csv);
  }
}
