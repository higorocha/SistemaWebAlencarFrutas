import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MeioPagamentoFuncionario } from '@prisma/client';

export class FinalizarFolhaDto {
  @ApiProperty({
    enum: MeioPagamentoFuncionario,
    description: 'Meio de pagamento que será aplicado para todos os lançamentos',
    example: MeioPagamentoFuncionario.PIX,
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
    description: 'Observações sobre a folha/pagamento',
    required: false,
    example: 'Folha referente à primeira quinzena',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}


