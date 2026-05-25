import {
  Controller, Post, Patch, Get, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentMethod } from '@taekwombats/database';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InvoicesController {
  constructor(private service: InvoicesService) {}

  // Generate invoice for a club in a tournament
  @Post('tournaments/:tournamentId/invoices')
  generate(
    @CurrentUser() user: { id: string },
    @Param('tournamentId') tournamentId: string,
    @Body('clubUserId') clubUserId: string,
    @Body('notes') notes?: string,
  ): Promise<any> {
    return this.service.generate(user.id, tournamentId, clubUserId, notes);
  }

  // List invoices for a tournament (promoter)
  @Get('tournaments/:tournamentId/invoices')
  findForTournament(
    @CurrentUser() user: { id: string },
    @Param('tournamentId') tournamentId: string,
  ): Promise<any[]> {
    return this.service.findForTournament(user.id, tournamentId);
  }

  // My invoices (club view)
  @Get('invoices/me')
  findMine(@CurrentUser() user: { id: string }): Promise<any[]> {
    return this.service.findMine(user.id);
  }

  // Single invoice
  @Get('invoices/:id')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<any> {
    return this.service.findOne(user.id, id);
  }

  // Mark as paid
  @Patch('invoices/:id/pay')
  markPaid(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod: PaymentMethod,
  ): Promise<any> {
    return this.service.markPaid(user.id, id, paymentMethod);
  }

  // Cancel invoice
  @Patch('invoices/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<any> {
    return this.service.cancel(user.id, id);
  }
}
