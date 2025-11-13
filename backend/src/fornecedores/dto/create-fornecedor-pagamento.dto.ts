import { IsString, IsOptional, IsEnum, IsNumber, IsPositive, IsNotEmpty, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadeMedida, StatusPagamentoFornecedor } from '@prisma/client';

export class CreateFornecedorPagamentoDto {
  @ApiProperty({
    description: 'ID do fornecedor',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  fornecedorId: number;

  @ApiProperty({
    description: 'ID da área do fornecedor',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  areaFornecedorId: number;

  @ApiProperty({
    description: 'ID do pedido',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  pedidoId: number;

  @ApiProperty({
    description: 'ID da fruta',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  frutaId: number;

  @ApiProperty({
    description: 'ID da relação fruta-pedido',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  frutaPedidoId: number;

  @ApiProperty({
    description: 'ID da relação área (FrutasPedidosAreas) - referencia exata à colheita',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  frutaPedidoAreaId: number;

  @ApiProperty({
    description: 'Quantidade colhida',
    example: 500.5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantidade: number;

  @ApiProperty({
    description: 'Unidade de medida da quantidade',
    enum: UnidadeMedida,
    example: 'KG',
  })
  @IsEnum(UnidadeMedida)
  @IsNotEmpty()
  unidadeMedida: UnidadeMedida;

  @ApiProperty({
    description: 'Valor unitário do pagamento',
    example: 5.50,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  valorUnitario: number;

  @ApiProperty({
    description: 'Valor total do pagamento',
    example: 2750.0,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  valorTotal: number;

  @ApiPropertyOptional({
    description: 'Data da colheita',
    example: '2024-12-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dataColheita?: string;

  @ApiProperty({
    description: 'Data do pagamento',
    example: '2024-12-20T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dataPagamento: string;

  @ApiProperty({
    description: 'Forma de pagamento',
    example: 'PIX',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  formaPagamento: string;

  @ApiPropertyOptional({
    description: 'Observações gerais',
    example: 'Pagamento realizado via PIX',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Status do pagamento (PENDENTE, PROCESSANDO, PAGO). Se não informado, será PAGO por padrão',
    enum: StatusPagamentoFornecedor,
    example: StatusPagamentoFornecedor.PAGO,
  })
  @IsOptional()
  @IsEnum(StatusPagamentoFornecedor)
  status?: StatusPagamentoFornecedor;
}

