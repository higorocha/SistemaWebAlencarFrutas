import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MeioPagamentoFuncionario } from '@prisma/client';

export class ReprocessarPagamentosRejeitadosDto {
  @ApiProperty({
    enum: MeioPagamentoFuncionario,
    description: 'Meio de pagamento para reprocessar os pagamentos rejeitados',
    example: MeioPagamentoFuncionario.PIX_API,
  })
  @IsEnum(MeioPagamentoFuncionario)
  @IsNotEmpty({ message: 'O meio de pagamento é obrigatório' })
  meioPagamento: MeioPagamentoFuncionario;

  @ApiProperty({
    description: 'Data prevista de pagamento em formato ISO8601',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty({ message: 'A data de pagamento é obrigatória' })
  dataPagamento: string;

  @ApiProperty({
    description: 'ID da conta corrente para débito (obrigatório quando meioPagamento = PIX_API)',
    required: false,
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  contaCorrenteId?: number;

  @ApiProperty({
    description: 'Observações sobre o reprocessamento',
    required: false,
    example: 'Reprocessamento devido a itens bloqueados no lote anterior',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

