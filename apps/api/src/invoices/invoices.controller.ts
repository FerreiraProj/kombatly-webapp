import {
  Controller, Post, Patch, Get, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller()
export class InvoicesController {
  constructor(private service: InvoicesService) {}

  @Post('tournaments/:tournamentId/invoices')
  @ApiOperation({ summary: 'Generate invoice for a club in a tournament' })
  @ApiBody({ type: GenerateInvoiceDto })
  @ApiResponse({ status: 201, description: 'Invoice generated.' })
  generate(
    @CurrentUser() user: { id: string },
    @Param('tournamentId') tournamentId: string,
    @Body() dto: GenerateInvoiceDto,
  ): Promise<any> {
    return this.service.generate(user.id, tournamentId, dto.clubUserId, dto.notes);
  }

  @Get('tournaments/:tournamentId/invoices')
  @ApiOperation({ summary: 'List invoices for a tournament (promoter)' })
  @ApiResponse({ status: 200, description: 'List of invoices.' })
  findForTournament(
    @CurrentUser() user: { id: string },
    @Param('tournamentId') tournamentId: string,
  ): Promise<any[]> {
    return this.service.findForTournament(user.id, tournamentId);
  }

  @Get('invoices/me')
  @ApiOperation({ summary: 'List my invoices (club view)' })
  @ApiResponse({ status: 200, description: 'List of invoices.' })
  findMine(@CurrentUser() user: { id: string }): Promise<any[]> {
    return this.service.findMine(user.id);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get a single invoice' })
  @ApiResponse({ status: 200, description: 'Invoice detail.' })
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<any> {
    return this.service.findOne(user.id, id);
  }

  @Patch('invoices/:id/pay')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiBody({ type: PayInvoiceDto })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid.' })
  markPaid(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: PayInvoiceDto,
  ): Promise<any> {
    return this.service.markPaid(user.id, id, dto.paymentMethod);
  }

  @Patch('invoices/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled.' })
  cancel(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<any> {
    return this.service.cancel(user.id, id);
  }
}
