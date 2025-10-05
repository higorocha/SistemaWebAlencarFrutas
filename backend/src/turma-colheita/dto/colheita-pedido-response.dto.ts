import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadeMedida } from '@prisma/client';

export class TurmaColheitaPedidoCustoResponseDto {
  @ApiProperty({
    description: 'ID do custo de colheita',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID da turma de colheita',
    example: 1,
  })
  turmaColheitaId: number;

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
    description: 'Quantidade colhida',
    example: 500.5,
  })
  quantidadeColhida: number;

  @ApiProperty({
    description: 'Unidade de medida da quantidade',
    enum: UnidadeMedida,
    example: 'KG',
  })
  unidadeMedida: UnidadeMedida;

  @ApiPropertyOptional({
    description: 'Valor pago pela colheita',
    example: 2500.0,
  })
  valorColheita?: number | null;

  @ApiPropertyOptional({
    description: 'Data da colheita específica',
    example: '2024-12-15T08:00:00Z',
  })
  dataColheita?: Date | null;

  @ApiProperty({
    description: 'Se o pagamento foi efetuado',
    example: false,
  })
  pagamentoEfetuado: boolean;

  @ApiPropertyOptional({
    description: 'Observações específicas da colheita',
    example: 'Colheita realizada em boas condições climáticas',
  })
  observacoes?: string | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-12-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-12-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Informações da turma de colheita relacionada',
    example: {
      nomeColhedor: 'João Silva',
      chavePix: 'joao.silva@email.com'
    },
  })
  turmaColheita?: {
    nomeColhedor: string;
    chavePix: string | null;
    dataCadastro: Date;
  };

  @ApiPropertyOptional({
    description: 'Informações do pedido relacionado',
    example: {
      numeroPedido: 'PED-2024-0001',
      status: 'COLHEITA_REALIZADA',
      dataPedido: '2024-12-15T10:00:00Z'
    },
  })
  pedido?: {
    numeroPedido: string;
    status: string;
    dataPedido: Date;
  };

  @ApiPropertyOptional({
    description: 'Informações da fruta relacionada',
    example: {
      nome: 'Banana Prata',
      categoria: 'TROPICAIS'
    },
  })
  fruta?: {
    nome: string;
    cultura?: {
      id: number;
      descricao: string;
    };
  };
}