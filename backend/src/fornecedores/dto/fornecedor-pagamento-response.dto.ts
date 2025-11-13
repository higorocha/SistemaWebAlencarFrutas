import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadeMedida, StatusPagamentoFornecedor } from '@prisma/client';

export class FornecedorPagamentoResponseDto {
  @ApiProperty({
    description: 'ID do pagamento',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID do fornecedor',
    example: 1,
  })
  fornecedorId: number;

  @ApiProperty({
    description: 'ID da área do fornecedor',
    example: 1,
  })
  areaFornecedorId: number;

  @ApiProperty({
    description: 'ID do pedido',
    example: 1,
  })
  pedidoId: number;

  @ApiProperty({
    description: 'ID da fruta',
    example: 1,
  })
  frutaId: number;

  @ApiProperty({
    description: 'ID da relação fruta-pedido',
    example: 1,
  })
  frutaPedidoId: number;

  @ApiProperty({
    description: 'ID da relação área (FrutasPedidosAreas)',
    example: 1,
  })
  frutaPedidoAreaId: number;

  @ApiProperty({
    description: 'Quantidade colhida',
    example: 500.5,
  })
  quantidade: number;

  @ApiProperty({
    description: 'Unidade de medida da quantidade',
    enum: UnidadeMedida,
    example: 'KG',
  })
  unidadeMedida: UnidadeMedida;

  @ApiProperty({
    description: 'Valor unitário do pagamento',
    example: 5.50,
  })
  valorUnitario: number;

  @ApiProperty({
    description: 'Valor total do pagamento',
    example: 2750.0,
  })
  valorTotal: number;

  @ApiPropertyOptional({
    description: 'Data da colheita',
    example: '2024-12-15T08:00:00Z',
  })
  dataColheita?: Date | null;

  @ApiProperty({
    description: 'Status do pagamento',
    enum: StatusPagamentoFornecedor,
    example: 'PAGO',
  })
  status: StatusPagamentoFornecedor;

  @ApiProperty({
    description: 'Data do pagamento',
    example: '2024-12-20T10:00:00Z',
  })
  dataPagamento: Date;

  @ApiProperty({
    description: 'Forma de pagamento',
    example: 'PIX',
  })
  formaPagamento: string;

  @ApiPropertyOptional({
    description: 'Observações gerais',
    example: 'Pagamento realizado via PIX',
  })
  observacoes?: string | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-12-20T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-12-20T10:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Informações do fornecedor relacionado',
  })
  fornecedor?: {
    id: number;
    nome: string;
    cnpj?: string | null;
    cpf?: string | null;
  };

  @ApiPropertyOptional({
    description: 'Informações da área do fornecedor relacionada',
  })
  areaFornecedor?: {
    id: number;
    nome: string;
  };

  @ApiPropertyOptional({
    description: 'Informações do pedido relacionado',
  })
  pedido?: {
    id: number;
    numeroPedido: string;
    cliente: {
      nome: string;
      razaoSocial?: string | null;
    };
  };

  @ApiPropertyOptional({
    description: 'Informações da fruta relacionada',
  })
  fruta?: {
    id: number;
    nome: string;
  };
}

