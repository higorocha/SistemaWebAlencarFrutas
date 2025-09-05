import { ApiProperty } from '@nestjs/swagger';
import { TipoNotificacao, PrioridadeNotificacao } from './create-notificacao.dto';

export enum StatusNotificacao {
  NAO_LIDA = 'NAO_LIDA',
  LIDA = 'LIDA',
  DESCARTADA = 'DESCARTADA',
}

export class NotificacaoResponseDto {
  @ApiProperty({
    description: 'ID da notificação',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Título da notificação',
    example: 'Novo pagamento recebido',
  })
  titulo: string;

  @ApiProperty({
    description: 'Conteúdo da notificação',
    example: 'O cliente João Silva realizou um pagamento de R$ 150,00',
  })
  conteudo: string;

  @ApiProperty({
    description: 'Tipo da notificação',
    enum: TipoNotificacao,
    example: TipoNotificacao.BOLETO,
  })
  tipo: TipoNotificacao;

  @ApiProperty({
    description: 'Status da notificação',
    enum: StatusNotificacao,
    example: StatusNotificacao.NAO_LIDA,
  })
  status: StatusNotificacao;

  @ApiProperty({
    description: 'Prioridade da notificação',
    enum: PrioridadeNotificacao,
    example: PrioridadeNotificacao.MEDIA,
  })
  prioridade: PrioridadeNotificacao;

  @ApiProperty({
    description: 'ID do usuário destinatário',
    example: 1,
    required: false,
  })
  usuarioId?: number;

  @ApiProperty({
    description: 'Dados adicionais em formato JSON',
    example: { valor: 150.00, cliente: 'João Silva' },
    required: false,
  })
  dadosAdicionais?: Record<string, any>;

  @ApiProperty({
    description: 'Link relacionado à notificação',
    example: 'https://exemplo.com/detalhes',
    required: false,
  })
  link?: string;

  @ApiProperty({
    description: 'Data de expiração da notificação',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  expirarEm?: Date;

  @ApiProperty({
    description: 'Data de criação da notificação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização da notificação',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
} 