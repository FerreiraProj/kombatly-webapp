import {
  Controller, Post, Delete, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('registrations')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller()
export class RegistrationsController {
  constructor(private service: RegistrationsService) {}

  @Post('tournaments/:tournamentId/registrations')
  @ApiOperation({ summary: 'Register an athlete in a tournament' })
  @ApiBody({ type: CreateRegistrationDto })
  @ApiResponse({ status: 201, description: 'Registration created.' })
  register(
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreateRegistrationDto,
  ): Promise<any> {
    return this.service.register({ ...dto, tournamentId });
  }

  @Post('tournaments/:tournamentId/registrations/bulk')
  @ApiOperation({ summary: 'Bulk register athletes in a tournament' })
  @ApiResponse({ status: 201, description: 'Registrations created.' })
  bulkRegister(
    @Param('tournamentId') tournamentId: string,
    @Body() registrations: CreateRegistrationDto[],
  ): Promise<any[]> {
    return this.service.bulkRegister(registrations.map((r) => ({ ...r, tournamentId })));
  }

  @Delete('registrations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a registration' })
  @ApiResponse({ status: 204, description: 'Registration cancelled.' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<any> {
    return this.service.cancel(id, user.id);
  }

  @Get('tournaments/:tournamentId/registrations/suggest-category')
  @ApiOperation({ summary: 'Suggest a category for an athlete' })
  @ApiQuery({ name: 'weight', type: Number, description: 'Athlete weight in kg' })
  @ApiQuery({ name: 'gradeId', type: String })
  @ApiQuery({ name: 'genderId', type: String })
  @ApiResponse({ status: 200, description: 'Suggested category.' })
  suggestCategory(
    @Param('tournamentId') tournamentId: string,
    @Query('weight') weight: string,
    @Query('gradeId') gradeId: string,
    @Query('genderId') genderId: string,
  ): Promise<any> {
    return this.service.suggestCategory(tournamentId, Number(weight), gradeId, genderId);
  }
}
