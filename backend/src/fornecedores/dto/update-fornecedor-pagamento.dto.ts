import { IsString, IsOptional, IsEnum, IsNumber, IsPositive, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadeMedida, StatusPagamentoFornecedor } from '@prisma/client';

export class UpdateFornecedorPagamentoDto {
  @ApiPropertyOptional({
    description: 'Quantidade colhida',
    example: 500.5,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantidade?: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida da quantidade',
    enum: UnidadeMedida,
    example: 'KG',
  })
  @IsOptional()
  @IsEnum(UnidadeMedida)
  unidadeMedida?: UnidadeMedida;

  @ApiPropertyOptional({
    description: 'Valor unitário do pagamento',
    example: 5.50,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorUnitario?: number;

  @ApiPropertyOptional({
    description: 'Valor total do pagamento',
    example: 2750.0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorTotal?: number;

  @ApiPropertyOptional({
    description: 'Data da colheita',
    example: '2024-12-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dataColheita?: string;

  @ApiPropertyOptional({
    description: 'Data do pagamento',
    example: '2024-12-20T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @ApiPropertyOptional({
    description: 'Forma de pagamento',
    example: 'PIX',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  formaPagamento?: string;

  @ApiPropertyOptional({
    description: 'Observações gerais',
    example: 'Pagamento realizado via PIX',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Status do pagamento',
    enum: StatusPagamentoFornecedor,
    example: 'PAGO',
  })
  @IsOptional()
  @IsEnum(StatusPagamentoFornecedor)
  status?: StatusPagamentoFornecedor;
}

