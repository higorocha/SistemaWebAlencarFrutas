import { IsInt, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para processamento de pagamentos da folha via PIX-API
 * Usado quando o meio de pagamento selecionado é PIX_API
 */
export class ProcessarPagamentoPixApiDto {
  @ApiProperty({
    description: 'ID da conta corrente para débito dos pagamentos',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  contaCorrenteId: number;

  @ApiProperty({
    description: 'Data do pagamento (formato ISO 8601)',
    example: '2025-11-25',
  })
  @IsDateString()
  @IsNotEmpty()
  dataPagamento: string;

  @ApiPropertyOptional({
    description: 'Observações sobre o lote de pagamentos',
    example: 'Pagamento da folha quinzenal - Novembro/2025',
  })
  @IsOptional()
  observacoes?: string;
}

