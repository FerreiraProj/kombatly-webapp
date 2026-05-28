import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
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

  @Get('athletes/:id/stats')
  @ApiOperation({ summary: 'Get athlete statistics (public)' })
  @ApiResponse({ status: 200, description: 'Win/loss record and point totals.' })
  getAthleteStats(@Param('id') id: string): Promise<any> {
    return this.service.getAthleteStats(id);
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
