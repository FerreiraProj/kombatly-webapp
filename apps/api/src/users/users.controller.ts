import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Patch('me')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() body: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<any> {
    return this.service.updateProfile(user.id, body);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    await this.service.changePassword(user.id, body.currentPassword, body.newPassword);
    return { message: 'Password updated successfully' };
  }
}
