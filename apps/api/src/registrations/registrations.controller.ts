import {
  Controller, Post, Delete, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RegistrationsController {
  constructor(private service: RegistrationsService) {}

  @Post('tournaments/:tournamentId/registrations')
  register(
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreateRegistrationDto,
  ): Promise<any> {
    return this.service.register({ ...dto, tournamentId });
  }

  @Post('tournaments/:tournamentId/registrations/bulk')
  bulkRegister(
    @Param('tournamentId') tournamentId: string,
    @Body() registrations: CreateRegistrationDto[],
  ): Promise<any[]> {
    return this.service.bulkRegister(registrations.map((r) => ({ ...r, tournamentId })));
  }

  @Delete('registrations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.cancel(id, user.id);
  }

  @Get('tournaments/:tournamentId/registrations/suggest-category')
  suggestCategory(
    @Param('tournamentId') tournamentId: string,
    @Query('weight') weight: string,
    @Query('gradeId') gradeId: string,
    @Query('genderId') genderId: string,
  ): Promise<any> {
    return this.service.suggestCategory(tournamentId, Number(weight), gradeId, genderId);
  }
}
