import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateInvoiceDto {
  @ApiProperty({ description: 'User ID of the club to invoice' })
  @IsString()
  @IsNotEmpty()
  clubUserId: string;

  @ApiPropertyOptional({ description: 'Optional notes for the invoice' })
  @IsOptional()
  @IsString()
  notes?: string;
}
