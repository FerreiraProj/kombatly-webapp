import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<any> {
    return this.service.updateProfile(user.id, dto);
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get global athlete rankings (public)' })
  @ApiQuery({ name: 'gradeId', required: false })
  @ApiQuery({ name: 'genderId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Ranked athlete list.' })
  getGlobalRankings(
    @Query('gradeId') gradeId?: string,
    @Query('genderId') genderId?: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    return this.service.getGlobalRankings({ gradeId, genderId, limit: limit ? parseInt(limit, 10) : 50 });
  }

  @Get('athletes/:id')
  @ApiOperation({ summary: 'Get athlete profile with tournament history' })
  @ApiResponse({ status: 200, description: 'Athlete profile and registrations.' })
  getAthleteProfile(@Param('id') id: string): Promise<any> {
    return this.service.getAthleteProfile(id);
  }

  @Get('athletes/:id/stats')
  @ApiOperation({ summary: 'Get athlete statistics (public)' })
  @ApiResponse({ status: 200, description: 'Win/loss record and point totals.' })
  getAthleteStats(@Param('id') id: string): Promise<any> {
    return this.service.getAthleteStats(id);
  }

  @Get('me/referrals')
  @ApiOperation({ summary: 'Get my referral points balance and history' })
  @ApiResponse({ status: 200, description: 'Referral summary.' })
  getReferralSummary(@CurrentUser() user: { id: string }): Promise<any> {
    return this.service.getReferralSummary(user.id);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change my password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password updated.' })
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.service.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { message: 'Password updated successfully' };
  }
}
