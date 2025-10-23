import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TurmaColheitaResponseDto {
  @ApiProperty({
    description: 'ID da turma de colheita',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome da pessoa que colhe',
    example: 'João Silva',
  })
  nomeColhedor: string;

  @ApiPropertyOptional({
    description: 'Chave PIX do colhedor',
    example: 'joao.silva@email.com',
  })
  chavePix?: string | null;

  @ApiPropertyOptional({
    description: 'Responsável pela chave PIX',
    example: 'Maria Santos',
  })
  responsavelChavePix?: string | null;

  @ApiProperty({
    description: 'Data de cadastro da turma',
    example: '2024-12-15T10:00:00Z',
  })
  dataCadastro: Date;

  @ApiPropertyOptional({
    description: 'Observações sobre a turma de colheita',
    example: 'Turma especializada em colheita de frutas tropicais',
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
    description: 'Lista de custos de colheita específicos por pedido',
    example: [{
      id: 1,
      pedidoId: 1,
      frutaId: 1,
      quantidadeColhida: 500.5,
      unidadeMedida: 'KG',
      valorColheita: 2500.0,
      dataColheita: '2024-12-15T08:00:00Z',
      pagamentoEfetuado: false
    }],
  })
  custosColheita?: Array<{
    id: number;
    pedidoId: number;
    frutaId: number;
    quantidadeColhida: number;
    unidadeMedida: string;
    valorColheita: number | null;
    dataColheita: Date | null;
    pagamentoEfetuado: boolean;
    observacoes: string | null;
    pedido?: {
      numeroPedido: string;
      status: string;
      dataPedido: Date;
    };
    fruta?: {
      nome: string;
      cultura?: {
        id: number;
        descricao: string;
      };
    };
  }>;
}